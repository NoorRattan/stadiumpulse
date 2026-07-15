from pathlib import Path


def test_function_security_hardening_is_forward_only_and_least_privilege() -> None:
    migration = (
        Path(__file__).resolve().parents[2] / "supabase" / "migrations" / "0004_function_security_hardening.sql"
    ).read_text(encoding="utf-8")
    normalized = " ".join(migration.lower().split())

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
