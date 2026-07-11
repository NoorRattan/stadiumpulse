create extension if not exists "pgcrypto";

create type user_role as enum ('fan', 'staff', 'volunteer');
create type zone_type as enum ('concourse', 'gate', 'seating-block', 'transit-hub');
create type reading_source as enum ('sensor', 'manual', 'estimated');
create type incident_status as enum ('draft', 'submitted', 'resolved');
create type incident_severity as enum ('low', 'medium', 'high', 'critical');
create type message_role as enum ('user', 'assistant');
create type transit_load as enum ('low', 'medium', 'high');

create table public.user_roles (
  uid uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'fan'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  email text not null,
  role user_role not null default 'fan',
  preferred_language text not null default 'en',
  created_at timestamptz not null default now()
);

create table public.zones (
  zone_id text primary key,
  name text not null check (char_length(name) between 1 and 80),
  type zone_type not null,
  capacity integer not null check (capacity > 0),
  current_density_pct numeric(5,2) not null default 0 check (current_density_pct between 0 and 100),
  last_updated timestamptz not null default now(),
  lat double precision not null,
  lng double precision not null
);

create table public.zone_readings (
  id uuid primary key default gen_random_uuid(),
  zone_id text not null references public.zones(zone_id) on delete cascade,
  density_pct numeric(5,2) not null check (density_pct between 0 and 100),
  source reading_source not null,
  recorded_at timestamptz not null default now()
);
create index idx_zone_readings_zone_recorded on public.zone_readings (zone_id, recorded_at desc);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  zone_id text not null references public.zones(zone_id),
  status incident_status not null default 'draft',
  raw_input text not null check (char_length(raw_input) between 1 and 2000),
  ai_draft_summary text,
  severity incident_severity,
  reported_by_uid uuid references auth.users(id),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  resolved_at timestamptz
);
create index idx_incidents_zone_status_created on public.incidents (zone_id, status, created_at desc);

create table public.briefings (
  id uuid primary key default gen_random_uuid(),
  zone_id text not null references public.zones(zone_id),
  shift_label text not null,
  content text not null,
  generated_by_uid uuid not null references auth.users(id),
  generated_at timestamptz not null default now()
);
create index idx_briefings_zone_generated on public.briefings (zone_id, generated_at desc);

create table public.concierge_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  language text not null,
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table public.concierge_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.concierge_sessions(id) on delete cascade,
  role message_role not null,
  text text not null check (char_length(text) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index idx_concierge_messages_session_created on public.concierge_messages (session_id, created_at);

create table public.accessibility_settings (
  uid uuid primary key references auth.users(id) on delete cascade,
  high_contrast boolean not null default false,
  reduced_motion boolean not null default false,
  screen_reader_mode boolean not null default false,
  preferred_language text not null default 'en'
);

create table public.matches (
  id text primary key,
  venue_zone_ids text[] not null,
  kickoff_at timestamptz not null,
  home_team text not null,
  away_team text not null,
  transit_load_estimate transit_load not null
);

create table public.travel_suggestions_cache (
  match_id text primary key references public.matches(id),
  generated_at timestamptz not null default now(),
  suggestions jsonb not null,
  expire_at timestamptz not null
);

alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.zones enable row level security;
alter table public.zone_readings enable row level security;
alter table public.incidents enable row level security;
alter table public.briefings enable row level security;
alter table public.concierge_sessions enable row level security;
alter table public.concierge_messages enable row level security;
alter table public.accessibility_settings enable row level security;
alter table public.matches enable row level security;
alter table public.travel_suggestions_cache enable row level security;

create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_insert_own_fan on public.profiles for insert with check (auth.uid() = id and role = 'fan');
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

create function public.prevent_role_self_change() returns trigger
  language plpgsql security definer as $$
begin
  if new.role is distinct from old.role
     and coalesce(current_setting('role', true), '') <> 'service_role' then
    raise exception 'role can only be changed via scripts/grant_role.py (service role)';
  end if;
  return new;
end;
$$;
create trigger trg_prevent_role_self_change
  before update on public.profiles
  for each row execute function public.prevent_role_self_change();

create policy accessibility_owner on public.accessibility_settings
  for all using (auth.uid() = uid) with check (auth.uid() = uid);

create policy concierge_sessions_select_own on public.concierge_sessions
  for select using (auth.uid() = user_id);

create policy concierge_messages_select_own on public.concierge_messages
  for select using (
    exists (
      select 1 from public.concierge_sessions s
      where s.id = concierge_messages.session_id and s.user_id = auth.uid()
    )
  );

create policy zones_staff_volunteer_read on public.zones
  for select using ((auth.jwt() ->> 'user_role') in ('staff', 'volunteer'));
create policy zone_readings_staff_volunteer_read on public.zone_readings
  for select using ((auth.jwt() ->> 'user_role') in ('staff', 'volunteer'));

create policy matches_public_read on public.matches for select using (true);

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  assigned_role text;
begin
  select role::text into assigned_role
    from public.user_roles
    where uid = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(assigned_role, 'fan')));
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
