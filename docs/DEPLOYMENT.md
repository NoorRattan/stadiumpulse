# Deployment

StadiumPulse deploys with:

- Supabase for Auth, Postgres, RLS, and Realtime.
- Render for the FastAPI backend.
- Cloudflare Pages for the Vite frontend.
- Google Gemini Developer API for AI calls.

There is no Firebase Hosting rewrite and no GCP/Firebase runtime dependency.

## Supabase Setup

Create a Supabase project, then apply the schema and seed data:

```bash
supabase db push
supabase db seed
```

If you are not using the Supabase CLI, run `supabase/migrations/0001_init.sql` and then `supabase/seed.sql` in the SQL editor.
For an existing deployment, also run `supabase/migrations/0002_crowd_realtime.sql`. This adds `public.zones` to the Supabase Realtime publication used by the dashboard listener.

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
GEMINI_API_KEY=<gemini-developer-api-key>
GEMINI_MODEL_PRIMARY=gemini-2.5-flash
GEMINI_MODEL_LITE=gemini-3.1-flash-lite
LOG_LEVEL=INFO
SIMULATE_CROWD_DATA=true
CROWD_SIMULATION_INTERVAL_SECONDS=20
```

The canonical `https://stadiumpulse.pages.dev` origin is pinned in the backend as a safe deployment fallback. Add preview or custom domains explicitly to `ALLOWED_ORIGINS`; wildcard origins remain rejected.

`SIMULATE_CROWD_DATA` is demo-only. It runs a bounded random walk, records each value as an `estimated` reading, and occasionally creates a high-pressure scenario. Keep it `false` when real venue telemetry is connected. A single Render instance should run the simulator so multiple replicas do not write competing demo signals.

Use `SUPABASE_JWKS_URL` or `SUPABASE_JWT_SECRET` for JWT verification. JWKS is preferred for asymmetric Supabase signing keys; the legacy shared JWT secret path remains supported for projects that still use HS256.

After Render creates the service, copy the deploy hook URL and health URL into GitHub secrets:

| Secret                   | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `RENDER_DEPLOY_HOOK_URL` | `deploy.yml` calls this after backend tests pass. |
| `RENDER_HEALTH_URL`      | `keep-alive.yml` pings this every three days.     |

## Frontend on Cloudflare Pages

Create a Cloudflare Pages project named `stadiumpulse`. The GitHub deploy workflow builds `frontend/dist` and uploads it with Wrangler.

Set these GitHub secrets:

| Secret                    | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `CLOUDFLARE_ACCOUNT_ID`   | Cloudflare account for Pages upload.             |
| `CLOUDFLARE_API_TOKEN`    | Token with Cloudflare Pages edit permissions.    |
| `VITE_SUPABASE_URL`       | Supabase project URL for the browser client.     |
| `VITE_SUPABASE_ANON_KEY`  | Supabase anon key for browser auth and Realtime. Do not use the service-role key here. |
| `VITE_API_BASE_URL`       | Public Render backend base URL.                  |
| `VITE_ENABLE_GOOGLE_AUTH` | Set to `true` only when Google OAuth is enabled. |

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
- Selecting a 3D zone returns a real `/forecast` response with a deterministic projection and Gemini-written action.
- Travel initially shows a guided selection state by design; selecting a match works publicly with curated descriptions and uses Gemini-enhanced descriptions for signed-in users.

## Known Limitation

The backend rate limiter uses `slowapi` in-memory storage. That is acceptable for a single Render instance, but multiple instances would each have a separate counter. A production-scale deployment should move rate limit state to a shared store such as Redis.
