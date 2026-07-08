import pytest
from conftest import auth_headers
from fastapi.testclient import TestClient

import services.wayfinding_service as wayfinding_service
from models.user import UserRole
from services.exceptions import AIServiceError


def route_payload() -> dict[str, object]:
    return {"fromZoneId": "gate-2", "toZoneId": "seat-block-114", "accessibilityNeeds": ["wheelchair"]}


def test_wayfinding_happy_path(client: TestClient) -> None:
    response = client.post(
        "/api/wayfinding/route",
        json=route_payload(),
        headers=auth_headers("fan-1", UserRole.fan),
    )
    assert response.status_code == 200
    assert response.json()["generatedBy"] == "ai"


@pytest.mark.parametrize("role", [UserRole.fan, UserRole.staff, UserRole.volunteer])
def test_wayfinding_zone_options_available_to_any_signed_in_role(
    client: TestClient,
    role: UserRole,
) -> None:
    response = client.get(
        "/api/wayfinding/zones",
        headers=auth_headers(f"{role.value}-1", role),
    )
    assert response.status_code == 200
    zones = response.json()["zones"]
    assert zones[0] == {"zoneId": "gate-2", "name": "Gate 2", "type": "gate"}
    assert "currentDensityPct" not in zones[0]
    assert "capacity" not in zones[0]


def test_wayfinding_zone_options_rejects_missing_auth(client: TestClient) -> None:
    response = client.get("/api/wayfinding/zones")
    assert response.status_code == 401


def test_wayfinding_ai_failure_returns_fallback(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def fail_flow(
        baseline_path: list[str],
        alternative_paths: list[list[str]],
        accessibility_needs: list[object],
    ) -> None:
        raise AIServiceError("down")

    monkeypatch.setattr(wayfinding_service, "wayfindingFlow", fail_flow)
    response = client.post(
        "/api/wayfinding/route",
        json=route_payload(),
        headers=auth_headers("fan-1", UserRole.fan),
    )
    assert response.status_code == 200
    assert response.json()["generatedBy"] == "fallback"


def test_wayfinding_invalid_zone_returns_404(client: TestClient) -> None:
    response = client.post(
        "/api/wayfinding/route",
        json={"fromZoneId": "missing-zone", "toZoneId": "seat-block-114", "accessibilityNeeds": []},
        headers=auth_headers("fan-1", UserRole.fan),
    )
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_wayfinding_rejects_missing_auth(client: TestClient) -> None:
    response = client.post("/api/wayfinding/route", json=route_payload())
    assert response.status_code == 401


def test_wayfinding_validation_failure(client: TestClient) -> None:
    response = client.post(
        "/api/wayfinding/route",
        json={"fromZoneId": "", "toZoneId": "seat-block-114", "accessibilityNeeds": []},
        headers=auth_headers("fan-1", UserRole.fan),
    )
    assert response.status_code == 400
