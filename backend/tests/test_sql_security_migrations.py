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


def test_render_keep_alive_uses_bounded_database_cron_without_browser_privileges() -> None:
    normalized = migration_sql("0005_render_keep_alive_cron.sql")

    assert "create extension if not exists pg_net;" in normalized
    assert "create extension if not exists pg_cron;" in normalized
    assert "'stadiumpulse-render-keep-alive', '*/10 * * * *'" in normalized
    assert "https://stadiumpulse-d7js.onrender.com/health" in normalized
    assert "https://stadiumpulse-d7js.onrender.com/api/demo" in normalized
    assert normalized.count("timeout_milliseconds := 60000") == 2
