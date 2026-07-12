# StadiumPulse

GenAI-powered wayfinding and ops intelligence for stadium match days.

I built this to explore what a stadium's crowd and incident data looks like when an LLM is doing real reasoning over it — not just answering FAQs, but actually re-ranking routes around live congestion and triaging incident reports before a human opens the form.

StadiumPulse is designed as a **venue nervous system**: one crowd signal powers fan routing, a selectable 3D operations twin, predictive staff decisions, and incident automation instead of feeding unrelated AI widgets.

The app has two surfaces in one React build:

- **Fan Experience PWA**: multilingual voice concierge, accessibility-aware wayfinding, seat-view confidence previews, and sustainable travel suggestions.
- **Ops Console**: live selectable 3D crowd twin, ranked 15-minute command digest, density forecasts, incident drafts, and volunteer briefings for staff and volunteers.

## Connected Demo

Open `/demo` locally or visit [https://stadiumpulse.pages.dev/demo](https://stadiumpulse.pages.dev/demo) for the read-only FIFA World Cup 2026 walkthrough. It connects the browser to `GET /api/demo`, reads the seeded Supabase scenario, and presents an animated crowd twin, an accessible route, multilingual concierge examples, sustainable transport guidance, and staff decision support without requiring an account or consuming Gemini quota.

The demo preview is intentionally curated and labeled synthetic. Authenticated routes remain the proof path for live Gemini generation and role-protected staff actions.

## Running Locally

Backend:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Frontend:

```powershell
cd frontend
npm ci
npm run dev
```

Use `backend/.env.example` and `frontend/.env.example` as the placeholder list for local environment variables. Do not commit real `.env` files.

## Live Deployment

- Frontend: [https://stadiumpulse.pages.dev](https://stadiumpulse.pages.dev)
- Backend: [https://stadiumpulse-d7js.onrender.com](https://stadiumpulse-d7js.onrender.com)
- Backend health: [https://stadiumpulse-d7js.onrender.com/health](https://stadiumpulse-d7js.onrender.com/health)

## Verification

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
.\.venv\Scripts\python.exe -m pytest --cov=. --cov-fail-under=100
```

Frontend:

```powershell
cd frontend
npm ci
npx eslint .
npx prettier --check .
npx vitest run
npx tsc --noEmit
npm run build
```

## Project Notes

- Supabase Auth creates the browser identity; `/api/auth/bootstrap` creates the backend profile after sign-in.
- Staff and volunteer roles live in `public.user_roles`; `backend/scripts/grant_role.py` updates them with the Supabase service role. Supabase's custom access-token hook must be enabled so those rows become the `user_role` JWT claim used by the app.
- The dashboard refreshes backend-computed bands from a Supabase Realtime change signal; operations mutations still go through FastAPI and re-check roles server-side.
- Seed and animated crowd data are synthetic demo data. The UI labels them as simulated; no screen represents them as physical venue sensors.
- The public demo endpoint is read-only and rate-limited. It exposes only the synthetic scenario; staff mutations and Gemini calls stay authenticated.
- Forecast bands are deterministic from recent readings. Gemini explains the fixed projection and recommends an action but cannot change the computed number or band.
- Command-center recommendations are decision support only. The app never executes crowd-control actions, and the dashboard marks every ranked action as requiring supervisor approval.

## Known Limitations and Dependency Notes

**In-memory rate limiter**: The backend rate limiter uses `slowapi`'s in-memory storage. That works fine for a single Render instance, but under multiple instances each instance has its own counter. Production-scale deployments should move rate limit state to a shared store such as Redis.

**`pytest-asyncio` major-version pin**: `requirements.txt` pins `pytest-asyncio==1.4.0`. That version's `asyncio_mode = auto` setting (in `pytest.ini`) is what makes async tests run without per-test decorators. Upgrading to a different major version changes the config key name; don't bump this without verifying the existing tests still run correctly.

**TypeScript / typescript-eslint peer range**: `frontend/.npmrc` sets `legacy-peer-deps=true`. This project uses `typescript@6.0.3`; the current `typescript-eslint` peer range still expects TypeScript below 6. This is a dependency resolver compatibility issue — the linting and type checking both work correctly at runtime — but `npm ci` will fail without `legacy-peer-deps=true` until `typescript-eslint` formally widens its peer declaration.

Deployment setup is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). API routes are summarized in [docs/API.md](docs/API.md).
