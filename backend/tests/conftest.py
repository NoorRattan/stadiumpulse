import os
from collections.abc import Iterator
from typing import Any

import pytest
from fake_db import FakeDb
from fake_db import FakeSnapshot as FakeSnapshot
from fastapi import Header, Request
from fastapi.testclient import TestClient

import services.briefing_service as briefing_service
import services.concierge_service as concierge_service
import services.crowd_service as crowd_service
import services.incident_service as incident_service
import services.travel_service as travel_service
import services.wayfinding_service as wayfinding_service

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_DB_URL", "postgresql://postgres:test@localhost:5432/postgres")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret-at-least-32-bytes-long")
os.environ.setdefault("ALLOWED_ORIGINS", "http://testserver")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("GROQ_MODEL_PRIMARY", "llama-3.1-8b-instant")
os.environ.setdefault("GROQ_MODEL_LITE", "llama-3.1-8b-instant")
os.environ.setdefault("LOG_LEVEL", "INFO")
os.environ.setdefault("SIMULATE_CROWD_DATA", "false")

from dependencies import AuthenticatedUser, extract_bearer_token, get_current_user, get_optional_current_user
from limiter import limiter
from main import app
from models.user import UserRole
from services.db import get_pool


class FakeAIClient:
    def generate_text(self, prompt: str, *, tier: str) -> str:
        return "Use the north concourse and monitor crowd density closely."

    def generate_json(self, prompt: str, *, tier: str) -> dict[str, Any]:
        return {"detectedLanguage": "en", "translatedText": "hello"}


@pytest.fixture
def mock_db() -> FakeDb:
    return FakeDb()


@pytest.fixture
def mock_ai_client() -> FakeAIClient:
    return FakeAIClient()


@pytest.fixture(autouse=True)
def patch_ai_helpers(monkeypatch: pytest.MonkeyPatch, mock_ai_client: FakeAIClient) -> Iterator[None]:
    monkeypatch.setattr(concierge_service, "get_ai_client", lambda: mock_ai_client)
    monkeypatch.setattr(crowd_service, "get_ai_client", lambda: mock_ai_client)
    monkeypatch.setattr(
        incident_service,
        "incidentTriageFlow",
        lambda zone_id, zone_name, raw_input: {"summary": f"Summary for {zone_name}", "severity": "medium"},
    )
    monkeypatch.setattr(briefing_service, "briefingFlow", lambda zone, shift_label, open_incidents: "Arrive ready.")
    monkeypatch.setattr(
        travel_service,
        "describe_travel_options",
        lambda options, transit_load_estimate: [f"Use {option['mode']}." for option in options],
    )
    monkeypatch.setattr(
        wayfinding_service,
        "wayfindingFlow",
        lambda baseline_path, alternative_paths, accessibility_needs: [
            {
                "steps": [{"instruction": f"Go to {zone_id}.", "zoneId": zone_id} for zone_id in baseline_path],
                "estimatedMinutes": 6,
                "congestionLevel": "medium",
            }
        ],
    )
    yield


async def test_current_user_override(
    request: Request,
    authorization: str | None = Header(default=None),
) -> AuthenticatedUser:
    token = extract_bearer_token(authorization)
    parts = token.split(":")
    uid = parts[0]
    role = UserRole(parts[1]) if len(parts) > 1 else UserRole.fan
    current_user = AuthenticatedUser(
        uid=uid,
        role=role,
        email=f"{uid}@example.com",
        displayName=f"{role.value.title()} User",
    )
    request.state.current_user = current_user
    return current_user


async def test_optional_current_user_override(
    request: Request,
    authorization: str | None = Header(default=None),
) -> AuthenticatedUser | None:
    if not authorization:
        return None
    return await test_current_user_override(request, authorization)


@pytest.fixture
def client(mock_db: FakeDb) -> Iterator[TestClient]:
    app.dependency_overrides[get_pool] = lambda: mock_db
    app.dependency_overrides[get_current_user] = test_current_user_override
    app.dependency_overrides[get_optional_current_user] = test_optional_current_user_override
    reset_storage = getattr(limiter.limiter.storage, "reset", None)
    if callable(reset_storage):
        reset_storage()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def auth_headers(uid: str = "user-1", role: UserRole = UserRole.fan) -> dict[str, str]:
    return {"Authorization": f"Bearer {uid}:{role.value}"}
