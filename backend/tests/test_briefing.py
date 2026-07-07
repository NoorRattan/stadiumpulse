from conftest import auth_headers
from fastapi.testclient import TestClient

from models.user import UserRole


def test_briefing_generate_happy_path(client: TestClient) -> None:
    response = client.post(
        "/api/briefings/generate",
        json={"zoneId": "gate-4", "shiftLabel": "Morning - Gates Open to Kickoff"},
        headers=auth_headers("staff-1", UserRole.staff),
    )
    body = response.json()
    assert response.status_code == 201
    assert body["zoneId"] == "gate-4"
    assert "Current Known Incidents" in body["content"]


def test_briefing_get_happy_path_for_volunteer(client: TestClient) -> None:
    response = client.get("/api/briefings/gate-4", headers=auth_headers("vol-1", UserRole.volunteer))
    assert response.status_code == 200
    assert response.json()["briefingId"] == "briefing-old"


def test_briefing_generate_rejects_volunteer(client: TestClient) -> None:
    response = client.post(
        "/api/briefings/generate",
        json={"zoneId": "gate-4", "shiftLabel": "Morning - Gates Open to Kickoff"},
        headers=auth_headers("vol-1", UserRole.volunteer),
    )
    assert response.status_code == 403


def test_briefing_rejects_missing_auth(client: TestClient) -> None:
    response = client.get("/api/briefings/gate-4")
    assert response.status_code == 401


def test_briefing_validation_failure(client: TestClient) -> None:
    response = client.post(
        "/api/briefings/generate",
        json={"zoneId": "gate-4", "shiftLabel": ""},
        headers=auth_headers("staff-1", UserRole.staff),
    )
    assert response.status_code == 400


def test_briefing_missing_zone_validation(client: TestClient) -> None:
    response = client.post(
        "/api/briefings/generate",
        json={"zoneId": "missing-zone", "shiftLabel": "Morning - Gates Open to Kickoff"},
        headers=auth_headers("staff-1", UserRole.staff),
    )
    assert response.status_code == 404
