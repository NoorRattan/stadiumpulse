from pathlib import Path


def migration_sql(filename: str) -> str:
    migration = Path(__file__).resolve().parents[2] / "supabase" / "migrations" / filename
    return " ".join(migration.read_text(encoding="utf-8").lower().split())


def test_function_security_hardening_is_forward_only_and_least_privilege() -> None:
    normalized = migration_sql("0004_function_security_hardening.sql")

    assert "alter function public.prevent_role_self_change() set search_path = '';" in normalized
    assert "alter function public.custom_access_token_hook(jsonb) set search_path = '';" in normalized
    assert (
        "revoke execute on function public.prevent_role_self_change() from public, anon, authenticated;" in normalized
    )
    assert (
        "revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;"
        in normalized
    )
    assert "grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;" in normalized


def test_auth_hook_role_lookup_has_a_least_privilege_rls_policy() -> None:
    normalized = migration_sql("0006_user_roles_auth_admin_policy.sql")

    assert "alter table public.user_roles enable row level security;" in normalized
    assert "revoke all privileges on table public.user_roles from public, anon, authenticated;" in normalized
    assert "grant usage on schema public to supabase_auth_admin;" in normalized
    assert "grant select on table public.user_roles to supabase_auth_admin;" in normalized
    assert "drop policy if exists user_roles_auth_admin_select on public.user_roles;" in normalized
    assert (
        "create policy user_roles_auth_admin_select on public.user_roles as permissive for select "
        "to supabase_auth_admin using (true);" in normalized
    )
    assert "grant all" not in normalized


def test_render_keep_alive_uses_bounded_database_cron_without_browser_privileges() -> None:
    normalized = migration_sql("0005_render_keep_alive_cron.sql")

    assert "create extension if not exists pg_net;" in normalized
    assert "create extension if not exists pg_cron;" in normalized
    assert "'stadiumpulse-render-keep-alive', '*/10 * * * *'" in normalized
    assert "https://stadiumpulse-d7js.onrender.com/health" in normalized
    assert "https://stadiumpulse-d7js.onrender.com/api/demo" in normalized
    assert normalized.count("timeout_milliseconds := 60000") == 2
