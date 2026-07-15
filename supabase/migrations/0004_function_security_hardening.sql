-- Pin function resolution and keep browser roles from invoking privileged
-- database helpers directly. Trigger execution does not require callers to
-- retain EXECUTE on the trigger function.
alter function public.prevent_role_self_change() set search_path = '';
revoke execute on function public.prevent_role_self_change() from public, anon, authenticated;

alter function public.custom_access_token_hook(jsonb) set search_path = '';
revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
