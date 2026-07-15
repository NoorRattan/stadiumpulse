import pytest
from conftest import auth_headers
from fastapi.testclient import TestClient

from models.user import UserRole


def test_public_experience_covers_requested_fan_information(client: TestClient) -> None:
    response = client.get("/api/experience")

    assert response.status_code == 200
    payload = response.json()
    assert payload["dataStatus"] == "curated-and-simulated"
    assert payload["tournament"]["name"] == "FIFA World Cup 2026"
    assert payload["officialTicketUrl"] == "https://www.fifa.com/tickets"
    assert len(payload["matchTicker"]) == 2
    assert len(payload["matches"]) == 3
    assert len(payload["venues"]) == 3
    assert {item["category"] for item in payload["amenities"]} >= {"food", "retail", "medical"}
    assert len(payload["fanEvents"]) == 3
    assert len(payload["sustainability"]) == 4
    assert len(payload["alerts"]) == 2
    assert len(payload["faq"]) == 5


def test_account_overview_requires_auth_and_labels_demo_ticket(client: TestClient) -> None:
    missing = client.get("/api/account/overview")
    response = client.get("/api/account/overview", headers=auth_headers("fan-123456", UserRole.fan))

    assert missing.status_code == 401
    assert response.status_code == 200
    payload = response.json()
    assert payload["uid"] == "fan-123456"
    assert payload["role"] == "fan"
    assert payload["tickets"][0]["status"] == "demo-pass"
    assert "not an official FIFA ticket" in payload["tickets"][0]["disclaimer"]
    assert payload["preferences"]["accessibilityNeeds"] == ["No saved accessibility settings"]

    settings = {
        "highContrast": True,
        "reducedMotion": True,
        "screenReaderMode": True,
        "preferredLanguage": "fr",
    }
    saved = client.put(
        "/api/accessibility/settings",
        json=settings,
        headers=auth_headers("fan-123456", UserRole.fan),
    )
    refreshed = client.get(
        "/api/account/overview",
        headers=auth_headers("fan-123456", UserRole.fan),
    )
    assert saved.status_code == 200
    assert refreshed.json()["preferences"]["language"] == "fr"
    assert refreshed.json()["preferences"]["accessibilityNeeds"] == [
        "high contrast",
        "reduced motion",
        "screen reader mode",
    ]

    cleared = client.put(
        "/api/accessibility/settings",
        json={
            "highContrast": False,
            "reducedMotion": False,
            "screenReaderMode": False,
            "preferredLanguage": "en",
        },
        headers=auth_headers("fan-123456", UserRole.fan),
    )
    no_needs = client.get(
        "/api/account/overview",
        headers=auth_headers("fan-123456", UserRole.fan),
    )
    assert cleared.status_code == 200
    assert no_needs.json()["preferences"]["accessibilityNeeds"] == ["No saved accessibility settings"]


@pytest.mark.parametrize(
    ("path", "role", "expected_portal"),
    [
        ("/api/portals/volunteer", UserRole.volunteer, "volunteer"),
        ("/api/portals/operations", UserRole.staff, "operations"),
        ("/api/portals/venue-staff", UserRole.staff, "venue-staff"),
        ("/api/portals/command-center", UserRole.staff, "command-center"),
    ],
)
def test_role_portals_return_scoped_simulated_workspaces(
    client: TestClient,
    path: str,
    role: UserRole,
    expected_portal: str,
) -> None:
    response = client.get(path, headers=auth_headers(f"{role.value}-1", role))

    assert response.status_code == 200
    payload = response.json()
    assert payload["portal"] == expected_portal
    assert payload["role"] == role.value
    assert payload["dataStatus"] == "simulated"
    assert payload["cards"]
    assert payload["advancedCapabilities"]


@pytest.mark.parametrize(
    "path",
    [
        "/api/portals/volunteer",
        "/api/portals/operations",
        "/api/portals/venue-staff",
        "/api/portals/command-center",
    ],
)
def test_fans_cannot_open_role_portals(client: TestClient, path: str) -> None:
    response = client.get(path, headers=auth_headers("fan-1", UserRole.fan))

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"
