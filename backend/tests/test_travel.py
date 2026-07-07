from conftest import FakeFirestore, auth_headers
from fastapi.testclient import TestClient

from models.user import UserRole


def test_travel_suggestions_happy_path(client: TestClient) -> None:
    response = client.get(
        "/api/travel/suggestions?matchId=m_2026_014",
        headers=auth_headers("fan-1", UserRole.fan),
    )
    body = response.json()
    assert response.status_code == 200
    assert body["matchId"] == "m_2026_014"
    assert body["suggestions"][0]["mode"] == "rail"


def test_travel_uses_fresh_cache(client: TestClient, mock_firestore: FakeFirestore) -> None:
    from datetime import UTC, datetime, timedelta

    mock_firestore.store["travelSuggestionsCache"]["m_2026_014"] = {
        "generatedAt": datetime.now(tz=UTC),
        "expireAt": datetime.now(tz=UTC) + timedelta(hours=1),
        "suggestions": [{"mode": "rail", "description": "Cached rail option"}],
    }
    response = client.get(
        "/api/travel/suggestions?matchId=m_2026_014",
        headers=auth_headers("fan-1", UserRole.fan),
    )
    assert response.status_code == 200
    assert response.json()["suggestions"][0]["description"] == "Cached rail option"


def test_travel_rejects_missing_auth(client: TestClient) -> None:
    response = client.get("/api/travel/suggestions?matchId=m_2026_014")
    assert response.status_code == 401


def test_travel_validation_failure(client: TestClient) -> None:
    response = client.get("/api/travel/suggestions", headers=auth_headers("fan-1", UserRole.fan))
    assert response.status_code == 400


def test_travel_missing_match_returns_404(client: TestClient) -> None:
    response = client.get(
        "/api/travel/suggestions?matchId=missing-match",
        headers=auth_headers("fan-1", UserRole.fan),
    )
    assert response.status_code == 404
