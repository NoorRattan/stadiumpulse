-- The access-token hook is the only supported app-role propagation path.
-- Supabase Auth must be able to execute the hook and read user_roles, while
-- browser roles should not call the hook function directly.
grant usage on schema public to supabase_auth_admin;
revoke select on table public.user_roles from public;
revoke select on table public.user_roles from anon;
revoke select on table public.user_roles from authenticated;
grant select on table public.user_roles to supabase_auth_admin;

revoke execute on function public.custom_access_token_hook(jsonb) from public;
revoke execute on function public.custom_access_token_hook(jsonb) from anon;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
