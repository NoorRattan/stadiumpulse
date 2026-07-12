insert into public.zones (zone_id, name, type, capacity, current_density_pct, last_updated, lat, lng)
values
  ('north-concourse', 'North Concourse', 'concourse', 4000, 78.5, now(), 32.7473, -97.0945),
  ('east-concourse', 'East Concourse', 'concourse', 3500, 44.0, now(), 32.7475, -97.0920),
  ('gate-2', 'Gate 2', 'gate', 1000, 30.0, now(), 32.7470, -97.0940),
  ('gate-4', 'Gate 4', 'gate', 1200, 66.0, now(), 32.7481, -97.0928),
  ('seat-block-114', 'Section 114', 'seating-block', 900, 41.0, now(), 32.7477, -97.0933),
  ('south-transit-hub', 'South Transit Hub', 'transit-hub', 2600, 35.0, now(), 32.7464, -97.0951)
on conflict (zone_id) do update
set name = excluded.name,
    type = excluded.type,
    capacity = excluded.capacity,
    current_density_pct = excluded.current_density_pct,
    last_updated = excluded.last_updated,
    lat = excluded.lat,
    lng = excluded.lng;

insert into public.matches (id, venue_zone_ids, kickoff_at, home_team, away_team, transit_load_estimate)
values
  ('m_2026_014', array['north-concourse', 'gate-4', 'seat-block-114'], now() + interval '3 hours', 'United States', 'Canada', 'high'),
  ('m_2026_021', array['gate-2', 'east-concourse', 'seat-block-114'], now() + interval '27 hours', 'Mexico', 'Japan', 'medium'),
  ('m_2026_032', array['south-transit-hub', 'gate-2', 'north-concourse'], now() + interval '51 hours', 'Brazil', 'Germany', 'low')
on conflict (id) do update
set venue_zone_ids = excluded.venue_zone_ids,
    kickoff_at = excluded.kickoff_at,
    home_team = excluded.home_team,
    away_team = excluded.away_team,
    transit_load_estimate = excluded.transit_load_estimate;

-- Deterministic recent history makes the connected demo forecast meaningful
-- immediately after seeding, before the simulator's first interval runs.
insert into public.zone_readings (id, zone_id, density_pct, source, recorded_at)
values
  ('00000000-0000-0000-0000-000000000201', 'north-concourse', 65.0, 'estimated', now() - interval '10 minutes'),
  ('00000000-0000-0000-0000-000000000202', 'north-concourse', 72.0, 'estimated', now() - interval '5 minutes'),
  ('00000000-0000-0000-0000-000000000203', 'north-concourse', 78.5, 'estimated', now()),
  ('00000000-0000-0000-0000-000000000204', 'gate-4', 54.0, 'estimated', now() - interval '10 minutes'),
  ('00000000-0000-0000-0000-000000000205', 'gate-4', 60.0, 'estimated', now() - interval '5 minutes'),
  ('00000000-0000-0000-0000-000000000206', 'gate-4', 66.0, 'estimated', now())
on conflict (id) do update
set density_pct = excluded.density_pct,
    source = excluded.source,
    recorded_at = excluded.recorded_at;

insert into public.incidents (id, zone_id, status, raw_input, ai_draft_summary, severity, reported_by_uid, created_at, submitted_at, resolved_at)
values (
  '00000000-0000-0000-0000-000000000101',
  'gate-4',
  'draft',
  'Large crowd bottleneck at gate 4, one turnstile down',
  'Turnstile malfunction at Gate 4 causing queue buildup; recommend rerouting to Gate 5 and dispatching maintenance.',
  'medium',
  null,
  now(),
  null,
  null
)
on conflict (id) do update
set zone_id = excluded.zone_id,
    status = excluded.status,
    raw_input = excluded.raw_input,
    ai_draft_summary = excluded.ai_draft_summary,
    severity = excluded.severity,
    reported_by_uid = excluded.reported_by_uid,
    created_at = excluded.created_at,
    submitted_at = excluded.submitted_at,
    resolved_at = excluded.resolved_at;
