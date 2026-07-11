import pytest
from conftest import FakeDb, FakeSnapshot, auth_headers
from fastapi.testclient import TestClient

from models.user import UserRole
from routes.incident_routes import incident_from_mapping, incident_from_snapshot
from services.exceptions import ResourceNotFoundError


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


def test_incident_from_empty_snapshot_raises_not_found(mock_db: FakeDb) -> None:
    snapshot = FakeSnapshot("empty", {}, mock_db.collection("incidents").document("empty"))

    with pytest.raises(ResourceNotFoundError):
        incident_from_snapshot(snapshot)


def test_incident_mapping_none_and_snapshot_happy_path(mock_db: FakeDb) -> None:
    snapshot = FakeSnapshot(
        "incident-old",
        mock_db.store["incidents"]["incident-old"],
        mock_db.collection("incidents").document("incident-old"),
    )
    with pytest.raises(ResourceNotFoundError):
        incident_from_mapping(None)
    assert incident_from_snapshot(snapshot).incident_id == "incident-old"


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


def test_incident_list_caps_limit(client: TestClient, mock_db: FakeDb) -> None:
    for index in range(60):
        mock_db.store["incidents"][f"incident-{index}"] = {
            **mock_db.store["incidents"]["incident-old"],
            "createdAt": mock_db.store["incidents"]["incident-old"]["createdAt"],
        }
    response = client.get("/api/incidents?limit=100", headers=auth_headers("staff-1", UserRole.staff))
    assert response.status_code == 200
    assert response.json()["limit"] == 50
    assert len(response.json()["items"]) == 50


def test_incident_rejects_missing_auth(client: TestClient) -> None:
    response = client.get("/api/incidents")
    assert response.status_code == 401


def test_incident_list_zone_filter_status_filter_and_empty_snapshot(
    client: TestClient,
    mock_db: FakeDb,
) -> None:
    mock_db.store["incidents"]["empty"] = {}

    response = client.get(
        "/api/incidents?zoneId=gate-4&status=draft&limit=5",
        headers=auth_headers("staff-1", UserRole.staff),
    )

    assert response.status_code == 200
    assert response.json()["items"][0]["incidentId"] == "incident-old"


def test_incident_list_missing_zone_returns_404(client: TestClient) -> None:
    response = client.get("/api/incidents?zoneId=missing-zone", headers=auth_headers("staff-1", UserRole.staff))

    assert response.status_code == 404


def test_incident_staff_patch_missing_and_resolved(client: TestClient) -> None:
    missing = client.patch(
        "/api/incidents/missing-incident",
        json={"status": "resolved"},
        headers=auth_headers("staff-1", UserRole.staff),
    )
    resolved = client.patch(
        "/api/incidents/incident-old",
        json={"status": "resolved"},
        headers=auth_headers("staff-1", UserRole.staff),
    )

    assert missing.status_code == 404
    assert resolved.status_code == 200
    assert resolved.json()["resolvedAt"] is not None
