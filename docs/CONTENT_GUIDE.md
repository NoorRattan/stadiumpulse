# Content Guide

Seed content lives in `backend/seed/seed_data.py`. The data is synthetic demo data, not real venue data.

## Zones

Edit `seed_zones()` to add or change stadium zones. Use fixed document IDs such as `gate-2` or `north-concourse`; the seed script is designed to upsert by ID with `merge=True`.

Each zone needs:

- `name`
- `type`: `concourse`, `gate`, `seating-block`, or `transit-hub`
- `capacity`
- `currentDensityPct`
- `lastUpdated`
- `coordinates`

Keep `gate-2` present. The wayfinding examples and route graph depend on it.

## Matches

Edit `seed_matches()` to add or change demo matches. Use fixed IDs such as `m_2026_014`; do not switch to auto-generated IDs.

Each match needs:

- `venueZoneIds`
- `kickoffAt`
- `homeTeam`
- `awayTeam`
- `transitLoadEstimate`: `low`, `medium`, or `high`

The current seed set intentionally covers all three transit-load values so the travel assistant has varied inputs.

## Demo Incidents

Edit `seed_incidents()` for first-load ops console examples. Demo incidents should remain in `draft` status unless you are specifically testing status transitions.

Use `reportedByUid: None` only for system-generated examples. Human-filed demo reports should use a realistic placeholder UID.

## Running The Seed

Set the backend environment variables from `backend/.env.example`, authenticate Firebase Admin locally, then run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m seed.seed_data
```

The script is safe to rerun because it upserts fixed document IDs.
