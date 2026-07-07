from conftest import auth_headers
from fastapi.testclient import TestClient

from models.user import UserRole


def test_crowd_zones_staff_happy_path(client: TestClient) -> None:
    response = client.get("/api/crowd/zones", headers=auth_headers("staff-1", UserRole.staff))
    assert response.status_code == 200
    assert response.json()["zones"][0]["zoneId"] == "gate-2"


def test_crowd_zones_volunteer_happy_path(client: TestClient) -> None:
    response = client.get("/api/crowd/zones/gate-4", headers=auth_headers("vol-1", UserRole.volunteer))
    assert response.status_code == 200
    assert response.json()["zoneId"] == "gate-4"
    assert isinstance(response.json()["alert"], str)


def test_crowd_zones_rejects_fan(client: TestClient) -> None:
    response = client.get("/api/crowd/zones", headers=auth_headers("fan-1", UserRole.fan))
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_crowd_zones_rejects_missing_auth(client: TestClient) -> None:
    response = client.get("/api/crowd/zones")
    assert response.status_code == 401


def test_crowd_zone_not_found(client: TestClient) -> None:
    response = client.get("/api/crowd/zones/missing", headers=auth_headers("staff-1", UserRole.staff))
    assert response.status_code == 404
