from conftest import FakeFirestore, auth_headers
from fastapi.testclient import TestClient

from models.user import UserRole


def test_get_me_happy_path(client: TestClient, mock_firestore: FakeFirestore) -> None:
    mock_firestore.store["users"]["fan-1"] = {
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


def test_bootstrap_always_creates_fan_role(client: TestClient, mock_firestore: FakeFirestore) -> None:
    response = client.post("/api/auth/bootstrap", headers=auth_headers("staff-token", UserRole.staff))
    assert response.status_code == 201
    assert response.json()["role"] == "fan"
    assert mock_firestore.store["users"]["staff-token"]["role"] == "fan"
