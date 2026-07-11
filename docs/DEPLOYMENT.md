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

Enable these Auth providers in Supabase:

- Anonymous sign-in
- Email/password
- Google OAuth

The migration installs `public.custom_access_token_hook`. Configure it as the Supabase custom access token hook so JWTs include `user_role`. The frontend reads that claim for UX gating; FastAPI verifies the same claim server-side for staff and volunteer authorization.

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
SUPABASE_JWKS_URL=
SUPABASE_JWT_SECRET=
ALLOWED_ORIGINS=https://<cloudflare-pages-domain>
GEMINI_API_KEY=<gemini-developer-api-key>
GEMINI_MODEL_PRIMARY=gemini-2.5-flash
GEMINI_MODEL_LITE=gemini-2.5-flash-lite
LOG_LEVEL=INFO
```

Use `SUPABASE_JWKS_URL` or `SUPABASE_JWT_SECRET` for JWT verification. JWKS is preferred for asymmetric Supabase signing keys; the legacy shared JWT secret path remains supported for projects that still use HS256.

After Render creates the service, copy the deploy hook URL and health URL into GitHub secrets:

| Secret | Purpose |
| ------ | ------- |
| `RENDER_DEPLOY_HOOK_URL` | `deploy.yml` calls this after backend tests pass. |
| `RENDER_HEALTH_URL` | `keep-alive.yml` pings this every three days. |

## Frontend on Cloudflare Pages

Create a Cloudflare Pages project named `stadiumpulse`. The GitHub deploy workflow builds `frontend/dist` and uploads it with Wrangler.

Set these GitHub secrets:

| Secret | Purpose |
| ------ | ------- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account for Pages upload. |
| `CLOUDFLARE_API_TOKEN` | Token with Cloudflare Pages edit permissions. |
| `VITE_SUPABASE_URL` | Supabase project URL for the browser client. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key for browser auth and Realtime. |
| `VITE_API_BASE_URL` | Public Render backend base URL. |

Cloudflare Pages should serve the Vite app directly. API calls go to Render through `VITE_API_BASE_URL`; do not add a Firebase-style `/api/**` rewrite.

## Role Grants

Sign in once so Supabase creates the Auth user, then grant staff or volunteer access:

```bash
cd backend
python scripts/grant_role.py <supabase-user-uuid> staff
```

The script updates `public.user_roles` and `public.profiles.role` inside a `service_role` transaction. Sign out and back in after changing a role so the access token receives the new `user_role` claim.

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
- Anonymous sign-in works.
- Staff routes only work after `user_role` is present in the Supabase access token.
- The ops dashboard receives zone updates from Supabase Realtime.

## Known Limitation

The backend rate limiter uses `slowapi` in-memory storage. That is acceptable for a single Render instance, but multiple instances would each have a separate counter. A production-scale deployment should move rate limit state to a shared store such as Redis.
