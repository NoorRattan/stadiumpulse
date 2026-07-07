from conftest import FakeFirestore, auth_headers
from fastapi.testclient import TestClient

from models.user import UserRole


def test_incident_staff_create_happy_path(client: TestClient) -> None:
    response = client.post(
        "/api/incidents",
        json={"zoneId": "gate-4", "rawInput": "Large crowd bottleneck at gate 4"},
        headers=auth_headers("staff-1", UserRole.staff),
    )
    body = response.json()
    assert response.status_code == 201
    assert body["status"] == "draft"
    assert body["submittedAt"] is None


def test_incident_volunteer_create_happy_path(client: TestClient) -> None:
    response = client.post(
        "/api/incidents",
        json={"zoneId": "gate-4", "rawInput": "Guest needs medical assistance"},
        headers=auth_headers("vol-1", UserRole.volunteer),
    )
    assert response.status_code == 201
    assert response.json()["reportedByUid"] == "vol-1"


def test_incident_create_rejects_fan(client: TestClient) -> None:
    response = client.post(
        "/api/incidents",
        json={"zoneId": "gate-4", "rawInput": "Issue"},
        headers=auth_headers("fan-1", UserRole.fan),
    )
    assert response.status_code == 403


def test_incident_create_validation_failure(client: TestClient) -> None:
    response = client.post(
        "/api/incidents",
        json={"zoneId": "gate-4", "rawInput": ""},
        headers=auth_headers("staff-1", UserRole.staff),
    )
    assert response.status_code == 400


def test_incident_create_missing_zone_returns_404(client: TestClient) -> None:
    response = client.post(
        "/api/incidents",
        json={"zoneId": "missing-zone", "rawInput": "Issue"},
        headers=auth_headers("staff-1", UserRole.staff),
    )
    assert response.status_code == 404


def test_incident_volunteer_cannot_patch(client: TestClient) -> None:
    response = client.patch(
        "/api/incidents/incident-old",
        json={"status": "submitted"},
        headers=auth_headers("vol-1", UserRole.volunteer),
    )
    assert response.status_code == 403


def test_incident_staff_patch_sets_server_timestamp(client: TestClient) -> None:
    response = client.patch(
        "/api/incidents/incident-old",
        json={"status": "submitted", "submittedAt": "2000-01-01T00:00:00Z"},
        headers=auth_headers("staff-1", UserRole.staff),
    )
    body = response.json()
    assert response.status_code == 200
    assert body["status"] == "submitted"
    assert body["submittedAt"] != "2000-01-01T00:00:00Z"


def test_incident_list_caps_limit(client: TestClient, mock_firestore: FakeFirestore) -> None:
    for index in range(60):
        mock_firestore.store["incidents"][f"incident-{index}"] = {
            **mock_firestore.store["incidents"]["incident-old"],
            "createdAt": mock_firestore.store["incidents"]["incident-old"]["createdAt"],
        }
    response = client.get("/api/incidents?limit=100", headers=auth_headers("staff-1", UserRole.staff))
    assert response.status_code == 200
    assert response.json()["limit"] == 50
    assert len(response.json()["items"]) == 50


def test_incident_rejects_missing_auth(client: TestClient) -> None:
    response = client.get("/api/incidents")
    assert response.status_code == 401
