from http import HTTPStatus

import jwt
import pytest
from fastapi import Request

import dependencies
from config import Settings, get_supabase_jwks_url
from dependencies import AuthenticatedUser, extract_bearer_token, get_current_user, require_role, verify_token_async
from models.user import UserRole
from schemas.errors import ApiError, ErrorCode


def request_with_headers(headers: dict[str, str]) -> Request:
    encoded_headers = [(key.lower().encode(), value.encode()) for key, value in headers.items()]
    return Request({"type": "http", "headers": encoded_headers})


def test_extract_bearer_token_rejects_missing_and_wrong_scheme() -> None:
    with pytest.raises(ApiError) as missing:
        extract_bearer_token(None)
    with pytest.raises(ApiError) as malformed:
        extract_bearer_token("Token abc")

    assert missing.value.code == ErrorCode.unauthenticated
    assert malformed.value.status == HTTPStatus.UNAUTHORIZED


def test_supabase_jwks_url_defaults_to_auth_discovery_endpoint() -> None:
    settings = Settings(
        _env_file=None,
        ENVIRONMENT="test",
        SUPABASE_URL="https://abc.supabase.co/",
        SUPABASE_DB_URL="postgresql://postgres:test@localhost:5432/postgres",
        ALLOWED_ORIGINS=["http://testserver"],
        GEMINI_API_KEY="gemini-key",
        GEMINI_MODEL_PRIMARY="primary",
        GEMINI_MODEL_LITE="lite",
        LOG_LEVEL="info",
    )
    assert get_supabase_jwks_url(settings) == "https://abc.supabase.co/auth/v1/.well-known/jwks.json"


@pytest.mark.asyncio
async def test_verify_token_async_uses_supabase_jwt_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        dependencies,
        "get_settings",
        lambda: type(
            "SettingsStub",
            (),
            {
                "supabase_url": "https://test.supabase.co",
                "supabase_jwt_secret": "test-secret",
                "supabase_jwks_url": None,
            },
        )(),
    )
    token = jwt.encode(
        {"sub": "fan-1", "user_role": "fan", "iss": "https://test.supabase.co/auth/v1"},
        "test-secret",
        algorithm="HS256",
    )

    decoded = await verify_token_async(token)

    assert decoded["sub"] == "fan-1"
    assert decoded["user_role"] == "fan"


@pytest.mark.asyncio
async def test_verify_token_async_reraises_invalid_token() -> None:
    with pytest.raises(jwt.InvalidTokenError):
        await verify_token_async("invalid-token")


@pytest.mark.asyncio
async def test_verify_token_async_uses_supabase_jwks(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeSigningKey:
        key = "public-key"

    class FakeJwksClient:
        def get_signing_key_from_jwt(self, token: str) -> FakeSigningKey:
            assert token == "jwks-token"
            return FakeSigningKey()

    monkeypatch.setattr(
        dependencies,
        "get_settings",
        lambda: type(
            "SettingsStub",
            (),
            {
                "supabase_url": "https://jwks.supabase.co",
                "supabase_jwt_secret": None,
                "supabase_jwks_url": "https://jwks.example.test",
            },
        )(),
    )
    monkeypatch.setattr(dependencies, "get_jwks_client", lambda jwks_url: FakeJwksClient())

    def decode(token: str, key: object, **kwargs: object) -> dict[str, object]:
        assert token == "jwks-token"
        assert key == "public-key"
        assert kwargs["algorithms"] == ["ES256", "RS256"]
        return {"sub": "staff-1", "user_role": "staff"}

    monkeypatch.setattr(dependencies.jwt, "decode", decode)

    decoded = await verify_token_async("jwks-token")

    assert decoded == {"sub": "staff-1", "user_role": "staff"}


@pytest.mark.asyncio
async def test_get_current_user_sets_request_state_from_real_verification(monkeypatch: pytest.MonkeyPatch) -> None:
    async def verify_token(token: str) -> dict[str, object]:
        return {"uid": token, "role": "staff", "email": "staff@example.com", "name": "Staff User"}

    monkeypatch.setattr(
        dependencies,
        "verify_token_async",
        verify_token,
    )
    request = request_with_headers({})

    current_user = await get_current_user(request, authorization="Bearer staff-1")

    assert current_user.uid == "staff-1"
    assert current_user.role == UserRole.staff
    assert request.state.current_user == current_user


@pytest.mark.asyncio
async def test_get_current_user_rejects_invalid_supabase_token(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fail_verification(token: str) -> dict[str, object]:
        raise ValueError("expired")

    monkeypatch.setattr(dependencies, "verify_token_async", fail_verification)

    with pytest.raises(ApiError) as exc_info:
        await get_current_user(request_with_headers({}), authorization="Bearer expired")

    assert exc_info.value.code == ErrorCode.unauthenticated
    assert exc_info.value.status == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_get_current_user_rejects_missing_uid_and_invalid_role(monkeypatch: pytest.MonkeyPatch) -> None:
    async def missing_uid(token: str) -> dict[str, object]:
        return {"role": "fan"}

    async def invalid_role(token: str) -> dict[str, object]:
        return {"uid": "fan-1", "role": "owner"}

    monkeypatch.setattr(dependencies, "verify_token_async", missing_uid)
    with pytest.raises(ApiError, match="missing uid"):
        await get_current_user(request_with_headers({}), authorization="Bearer no-uid")

    monkeypatch.setattr(dependencies, "verify_token_async", invalid_role)
    with pytest.raises(ApiError, match="invalid role"):
        await get_current_user(request_with_headers({}), authorization="Bearer bad-role")


def test_require_role_allows_and_rejects_roles() -> None:
    staff = AuthenticatedUser(uid="staff-1", role=UserRole.staff)
    fan = AuthenticatedUser(uid="fan-1", role=UserRole.fan)
    dependency = require_role(UserRole.staff)

    assert dependency(staff) == staff
    with pytest.raises(ApiError) as exc_info:
        dependency(fan)
    assert exc_info.value.code == ErrorCode.forbidden


def test_jwks_client_is_cached() -> None:
    dependencies.get_jwks_client.cache_clear()
    first = dependencies.get_jwks_client("https://test.supabase.co/auth/v1/.well-known/jwks.json")
    second = dependencies.get_jwks_client("https://test.supabase.co/auth/v1/.well-known/jwks.json")
    assert first is second
