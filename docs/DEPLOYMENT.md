# Deployment

StadiumPulse deploys with:

- Supabase for Auth, Postgres, RLS, and Realtime.
- Render for the FastAPI backend.
- Cloudflare Pages for the Vite frontend.
- Groq API for AI calls.

There is no Firebase Hosting rewrite and no GCP/Firebase runtime dependency.

## Supabase Setup

Create a Supabase project, then apply every migration in filename order before loading seed data:

```bash
supabase db push
supabase db seed
```

If you are not using the Supabase CLI, run these files in the SQL editor in this exact order:

1. `supabase/migrations/0001_init.sql` — base tables, RLS policies, role-change trigger, and custom access-token hook.
2. `supabase/migrations/0002_crowd_realtime.sql` — adds `public.zones` to the Supabase Realtime publication used by the dashboard listener.
3. `supabase/migrations/0003_access_token_hook_privileges.sql` — lets `supabase_auth_admin` read authoritative roles and execute the access-token hook while browser roles cannot.
4. `supabase/migrations/0004_function_security_hardening.sql` — pins privileged functions to an empty `search_path`, revokes direct execution from `public`, `anon`, and `authenticated`, and preserves the hook grant for `supabase_auth_admin`.
5. `supabase/migrations/0005_render_keep_alive_cron.sql` — enables Supabase Cron and async HTTP, then schedules bounded `/health` and database-backed `/api/demo` requests every ten minutes.
6. `supabase/seed.sql` — loads the labelled synthetic demonstration scenario.

Existing deployments must apply every missing migration through `0005` in order. Migration `0004` is required even when the hook already works: it closes function-resolution and direct-execution gaps without changing the application role model. Migration `0005` is the primary warm-up scheduler; its named job is idempotently replaced when the migration is reapplied.

Enable Email/password Auth in Supabase for account creation and staff access:

- Email/password

The app creates email/password users through the FastAPI backend with `email_confirm=true`, so the browser signup flow does not require users to open a verification email. Keep the Supabase service-role key server-side only; it belongs in Render as `SUPABASE_SERVICE_ROLE_KEY` and must never be exposed through Vite or Cloudflare Pages.

Google OAuth is optional. If you enable it in Supabase, also set `VITE_ENABLE_GOOGLE_AUTH=true` for the frontend; otherwise the Google button stays hidden. Anonymous sign-in is not required for the public fan wayfinding and travel fallback flows.

The migration installs `public.custom_access_token_hook`, but Supabase does not call it until you enable it in the dashboard. In Supabase, open **Authentication -> Hooks -> Customize Access Token**, enable the hook, and select `public.custom_access_token_hook`. This is required for staff and volunteer access. The app intentionally ignores `app_metadata.user_role`; both frontend route gating and FastAPI authorization use only the `user_role` access-token claim generated from `public.user_roles`.

## Backend on Render

Create a Render Web Service from the `backend` directory.

Recommended settings:

```text
Runtime: Python 3
Build command: pip install -r requirements.txt
Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health check path: /health
```

Set these Render environment variables:

```text
ENVIRONMENT=production
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SUPABASE_JWKS_URL=
SUPABASE_JWT_SECRET=
SUPABASE_JWT_AUDIENCE=authenticated
ALLOWED_ORIGINS=https://<cloudflare-pages-domain>
GROQ_API_KEY=<groq-api-key>
GROQ_MODEL_PRIMARY=llama-3.1-8b-instant
GROQ_MODEL_LITE=llama-3.1-8b-instant
LOG_LEVEL=INFO
SIMULATE_CROWD_DATA=true
CROWD_SIMULATION_INTERVAL_SECONDS=20
```

The canonical `https://stadiumpulse.pages.dev` origin is pinned in the backend as a safe deployment fallback. Add preview or custom domains explicitly to `ALLOWED_ORIGINS`; wildcard origins remain rejected.

`SIMULATE_CROWD_DATA` is demo-only. It runs a bounded random walk, records each value as an `estimated` reading, and occasionally creates a high-pressure scenario. Keep it `false` when real venue telemetry is connected. A single Render instance should run the simulator so multiple replicas do not write competing demo signals.

Use `SUPABASE_JWKS_URL` or `SUPABASE_JWT_SECRET` for JWT verification. JWKS is preferred for asymmetric Supabase signing keys; the legacy shared JWT secret path remains supported for projects that still use HS256.

After Render creates the service, copy the deploy hook URL and health URL into GitHub secrets:

| Secret                   | Purpose                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `RENDER_DEPLOY_HOOK_URL` | `deploy.yml` calls this after the complete CI workflow succeeds on `main`, or during an authorized manual deploy. |
| `RENDER_HEALTH_URL`      | GitHub's fallback `keep-alive.yml` pings this URL.                                                                |

