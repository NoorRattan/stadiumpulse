# StadiumPulse

Connected wayfinding and operations intelligence for safer, calmer stadium match days.

StadiumPulse explores what happens when crowd, route, travel, and incident context becomes one shared match-day signal. It uses GenAI to explain deterministic decisions—not to invent safety-critical values or take operational action.

StadiumPulse is designed as a **venue nervous system**: one crowd signal powers fan routing, a selectable operations map, predictive staff decisions, and incident automation instead of feeding unrelated AI widgets.

The app has two surfaces in one React build:

- **Fan Experience PWA**: multilingual voice concierge, accessibility-aware wayfinding, seat-view confidence previews, and sustainable travel suggestions.
- **Ops Console**: live selectable venue map, ranked 15-minute command digest, density forecasts, incident drafts, and volunteer briefings for staff and volunteers.

## Product principles

- **Task first on mobile**: the landing experience starts with route planning, venue help, and arrival planning instead of an icon-only dashboard.
- **Useful before sign-in**: fans can ask the rate-limited, stateless concierge immediately; signing in adds persistent conversation context.
- **Deterministic before generative**: the backend computes density bands, forecasts, and route choices; Groq explains or translates those fixed results.
- **Human approval for operations**: incident drafts, crowd actions, and briefings remain decision support. StadiumPulse never executes a venue action.
- **Honest demo state**: public scenario data is synthetic and labelled as such everywhere it appears.
- **Accessible by default**: labelled navigation, keyboard focus, high-contrast and reduced-motion controls, route preferences, voice input, and read-aloud replies are built into the shared shell.

## Connected Demo

Open `/demo` locally or visit [https://stadiumpulse.pages.dev/demo](https://stadiumpulse.pages.dev/demo) for the read-only FIFA World Cup 2026 walkthrough. It connects the browser to `GET /api/demo`, reads the seeded Supabase scenario, and presents a selectable venue map, an accessible route, multilingual concierge examples, sustainable transport guidance, and staff decision support without requiring an account or consuming Groq quota.

The demo preview is intentionally curated and labeled synthetic. The public concierge is the proof path for live Groq generation; role-protected staff actions remain authenticated.

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

Current local verification snapshot (2026-07-14): **128 backend tests passed at 100% statement coverage**, **35 frontend tests passed across 24 test files**, and **27 Playwright checks passed across Chromium, Firefox, WebKit, Pixel 7, and iPhone 13 profiles** (with three intentionally skipped duplicate axe scans). The browser suite checks every public route for serious or critical axe findings, heading structure, and horizontal overflow; it also verifies the public concierge conversation, protected account redirect, keyboard stadium-map interaction, skip navigation, and reduced motion. Production dependency audits report no known Python or npm vulnerabilities.

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
.\.venv\Scripts\python.exe -m pytest --cov=. --cov-fail-under=100
.\.venv\Scripts\python.exe -m pip_audit -r requirements-prod.txt
```

Frontend:

```powershell
cd frontend
npm ci
npx eslint .
npx prettier --check .
npm run contrast:check
npx vitest run
npx tsc --noEmit
npm run build
npm run audit:prod
npm run test:e2e
```

## Project Notes

- Supabase Auth creates the browser identity; `/api/auth/signup` creates confirmed email/password accounts without an email verification step, and `/api/auth/bootstrap` creates or reads the backend profile after sign-in.
- Successful sign-in opens `/account`, where users can confirm their identity and role, reach fan or authorized operations tools, and sign out. Signed-in navigation keeps this account destination visible.
- Staff and volunteer roles live in `public.user_roles`; `backend/scripts/grant_role.py` updates them with the Supabase service role. Supabase's custom access-token hook must be enabled so those rows become the `user_role` JWT claim used by the app.
- The dashboard refreshes backend-computed bands from a Supabase Realtime change signal; operations mutations still go through FastAPI and re-check roles server-side.
- Seed and animated crowd data are synthetic demo data. The UI labels them as simulated; no screen represents them as physical venue sensors.
- The public demo endpoint is read-only and rate-limited. The public concierge is rate-limited and stateless, while signed-in sessions retain recent conversation context. Fan wayfinding and travel routes also work without an account by returning deterministic fallback content; signed-in users can receive Groq-enhanced descriptions. Staff mutations stay authenticated.
- Forecast bands are deterministic from recent readings. Groq explains the fixed projection and recommends an action but cannot change the computed number or band.
- Command-center recommendations are decision support only. The app never executes crowd-control actions, and the dashboard marks every ranked action as requiring supervisor approval.

## Known Limitations and Dependency Notes

**In-memory rate limiter**: The backend rate limiter uses `slowapi`'s in-memory storage. That works fine for a single Render instance, but under multiple instances each instance has its own counter. Production-scale deployments should move rate limit state to a shared store such as Redis.

**`pytest-asyncio` major-version pin**: `requirements.txt` pins `pytest-asyncio==1.4.0`. That version's `asyncio_mode = auto` setting (in `pytest.ini`) is what makes async tests run without per-test decorators. Upgrading to a different major version changes the config key name; don't bump this without verifying the existing tests still run correctly.

**TypeScript / typescript-eslint peer range**: `frontend/.npmrc` sets `legacy-peer-deps=true`. This project uses `typescript@6.0.3`; the current `typescript-eslint` peer range still expects TypeScript below 6. This is a dependency resolver compatibility issue — the linting and type checking both work correctly at runtime — but `npm ci` will fail without `legacy-peer-deps=true` until `typescript-eslint` formally widens its peer declaration.

Deployment setup is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). API routes are summarized in [docs/API.md](docs/API.md).
