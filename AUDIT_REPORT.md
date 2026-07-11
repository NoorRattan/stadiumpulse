# StadiumPulse Session 9 Ground-Truth Audit

Audit date: 2026-07-12 (Asia/Calcutta)  
Repository: `N:\Github-Repo\stadiumpulse\stadiumpulse`  
Branch/remote state at audit start: `main...origin/main`, commit `ba0cf0b test: isolate supabase jwt settings in ci`, clean worktree.

## Executive finding

The repository contains UI entry points and non-stub backend implementations for all seven named features, but the deployed product is **not end-to-end operational**. The configured Supabase project exists, but its database has no StadiumPulse schema and no users. Anonymous sign-in is disabled. Consequently the live frontend cannot obtain the token its protected API calls require, its public Supabase reads target missing tables, and none of the protected feature flows can be honestly marked live-verified.

The deployed frontend is a fixed dark theme. It has no `data-theme` attribute and no theme toggle. Motion exists only in two small components; no 3D layer exists.

## Repository identity evidence

Command:

```powershell
git status --short --branch; git remote -v; git log -1 --oneline
```

Literal output:

```text
## main...origin/main
origin  https://github.com/NoorRattan/stadiumpulse.git (fetch)
origin  https://github.com/NoorRattan/stadiumpulse.git (push)
ba0cf0b test: isolate supabase jwt settings in ci
```

## Seven-feature matrix

| Feature | Real UI entry point | Real frontend request | Non-stub backend | Gemini / DB behavior in source | Live verification |
| --- | --- | --- | --- | --- | --- |
| Multilingual AI Concierge | **Yes.** Route: `frontend/src/router.tsx:57-62`; page: `frontend/src/pages/fan/ConciergePage.tsx:15-52`. The separate home preview is canned at `frontend/src/pages/fan/HomePage.tsx:135-147`. | **Yes on the dedicated page.** `POST /api/concierge/chat` at `ConciergePage.tsx:27-42`. | **Yes.** `backend/routes/concierge_routes.py:14-28`. | **Real implementation in source.** Session/message SQL and AI call: `backend/services/concierge_service.py:31-119`; Gemini client: `backend/services/ai_core.py:12-32`. | **FAIL.** No live user/token/schema; request reaches auth and returns 401. Gemini was not reached live. |
| Smart Wayfinding | **Yes.** Route: `router.tsx:65-70`; form and result UI: `frontend/src/pages/fan/WayfindingPage.tsx:31-178`. | **Yes.** Hook calls `POST /api/wayfinding/route` at `frontend/src/hooks/useWayfinding.ts:15-36`; page submits accessibility needs at `WayfindingPage.tsx:51-62`. | **Yes.** `backend/routes/wayfinding_routes.py:33-46`. | **Real DB graph/routing plus Gemini narration in source.** Wheelchair edge filtering and explicit fallback: `backend/services/wayfinding_service.py:170-199`. | **FAIL.** Zone table is absent; protected request returns 401. |
| Accessibility Mode | **Yes, globally visible.** `frontend/src/components/accessibility/AccessibilityToggle.tsx:7-44`, mounted by `frontend/src/components/layout/AppShell.tsx`. | **No.** `frontend/src/contexts/AccessibilityContext.tsx:28-75` only stores React state and updates `data-contrast`; it never calls `/api/accessibility/settings`. | **Yes.** GET/PUT handlers: `backend/routes/accessibility_routes.py:12-63`. | **Real DB SQL in source.** Reads/upserts `public.accessibility_settings`. | **FAIL.** UI is local-only; table is absent live; protected requests return 401. |
| Sustainable Travel Assistant | **Yes.** Route: `router.tsx:73-78`; `frontend/src/pages/fan/TravelPage.tsx:31-145`. | **Yes.** `GET /api/travel/suggestions?matchId=...` at `TravelPage.tsx:38-49`. | **Yes.** `backend/routes/travel_routes.py:13-21`. | **Mixed deterministic + real Gemini in source.** Static candidate modes are ranked from match data, Gemini supplies descriptions, and results are cached: `backend/services/travel_service.py:23-33,109-137`. | **FAIL.** `matches` and cache tables are absent; protected request returns 401. |
| Live Crowd Intelligence Dashboard | **Yes for staff/volunteer route.** `router.tsx:81-88`; `frontend/src/pages/ops/DashboardPage.tsx:35-132`. | **PARTIAL / wrong contract.** It reads Supabase directly via `frontend/src/hooks/useCrowdDensity.ts:33-83`, not `GET /api/crowd/zones`. | **Yes.** `backend/routes/crowd_routes.py:29-52`. | **Backend computes `band` at `crowd_routes.py:16-25`, but the page recomputes bands and canned alert text client-side at `DashboardPage.tsx:8-32`.** | **FAIL.** `zones` is absent live and the UI bypasses the backend contract. |
| Incident Copilot | **Yes for staff/volunteer route.** `router.tsx:91-98`; `frontend/src/pages/ops/IncidentsPage.tsx:27-116`. | **Yes, two distinct actions.** Draft: `POST /api/incidents` at `IncidentsPage.tsx:81-92`; submit: `PATCH /api/incidents/{id}` at `IncidentsPage.tsx:93-109`. | **Yes.** `backend/routes/incident_routes.py:34-42,85-117`. | **Real Gemini triage then DB insert in source.** `backend/services/incident_service.py:27-69`. | **FAIL.** No staff user, zones, or incidents table; protected requests return 401. |
| Volunteer Briefing Generator | **PARTIAL.** Route/page exist at `router.tsx:101-108` and `frontend/src/pages/ops/BriefingsPage.tsx:31-130`. | **Yes.** GET latest at `BriefingsPage.tsx:42-61`; POST generate at `BriefingsPage.tsx:77-94`. | **Yes.** `backend/routes/briefing_routes.py:18-60`; POST is staff-only and GET allows staff/volunteer. | **Real DB + Gemini in source.** `backend/services/briefing_service.py:81-117`. | **FAIL and role-gating bug.** The page renders `BriefingGenerator` unconditionally for volunteers (`BriefingsPage.tsx:76-94`); backend would reject it, but the prompt requires the control to be absent. No live schema/user exists. |

