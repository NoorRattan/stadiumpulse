# Content Guide

Seed content lives in `supabase/seed.sql`. `backend/seed/seed_data.py` executes that SQL against Supabase. The data is synthetic demo data, not real venue data.

## Zones

Edit the `insert into public.zones` block to add or change stadium zones. Use fixed IDs such as `gate-2` or `north-concourse`; the seed SQL is designed to upsert by ID.

Each zone needs:

- `name`
- `type`: `concourse`, `gate`, `seating-block`, or `transit-hub`
- `capacity`
- `current_density_pct`
- `last_updated`
- `lat`
- `lng`

Keep `gate-2` present. The wayfinding examples and route graph depend on it.

## Matches

Edit the `insert into public.matches` block to add or change demo matches. Use fixed IDs such as `m_2026_014`; do not switch to auto-generated IDs.

Each match needs:

- `venue_zone_ids`
- `kickoff_at`
- `home_team`
- `away_team`
- `transit_load_estimate`: `low`, `medium`, or `high`

The current seed set intentionally covers all three transit-load values so the travel assistant has varied inputs.

## Demo Incidents

Edit the `insert into public.incidents` block for first-load ops console examples. Demo incidents should remain in `draft` status unless you are specifically testing status transitions.

Use `reported_by_uid: null` only for system-generated examples. Human-filed demo reports should use a realistic placeholder UID.

## Running The Seed

Set the backend environment variables from `backend/.env.example`, including `SUPABASE_DB_URL`, then run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m seed.seed_data
```

The script is safe to rerun because it upserts fixed document IDs.
