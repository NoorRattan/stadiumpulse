-- Let the custom access-token hook read authoritative roles through RLS while
-- retaining least-privilege browser access to the underlying table.
alter table public.user_roles enable row level security;

revoke all privileges on table public.user_roles from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant select on table public.user_roles to supabase_auth_admin;

drop policy if exists user_roles_auth_admin_select on public.user_roles;
create policy user_roles_auth_admin_select
  on public.user_roles
  as permissive
  for select
  to supabase_auth_admin
  using (true);