## Live frontend evidence

Browser inspection of `https://stadiumpulse.pages.dev/` returned:

```json
{
  "title": "StadiumPulse",
  "htmlTheme": null,
  "htmlContrast": "standard",
  "bodyBackground": "rgb(11, 18, 32)",
  "bodyColor": "rgb(245, 247, 250)",
  "links": ["/", "/concierge", "/wayfinding", "/travel"],
  "buttons": ["English", "Send message"]
}
```

This proves the deployed shell is fixed-dark and exposes no theme switch. The rendered home page also showed a clipped lower content region behind the fixed bottom navigation at the audit viewport.

Source search command:

```powershell
rg -n 'data-theme|ThemeContext|next-themes|prefers-color-scheme|dark:|useReducedMotion|motion|animate|transition' frontend/src frontend/package.json
```

Relevant literal output:

```text
frontend/package.json:20:    "motion": "12.42.2",
frontend/package.json:21:    "next-themes": "^0.4.6",
frontend/src/hooks/useReducedMotionSafe.ts:7:export function useReducedMotionSafe(): boolean {
frontend/src/components/crowd/ScoreboardMetric.tsx:2:import { motion } from "motion/react";
frontend/src/components/wayfinding/RouteLine.tsx:2:import { motion } from "motion/react";
```

No `data-theme`, `ThemeContext`, or `prefers-color-scheme` theme implementation was returned. `next-themes` is installed and used by the toaster component, but no provider is mounted.

## Live Supabase / security evidence

Anonymous auth command used the configured public project URL and publishable key through `supabase.auth.signInAnonymously()`.

Literal output:

```text
[POST Supabase anonymous sign-in] FAILED
{"message":"Anonymous sign-ins are disabled","status":422,"code":"anonymous_provider_disabled"}
```

Direct database command connected with the configured `SUPABASE_DB_URL` and ran `select version()`, `select count(*) from auth.users`, then queried `public.profiles`.

Literal output:

```text
--- LIVE POSTGRES GROUND TRUTH ---
server= PostgreSQL 17.6 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit
auth_users= 0
asyncpg.exceptions.UndefinedTableError: relation "public.profiles" does not exist
```

PostgREST checks with the configured public project URL/key:

```text
[GET /rest/v1/profiles?select=*&limit=1] HTTP 404
{"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'public.profiles' in the schema cache"}
[GET /rest/v1/zones?select=*&limit=1] HTTP 404
{"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'public.zones' in the schema cache"}
[GET /rest/v1/matches?select=*&limit=1] HTTP 404
{"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'public.matches' in the schema cache"}
[GET /rest/v1/accessibility_settings?select=*&limit=1] HTTP 404
{"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'public.accessibility_settings' in the schema cache"}
```

Conclusion: the Supabase project exists, but the checked database has never received `supabase/migrations/0001_init.sql`. Therefore the RLS policies and role-related triggers defined in source cannot have executed in this project. There is no evidence of a prior execution history to recover, and current schema absence disproves any claim that these controls are active live.

The migration defines the intended controls at `supabase/migrations/0001_init.sql:110-159` and role-claim hook logic at `:171-175`; these are source definitions only, not deployed controls.

## Live backend endpoint matrix

Health requests:

```text
[GET /health] HTTP 200
{"status":"ok","service":"stadiumpulse-backend"}
[GET /api/health] HTTP 404
{"error":{"code":"NOT_FOUND","message":"Requested resource was not found.","status":404}}
```

This contradicts `docs/API.md:7`, which documents `GET /api/health` as returning 200. The deployed backend exposes only `/health`.

No real/test token could be obtained because anonymous auth is disabled and `auth.users` is empty. The following are therefore literal unauthenticated reachability checks, **not successful feature verification**:

```text
[GET /api/auth/me] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[POST /api/auth/bootstrap] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[POST /api/concierge/chat] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[GET /api/wayfinding/zones] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[POST /api/wayfinding/route] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[GET /api/accessibility/settings] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[PUT /api/accessibility/settings] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[GET /api/travel/suggestions?matchId=test] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[GET /api/crowd/zones] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[GET /api/crowd/zones/test] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[POST /api/incidents] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[GET /api/incidents] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[PATCH /api/incidents/test] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[POST /api/briefings/generate] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
[GET /api/briefings/test] HTTP 401
{"error":{"code":"UNAUTHENTICATED","message":"Missing Authorization header.","status":401}}
```

## Contradictions and actionable Phase 1/3 targets

1. Any previous “live” or “code-complete” claim is false for end-to-end behavior: the live DB schema and users are absent.
2. `docs/API.md` incorrectly documents `/api/health`; live returns 404 while `/health` returns 200.
3. The home concierge preview returns canned text even though the dedicated page is wired.
4. Accessibility preferences are local-only and disappear on reload; GET/PUT handlers exist but are unused.
5. The crowd dashboard bypasses the server response and recomputes both band and alert text client-side.
6. The volunteer briefing generator is visible to volunteers; only the backend rejects generation.
7. “Continue without an account” is presented as the primary fan path, but anonymous Supabase auth is disabled.
8. The deployed visual system is fixed-dark, flat, and has bottom-navigation overlap at the observed viewport.

This report was created before any frontend code change in Session 9.