## CI-Gated Deployment

The `Deploy` workflow no longer starts directly on every push. A push to `main` first runs the complete `CI` workflow. GitHub then emits a `workflow_run` event when CI completes; both deployment jobs run only when that workflow concluded successfully and its source branch was `main`. The frontend job checks out the exact successful CI commit before building and uploading it, while the backend job invokes the Render deploy hook for that same release decision.

`workflow_dispatch` remains available for an intentional manual deployment. A failed or cancelled CI run creates no automatic deployment, and the deploy workflow does not duplicate the test matrix that CI already completed.

## Render Warm-Up Reliability

Supabase Cron is the active primary scheduler. The `stadiumpulse-render-keep-alive` job runs every ten minutes and enqueues two bounded HTTPS GET requests through `pg_net`: the process-only `/health` check and the database-backed `/api/demo` check. The second request prevents a shallow health response from hiding a sleeping or disconnected database path. Job execution is observable in `cron.job_run_details`; HTTP results are observable in `net._http_response`.

GitHub's **Keep Render Warm** workflow remains a best-effort independent fallback. GitHub explicitly does not guarantee exact scheduled execution, so it must not be treated as the primary ten-minute timer.

## Frontend on Cloudflare Pages

Create a Cloudflare Pages project named `stadiumpulse`. The GitHub deploy workflow builds `frontend/dist` and uploads it with Wrangler.

Set these GitHub secrets:

| Secret                    | Purpose                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`   | Cloudflare account for Pages upload.                                                   |
| `CLOUDFLARE_API_TOKEN`    | Token with Cloudflare Pages edit permissions.                                          |
| `VITE_SUPABASE_URL`       | Supabase project URL for the browser client.                                           |
| `VITE_SUPABASE_ANON_KEY`  | Supabase anon key for browser auth and Realtime. Do not use the service-role key here. |
| `VITE_API_BASE_URL`       | Public Render backend base URL.                                                        |
| `VITE_ENABLE_GOOGLE_AUTH` | Set to `true` only when Google OAuth is enabled.                                       |

The repository also includes an optional cron-only Cloudflare Worker with the
same two-check contract. It is not required while Supabase Cron is active. To
use it as another independent fallback, run **Deploy Keep-Alive Worker** with a
token that has **Account > Workers Scripts > Edit** in addition to Pages
permission.

Cloudflare Pages should serve the Vite app directly. API calls go to Render through `VITE_API_BASE_URL`; do not add a Firebase-style `/api/**` rewrite.

## Role Grants

Sign in once so Supabase creates the Auth user, then grant staff or volunteer access:

```bash
cd backend
python scripts/grant_role.py <supabase-user-uuid> staff
```

The script updates `public.user_roles` and `public.profiles.role` inside a `service_role` transaction. Sign out and back in after changing a role so the access token receives the new `user_role` claim. If the Supabase custom access-token hook is not enabled, the refreshed token will not contain `user_role`, and the user will remain a fan even though the database role row changed.

## Verification

Before pushing to `main`, run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
.\.venv\Scripts\python.exe -m pytest --cov=. --cov-fail-under=100
```

```powershell
cd frontend
npm ci
npx eslint .
npx prettier --check .
npx vitest run
npx tsc --noEmit
npm run build
```

After deployment, verify:

- Render `/health` returns `{"status":"ok"}`.
- Cloudflare Pages loads the app.
- Email signup creates a signed-in account immediately without an email verification step.
- Staff routes only work after `user_role` is present in the Supabase access token.
- A database-only role grant produces a refreshed access token whose decoded payload contains `user_role: "staff"` or `user_role: "volunteer"`.
- `supabase_realtime` publishes `public.zones` only; do not add `public.incidents`, `public.profiles`, `public.user_roles`, or briefing tables to the Realtime publication.
- The ops dashboard receives zone updates from Supabase Realtime.
- The dashboard visibly changes without a reload and labels the signal `Simulated demo signal`.
- `cron.job` contains one active `stadiumpulse-render-keep-alive` job on `*/10 * * * *`; its recent run details are successful and both queued HTTP responses return 2xx.
- Selecting a venue-map zone returns a real `/forecast` response with a deterministic projection and Groq-written action.
- Travel initially shows a guided selection state by design; selecting a match works publicly with curated descriptions and uses Groq-enhanced descriptions for signed-in users.

## Known Limitation

The backend rate limiter uses `slowapi` in-memory storage. That is acceptable for a single Render instance, but multiple instances would each have a separate counter. A production-scale deployment should move rate limit state to a shared store such as Redis.
