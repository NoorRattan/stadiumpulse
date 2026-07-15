# StadiumPulse

Connected wayfinding and operations intelligence for safer, calmer stadium match days.

StadiumPulse explores what happens when crowd, route, travel, and incident context becomes one shared match-day signal. It uses GenAI to explain deterministic decisions—not to invent safety-critical values or take operational action.

StadiumPulse is designed as a **venue nervous system**: one crowd signal powers fan routing, a selectable operations map, predictive staff decisions, and incident automation instead of feeding unrelated AI widgets.

## Challenge 04 — Smart Stadiums & Tournament Operations

The **Smart Stadiums & Tournament Operations** brief asks for a GenAI-powered
solution that improves stadium operations and the FIFA World Cup 2026
experience through intelligent, real-time assistance. It specifically spans
navigation, crowd management, accessibility, transportation, sustainability,
multilingual assistance, operational intelligence, and real-time decision
support. Every domain has a publicly reviewable proof route:

| Brief domain               | Deployed proof                                                                  | What StadiumPulse demonstrates                                                                           |
| -------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Navigation                 | [Plan a route](https://stadiumpulse.pages.dev/wayfinding)                       | Least-congested, step-free wayfinding with deterministic fallback routing and clear route steps          |
| Crowd management           | [Use the connected crowd demo](https://stadiumpulse.pages.dev/demo)             | Selectable venue zones, live density bands, 15-minute forecasts, and ranked pressure signals             |
| Accessibility              | [Open the accessibility hub](https://stadiumpulse.pages.dev/accessibility)      | High contrast, reduced motion, screen-reader support, route preferences, and accessible-arrival guidance |
| Transportation             | [Compare match-day travel](https://stadiumpulse.pages.dev/travel)               | Rail, shuttle, park-and-ride, carpool, and accessible travel suggestions                                 |
| Sustainability             | [Review sustainability guidance](https://stadiumpulse.pages.dev/sustainability) | Lower-impact travel choices and clearly labelled match-day sustainability metrics                        |
| Multilingual assistance    | [Ask the live concierge](https://stadiumpulse.pages.dev/concierge)              | Rate-limited multilingual chat, voice input, read-aloud replies, and grounded venue guidance             |
| Operational intelligence   | [Run the public operations replay](https://stadiumpulse.pages.dev/demo)         | Crowd intelligence plus safe, interactive Incident Copilot and Briefing Generator replays                |
| Real-time decision support | [Inspect the ranked command digest](https://stadiumpulse.pages.dev/demo)        | Supabase-backed signals, deterministic rankings, AI explanations, and explicit human approval boundaries |

The same React application serves every audience named by the brief while
keeping operational mutations role-gated:

| Audience    | Deployed entry point                                          | Relevant experience                                                                                  |
| ----------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Fans        | [Fan match-day cockpit](https://stadiumpulse.pages.dev/fan)   | Tickets, matches, alerts, amenities, concierge, accessible routing, and travel planning              |
| Organizers  | [Organizer cockpit](https://stadiumpulse.pages.dev/organizer) | Event priorities, readiness signals, approvals, and cross-venue operational context                  |
| Volunteers  | [Volunteer cockpit](https://stadiumpulse.pages.dev/volunteer) | Shift tasks, training, briefings, and clear escalation context                                       |
| Venue staff | [Venue staff cockpit](https://stadiumpulse.pages.dev/staff)   | Crowd pressure, service queues, incidents, recommended actions, and supervisor-controlled operations |

## Experience Map

- **Public fan experience**: landing ticker and quick actions, match schedule with official FIFA ticket handoff, venue/gate/seating finder, multilingual concierge, live wayfinding, transport and park-and-ride guidance, accessibility hub, amenities, fan events, sustainability metrics, alerts, and FAQ.
- **Signed-in account**: clearly labelled demo passes, language and accessibility preferences backed by the API, fan shortcuts, and sign-out.
- **Role portals**: volunteer schedules/tasks/training; organizer priorities; venue-team queues for security, medical, cleaning, crowd, and guest services; and an explainable command-center recommendation view for staff.
- **Support and policy**: About, Contact, Privacy, and Terms pages with direct product, safety, AI, and data boundaries.

Advanced capabilities use the project's existing GenAI concierge, route explanations, predictive crowd narratives, incident summaries, and shift briefings. Camera AR, physical sensor/CCTV/social ingestion, official ticket issuance, and autonomous venue control are not represented as live: this repository does not have those physical feeds or commercial integrations, and all such operational data remains explicitly simulated.

## Product principles

- **Task first on mobile**: the landing experience starts with route planning, venue help, and arrival planning instead of an icon-only dashboard.
- **Useful before sign-in**: fans can ask the rate-limited, stateless concierge immediately; signing in adds persistent conversation context.
- **Deterministic before generative**: the backend computes density bands, forecasts, and route choices; Groq explains or translates those fixed results.
- **Human approval for operations**: incident drafts, crowd actions, and briefings remain decision support. StadiumPulse never executes a venue action.
- **Honest demo state**: public scenario data is synthetic and labelled as such everywhere it appears.
- **Accessible by default**: labelled navigation, keyboard focus, high-contrast and reduced-motion controls, route preferences, voice input, and read-aloud replies are built into the shared shell.

## Connected Demo

Open `/demo` locally or visit [https://stadiumpulse.pages.dev/demo](https://stadiumpulse.pages.dev/demo) for the read-only FIFA World Cup 2026 walkthrough. It connects the browser to `GET /api/demo`, reads the seeded Supabase scenario, and presents a selectable venue map, an accessible route, multilingual concierge examples, sustainable transport guidance, and staff decision support without requiring an account or consuming Groq quota.

The demo preview is intentionally curated and labeled synthetic. It includes safe, interactive replays of the Incident Copilot and Briefing Generator so an anonymous reviewer can complete both review-first workflows without creating shared records. The public concierge is the proof path for live Groq generation; real staff mutations remain authenticated.

A ready-to-publish technical narrative is available in [docs/BUILD_IN_PUBLIC.md](docs/BUILD_IN_PUBLIC.md). Publishing and attaching its public URL to the submission remains a human submission step.

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

Current local verification snapshot (2026-07-15): **151 backend tests passed at 100% statement and branch coverage**, **69 frontend tests passed across 35 test files with an enforced coverage-regression gate and zero React test warnings**, and **63 Playwright checks passed with zero skips or fixmes**. Forty interaction and responsive checks run across Chromium, Firefox, WebKit, Pixel 7, and iPhone 13; a dedicated Chromium project runs 23 all-severity axe scans across every public, support, and authentication route. The suite also proves both anonymous no-write GenAI operations generators, multilingual concierge and voice input on every profile, protected-route redirects, keyboard venue-map use, OS and app reduced motion, theme persistence, heading structure, and horizontal overflow. Production and test dependency audits report no known Python or npm vulnerabilities.

Maintainability checks are equally explicit: the permanent ESLint and Python
complexity/function/file-size gates pass with zero warnings or violations; Knip
reports zero unused files or exports; and jscpd reports zero production clones
and 0.73% test-only duplication overall.

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m pip_audit -r requirements-prod.txt
.\.venv\Scripts\python.exe -m pip_audit -r requirements.txt
```

Frontend:

```powershell
cd frontend
npm ci
npx eslint .
npx prettier --check .
npm run contrast:check
npm run test:coverage
npx tsc --noEmit
npm run build
npm run bundle:check
npm run audit:prod
npx knip
npm run test:e2e
```

## Project Notes

- Supabase Auth creates the browser identity; `/api/auth/signup` creates confirmed email/password accounts without an email verification step, and `/api/auth/bootstrap` creates or reads the backend profile after sign-in.
- Successful sign-in opens `/account`, where users can confirm their identity and role, reach fan or authorized operations tools, and sign out. Signed-in navigation keeps this account destination visible.
- Staff and volunteer roles live in `public.user_roles`; `backend/scripts/grant_role.py` updates them with the Supabase service role. Supabase's custom access-token hook must be enabled so those rows become the `user_role` JWT claim used by the app.
- The dashboard refreshes backend-computed bands from a Supabase Realtime change signal; operations mutations still go through FastAPI and re-check roles server-side.
- Supabase Cron calls both `/health` and the database-backed `/api/demo` every ten minutes; GitHub Actions remains a best-effort fallback rather than the primary scheduler.
- Seed and animated crowd data are synthetic demo data. The UI labels them as simulated; no screen represents them as physical venue sensors.
- The public demo endpoint is read-only and rate-limited. The public concierge is rate-limited and stateless, while signed-in sessions retain recent conversation context. Fan wayfinding and travel routes also work without an account by returning deterministic fallback content; signed-in users can receive Groq-enhanced descriptions. Staff mutations stay authenticated.
- Forecast bands are deterministic from recent readings. Groq explains the fixed projection and recommends an action but cannot change the computed number or band.
- Command-center recommendations are decision support only. The app never executes crowd-control actions, and the dashboard marks every ranked action as requiring supervisor approval.

## Known Limitations and Dependency Notes

**In-memory rate limiter**: The backend rate limiter uses `slowapi`'s in-memory storage. That works fine for a single Render instance, but under multiple instances each instance has its own counter. Production-scale deployments should move rate limit state to a shared store such as Redis.

**`pytest-asyncio` configuration**: `requirements.txt` pins `pytest-asyncio==1.4.0`, and `backend/pyproject.toml` is the authoritative pytest configuration. Its `asyncio_mode = "auto"` setting runs async tests without per-test decorators; dependency upgrades must preserve that behavior and the branch-coverage gate.

**TypeScript compatibility**: the frontend uses `typescript@5.9.3` with `typescript-eslint@8.49.0`, inside the supported peer range. The lockfile installs with normal `npm ci`; no `legacy-peer-deps` bypass is committed. Upgrade TypeScript and typescript-eslint together so linting and type-aware rules remain supported.

Deployment setup is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). API routes are summarized in [docs/API.md](docs/API.md). The latest maintainability review and prevention rules are recorded in [docs/CODE_QUALITY_POSTMORTEM.md](docs/CODE_QUALITY_POSTMORTEM.md).
