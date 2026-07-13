from collections.abc import Callable
from types import TracebackType
from typing import Any, Self

import httpx
import pytest
from conftest import FakeDb, auth_headers
from fastapi.testclient import TestClient

from config import Settings
from models.user import UserRole
from routes import auth_routes
from schemas.errors import ApiError, ErrorCode
from schemas.requests import PasswordSignupRequest


def signup_payload() -> PasswordSignupRequest:
    return PasswordSignupRequest(email="fan@example.com", password="password123")


def signup_settings(service_role_key: str | None = "service-key") -> Settings:
    return Settings(
        ENVIRONMENT="test",
        SUPABASE_URL="https://test.supabase.co",
        SUPABASE_DB_URL="postgresql://postgres:test@localhost:5432/postgres",
        SUPABASE_SERVICE_ROLE_KEY=service_role_key,
        ALLOWED_ORIGINS=["http://testserver"],
        GEMINI_API_KEY="gemini-key",
        GEMINI_MODEL_PRIMARY="primary",
        GEMINI_MODEL_LITE="lite",
        LOG_LEVEL="debug",
    )


def stub_supabase_admin(
    monkeypatch: pytest.MonkeyPatch,
    response_factory: Callable[[], httpx.Response],
) -> dict[str, Any]:
    seen: dict[str, Any] = {}

    class FakeAsyncClient:
        def __init__(self: Self, timeout: float) -> None:
            seen["timeout"] = timeout

        async def __aenter__(self: Self) -> Self:
            return self

        async def __aexit__(
            self: Self,
            exc_type: type[BaseException] | None,
            exc: BaseException | None,
            traceback: TracebackType | None,
        ) -> None:
            return None

        async def post(
            self: Self,
            endpoint: str,
            *,
            headers: dict[str, str],
            json: dict[str, object],
        ) -> httpx.Response:
            seen["endpoint"] = endpoint
            seen["headers"] = headers
            seen["json"] = json
            return response_factory()

    monkeypatch.setattr(auth_routes.httpx, "AsyncClient", FakeAsyncClient)
    return seen


def test_get_me_happy_path(client: TestClient, mock_db: FakeDb) -> None:
    mock_db.store["users"]["fan-1"] = {
        "displayName": "Alex Rivera",
        "email": "alex@example.com",
        "role": "fan",
        "preferredLanguage": "en",
    }
    response = client.get("/api/auth/me", headers=auth_headers("fan-1", UserRole.fan))
    assert response.status_code == 200
    assert response.json() == {
        "uid": "fan-1",
        "displayName": "Alex Rivera",
        "role": "fan",
        "preferredLanguage": "en",
    }


def test_get_me_rejects_missing_auth(client: TestClient) -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"


def test_bootstrap_always_creates_fan_role(client: TestClient, mock_db: FakeDb) -> None:
    response = client.post("/api/auth/bootstrap", headers=auth_headers("staff-token", UserRole.staff))
    assert response.status_code == 201
    assert response.json()["role"] == "fan"
    assert mock_db.store["users"]["staff-token"]["role"] == "fan"


def test_bootstrap_returns_existing_profile(client: TestClient, mock_db: FakeDb) -> None:
    mock_db.store["users"]["fan-1"] = {
        "displayName": "Existing Fan",
        "email": "fan@example.com",
        "role": "fan",
        "preferredLanguage": "es",
    }

    response = client.post("/api/auth/bootstrap", headers=auth_headers("fan-1", UserRole.fan))

    assert response.status_code == 201
    assert response.json()["displayName"] == "Existing Fan"
    assert response.json()["preferredLanguage"] == "es"


def test_signup_creates_confirmed_supabase_user_and_profile(
    client: TestClient,
    mock_db: FakeDb,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def create_user(payload: PasswordSignupRequest) -> dict[str, object]:
        assert payload.email == "fan@example.com"
        assert payload.password == "password123"
        return {"id": "supabase-user-1", "email": payload.email}

    monkeypatch.setattr(auth_routes, "create_confirmed_supabase_user", create_user)

    response = client.post(
        "/api/auth/signup",
        json={"email": "fan@example.com", "password": "password123"},
    )

    assert response.status_code == 201
    assert response.json() == {"uid": "supabase-user-1", "email": "fan@example.com"}
    assert mock_db.store["profiles"]["supabase-user-1"]["email"] == "fan@example.com"
    assert mock_db.store["user_roles"]["supabase-user-1"]["role"] == "fan"


def test_signup_validates_password_length(client: TestClient) -> None:
    response = client.post(
        "/api/auth/signup",
        json={"email": "fan@example.com", "password": "short"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_signup_rejects_invalid_supabase_user(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def create_user(payload: PasswordSignupRequest) -> dict[str, object]:
        return {"email": payload.email}

    monkeypatch.setattr(auth_routes, "create_confirmed_supabase_user", create_user)

    response = client.post(
        "/api/auth/signup",
        json={"email": "fan@example.com", "password": "password123"},
    )

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "INTERNAL_ERROR"


@pytest.mark.asyncio
async def test_create_confirmed_supabase_user_calls_admin_api(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth_routes, "get_settings", lambda: signup_settings())
    seen = stub_supabase_admin(
        monkeypatch,
        lambda: httpx.Response(201, json={"id": "supabase-user-1", "email": "fan@example.com"}),
    )

    user = await auth_routes.create_confirmed_supabase_user(signup_payload())

    assert user == {"id": "supabase-user-1", "email": "fan@example.com"}
    assert seen["endpoint"] == "https://test.supabase.co/auth/v1/admin/users"
    assert seen["headers"]["apikey"] == "service-key"
    assert seen["json"]["email_confirm"] is True


@pytest.mark.asyncio
async def test_create_confirmed_supabase_user_requires_service_role_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(auth_routes, "get_settings", lambda: signup_settings(service_role_key=None))

    with pytest.raises(ApiError) as exc_info:
        await auth_routes.create_confirmed_supabase_user(signup_payload())

    assert exc_info.value.status == 503
    assert exc_info.value.code == ErrorCode.internal_error


@pytest.mark.asyncio
async def test_create_confirmed_supabase_user_maps_existing_account(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(auth_routes, "get_settings", lambda: signup_settings())
    stub_supabase_admin(
        monkeypatch,
        lambda: httpx.Response(422, json={"message": "User already registered"}),
    )

    with pytest.raises(ApiError) as exc_info:
        await auth_routes.create_confirmed_supabase_user(signup_payload())

    assert exc_info.value.status == 409
    assert exc_info.value.code == ErrorCode.conflict


@pytest.mark.asyncio
async def test_create_confirmed_supabase_user_maps_validation_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(auth_routes, "get_settings", lambda: signup_settings())
    stub_supabase_admin(
        monkeypatch,
        lambda: httpx.Response(400, json={"msg": "Password should be stronger"}),
    )

    with pytest.raises(ApiError) as exc_info:
        await auth_routes.create_confirmed_supabase_user(signup_payload())

    assert exc_info.value.status == 400
    assert exc_info.value.code == ErrorCode.validation_error


@pytest.mark.asyncio
async def test_create_confirmed_supabase_user_maps_http_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(auth_routes, "get_settings", lambda: signup_settings())

    def raise_http_error() -> httpx.Response:
        raise httpx.ConnectError("offline")

    stub_supabase_admin(monkeypatch, raise_http_error)

    with pytest.raises(ApiError) as exc_info:
        await auth_routes.create_confirmed_supabase_user(signup_payload())

    assert exc_info.value.status == 502
    assert exc_info.value.code == ErrorCode.internal_error
