from conftest import auth_headers
from fastapi.testclient import TestClient

from models.user import UserRole


def test_accessibility_get_defaults(client: TestClient) -> None:
    response = client.get("/api/accessibility/settings", headers=auth_headers("fan-1", UserRole.fan))
    assert response.status_code == 200
    assert response.json()["preferredLanguage"] == "en"


def test_accessibility_put_happy_path(client: TestClient) -> None:
    payload = {"highContrast": True, "reducedMotion": True, "screenReaderMode": False, "preferredLanguage": "en"}
    response = client.put("/api/accessibility/settings", json=payload, headers=auth_headers("fan-1", UserRole.fan))
    assert response.status_code == 200
    assert response.json() == payload


def test_accessibility_rejects_missing_auth(client: TestClient) -> None:
    response = client.get("/api/accessibility/settings")
    assert response.status_code == 401


def test_accessibility_validation_failure(client: TestClient) -> None:
    response = client.put(
        "/api/accessibility/settings",
        json={"highContrast": True, "reducedMotion": True, "screenReaderMode": False, "preferredLanguage": ""},
        headers=auth_headers("fan-1", UserRole.fan),
    )
    assert response.status_code == 400
