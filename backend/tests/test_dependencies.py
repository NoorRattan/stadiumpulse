from http import HTTPStatus
from types import SimpleNamespace
from typing import Any

import pytest
from fastapi import Request

import dependencies
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


@pytest.mark.asyncio
async def test_verify_token_async_uses_firebase_verify_id_token(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[str] = []

    monkeypatch.setattr(dependencies, "ensure_firebase_app", lambda: None)

    def verify_id_token(token: str) -> dict[str, object]:
        calls.append(token)
        return {"uid": "fan-1", "role": "fan"}

    monkeypatch.setattr(dependencies.auth, "verify_id_token", verify_id_token)

    decoded = await verify_token_async("valid-token")

    assert decoded == {"uid": "fan-1", "role": "fan"}
    assert calls == ["valid-token"]


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
async def test_get_current_user_rejects_invalid_firebase_token(monkeypatch: pytest.MonkeyPatch) -> None:
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


def test_ensure_firebase_app_uses_existing_and_service_account(monkeypatch: pytest.MonkeyPatch) -> None:
    existing = SimpleNamespace(name="existing")
    monkeypatch.setattr(dependencies.firebase_admin, "_apps", {"[DEFAULT]": existing})
    monkeypatch.setattr(dependencies.firebase_admin, "get_app", lambda: existing)
    assert dependencies.ensure_firebase_app() == existing

    initialized: dict[str, Any] = {}
    monkeypatch.setattr(dependencies.firebase_admin, "_apps", {})
    monkeypatch.setattr(
        dependencies,
        "get_settings",
        lambda: SimpleNamespace(firebase_service_account_path="service-account.json", gcp_project_id="project-1"),
    )
    monkeypatch.setattr(dependencies.credentials, "Certificate", lambda path: f"cert:{path}")
    monkeypatch.setattr(
        dependencies.firebase_admin,
        "initialize_app",
        lambda credential=None, options=None: initialized.setdefault("app", (credential, options)),
    )

    assert dependencies.ensure_firebase_app() == ("cert:service-account.json", {"projectId": "project-1"})

    monkeypatch.setattr(
        dependencies,
        "get_settings",
        lambda: SimpleNamespace(firebase_service_account_path=None, gcp_project_id="project-2"),
    )
    monkeypatch.setattr(
        dependencies.firebase_admin,
        "initialize_app",
        lambda credential=None, options=None: initialized.setdefault("default_app", (credential, options)),
    )

    assert dependencies.ensure_firebase_app() == (None, {"projectId": "project-2"})
