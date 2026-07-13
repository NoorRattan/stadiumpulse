from conftest import FakeDb, auth_headers
from fastapi.testclient import TestClient

from models.user import UserRole


def test_chat_happy_path_creates_session(client: TestClient) -> None:
    response = client.post(
        "/api/concierge/chat",
        json={"message": "Where is Gate 4?", "language": "en"},
        headers=auth_headers("fan-1", UserRole.fan),
    )
    body = response.json()
    assert response.status_code == 200
    assert body["sessionId"].startswith("conciergeSessions-")
    assert body["detectedLanguage"] == "en"


def test_chat_supports_stateless_public_access(client: TestClient, mock_db: FakeDb) -> None:
    response = client.post("/api/concierge/chat", json={"message": "Hi", "language": "en"})
    assert response.status_code == 200
    assert response.json() == {
        "sessionId": "public-concierge",
        "reply": "Use the north concourse and monitor crowd density closely.",
        "detectedLanguage": "en",
    }
    assert mock_db.store["conciergeSessions"] == {}


def test_chat_validation_failure(client: TestClient) -> None:
    response = client.post(
        "/api/concierge/chat",
        json={"message": "", "language": "en"},
        headers=auth_headers("fan-1", UserRole.fan),
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_chat_rate_limit_is_keyed_by_uid(client: TestClient) -> None:
    for index in range(20):
        response = client.post(
            "/api/concierge/chat",
            json={"message": f"Question {index}", "language": "en"},
            headers=auth_headers("fan-a", UserRole.fan),
        )
        assert response.status_code == 200

    limited = client.post(
        "/api/concierge/chat",
        json={"message": "One too many", "language": "en"},
        headers=auth_headers("fan-a", UserRole.fan),
    )
    other_user = client.post(
        "/api/concierge/chat",
        json={"message": "Different user", "language": "en"},
        headers=auth_headers("fan-b", UserRole.fan),
    )
    assert limited.status_code == 429
    assert other_user.status_code == 200
