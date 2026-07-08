# StadiumPulse

GenAI-powered wayfinding and ops intelligence for stadium match days.

I built this to explore what a stadium's crowd and incident data looks like when an LLM is doing real reasoning over it - not just answering FAQs, but actually re-ranking routes around live congestion and triaging incident reports before a human opens the form.

The app has two surfaces in one React build:

- Fan Experience PWA: multilingual concierge, accessibility-aware wayfinding, and sustainable travel suggestions.
- Ops Console: live crowd intelligence, incident drafts, and volunteer briefings for staff and volunteers.

Fair warning: the backend rate limiter is in-memory, which is fine for a single Cloud Run instance and not fine at real scale. That limitation is documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), not hidden.

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

- Firebase Auth creates the browser identity; `/api/auth/bootstrap` creates the backend user profile after sign-in.
- Staff and volunteer role claims are granted out of band with `backend/scripts/grant_role.py`.
- The dashboard reads raw zone density through Firestore security rules; operations mutations still go through FastAPI and re-check roles server-side.
- Seed data is synthetic demo data. It lives in `backend/seed/seed_data.py` and is labeled that way in the content guide.

Deployment setup is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). API routes are summarized in [docs/API.md](docs/API.md).
