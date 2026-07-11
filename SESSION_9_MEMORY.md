# Session 9 Evidence Memory

This file records only claims verified in Session 9. Phase 0 evidence and the original failure matrix are in `AUDIT_REPORT.md`.

## Deployment status

- The existing live frontend and backend were audited.
- The Supabase migration and seed were applied to the configured live Supabase project during this session.
- The rebuilt frontend and backend source changes in this worktree have **not** been pushed or deployed in this session. Therefore local rebuild results below must not be described as verified on `stadiumpulse.pages.dev` or `stadiumpulse-d7js.onrender.com`.

## Live Supabase migration

Command: Python/asyncpg transaction executing `supabase/migrations/0001_init.sql` followed by `supabase/seed.sql` against the configured `SUPABASE_DB_URL`.

Literal output:

```text
migration_transaction=COMMITTED
public_tables= 11
rls_enabled_tables= 11
policies= 9
role_trigger= 1
zones= 6
matches= 3
```

The role-protection trigger was then exercised with a real audit profile.

Literal output:

```text
unauthorized_role_update=BLOCKED
RaiseError: role can only be changed via scripts/grant_role.py (service role)
service_role_update=SUCCEEDED
```

## Real token + live service dependencies

A temporary Supabase email/password audit account produced a real Supabase access token whose reserved role was `authenticated`. The rebuilt backend accepted it as a fan, then accepted a refreshed token with `app_metadata.user_role=staff`. The requests ran against the rebuilt local backend while using the live Supabase database and real Gemini API. Audit accounts and generated audit rows were deleted afterward.

Selected literal request/response evidence:

```text
[POST <SUPABASE>/auth/v1/token?grant_type=password] HTTP 200
{"accessTokenReceived": true, "role": "authenticated"}
[POST /api/auth/bootstrap] HTTP 201
{"uid":"<audit-user>","displayName":"StadiumPulse User","role":"fan","preferredLanguage":"en"}
[POST /api/concierge/chat] HTTP 200
{"sessionId":"<audit-session>","reply":"A wheelchair user should ask any uniformed gate attendant or stadium staff member at the main entrances for accessible entry assistance.","detectedLanguage":"en"}
[POST /api/wayfinding/route] HTTP 200
{"routeOptions":[{"steps":[{"instruction":"Welcome! From Gate 2, proceed straight ahead. Follow the accessible signage for the North Concourse, utilizing the ramp or elevator on your right to reach the concourse level.","zoneId":"north-concourse"},{"instruction":"Once on the North Concourse, turn left. Look for overhead signs indicating Seat Block 114. Follow the accessible path to your seating area within Block 114.","zoneId":"seat-block-114"}],"estimatedMinutes":6,"congestionLevel":"low"}],"generatedBy":"ai"}
[PUT /api/accessibility/settings] HTTP 200
{"highContrast":true,"reducedMotion":true,"screenReaderMode":false,"preferredLanguage":"en"}
[GET /api/crowd/zones/gate-4] HTTP 200
{"zoneId":"gate-4","name":"Gate 4","currentDensityPct":66.0,"band":"moderate","alert":"**StadiumPulse Alert:** Gate 4 density is MODERATE. Continue to MONITOR."}
[POST /api/incidents] HTTP 201
{"incidentId":"<audit-incident>","zoneId":"gate-4","status":"draft","rawInput":"SESSION 9 AUDIT TEST: minor signage obstruction; create a draft only.","aiDraftSummary":"Minor signage obstruction identified during audit test (draft report).","severity":"low","reportedByUid":"<audit-user>","submittedAt":null,"resolvedAt":null}
[PATCH /api/incidents/<audit-incident>] HTTP 200
{"incidentId":"<audit-incident>","zoneId":"gate-4","status":"submitted","severity":"low","reportedByUid":"<audit-user>","resolvedAt":null}
[POST /api/briefings/generate] HTTP 201
{"briefingId":"<audit-briefing>","zoneId":"gate-4","shiftLabel":"SESSION 9 AUDIT TEST","generatedByUid":"<audit-user>"}
audit_user_delete_http= 200
remaining_auth_user= 0
```

Travel was rechecked after fixing asyncpg JSONB encoding:

```text
[GET /api/travel/suggestions?matchId=m_2026_014] HTTP 200
{"matchId":"m_2026_014","suggestions":[{"mode":"rail","description":"Board high-capacity trains for a reliable, efficient departure after the final whistle."},{"mode":"stadium-shuttle","description":"Take our dedicated stadium shuttles for direct, stress-free transport from transit hubs to the gate."},{"mode":"rideshare-pool","description":"Head to the signed rideshare zone after the crowds disperse to share a ride home."}]}
audit_user_delete_http= 200
remaining_auth_user= 0
```

## Contrast verification

Command:

```powershell
npm run contrast:check
```

Literal output:

```text
LIGHT THEME
foreground/background: 15.38:1 PASS
muted text/background: 6.65:1 PASS
muted text/card: 7.10:1 PASS
primary button: 6.55:1 PASS
accent button: 6.38:1 PASS
destructive/background: 6.08:1 PASS
DARK THEME
foreground/background: 17.82:1 PASS
muted text/background: 10.98:1 PASS
muted text/card: 10.05:1 PASS
primary button: 9.43:1 PASS
accent button: 10.12:1 PASS
destructive/background: 7.66:1 PASS
```

## Frontend verification

Command:

```powershell
npm run test
```

Literal output from the verified pass:

```text
Test Files  18 passed (18)
Tests  18 passed (18)
```

Command:

```powershell
npm run build
```

Literal output excerpt:

```text
dist/assets/index-BQKu0fG1.css                  59.62 kB │ gzip:  10.80 kB
dist/assets/StadiumScene-mtLp3Ycf.js             4.02 kB │ gzip:   1.81 kB
dist/assets/CrowdField3D-CUz5CZv0.js             0.86 kB │ gzip:   0.55 kB
dist/assets/index-C73UeRaX.js                  449.77 kB │ gzip: 131.84 kB
dist/assets/react-three-fiber.esm-D-6RNCqv.js  857.59 kB │ gzip: 227.40 kB
✓ built in 7.32s
```

Browser checks against the local rebuilt frontend:

```json
{"theme":"dark","bodyBackground":"rgb(7, 17, 13)","bodyColor":"rgb(242, 248, 244)","themeButton":"Switch to light theme","viewport":1265,"width":1265}
{"theme":"light","background":"rgb(246, 248, 245)","color":"rgb(16, 35, 27)","toggle":"Switch to dark theme","clientWidth":1265,"scrollWidth":1265}
{"clientWidth":375,"scrollWidth":375,"h1":"Your match day, without the guesswork.","navLinks":4,"footerVisible":true}
```

## Backend verification

Command:

```powershell
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m pytest --cov=. --cov-report=term-missing --cov-fail-under=100
```

Literal output from the final verification pass:

```text
All checks passed!
collected 92 items
92 passed, 3 warnings in 3.35s
TOTAL 1086 0 100%
Required test coverage of 100% reached. Total coverage: 100.00%
```
