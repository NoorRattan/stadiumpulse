from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from security import SecurityHeadersMiddleware
from services.demo_service import build_demo_experience, demo_alert
from services.exceptions import ResourceNotFoundError


def test_public_demo_proves_connected_seeded_scenario(client: TestClient) -> None:
    response = client.get("/api/demo")

    assert response.status_code == 200
    payload = response.json()
    assert payload["tournament"] == "FIFA World Cup 2026"
    assert payload["databaseStatus"] == "connected"
    assert payload["dataStatus"] == "simulated"
    assert len(payload["zones"]) == 6
    assert payload["accessibleRoute"]["steps"][-1]["zoneId"] == "seat-block-114"
    assert len(payload["capabilities"]) == 4
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.parametrize(
    ("density", "expected"),
    [(20, "normal"), (60, "Monitor"), (80, "Position"), (95, "urgent")],
)
def test_demo_alert_covers_each_density_band(density: float, expected: str) -> None:
    assert expected in demo_alert("Gate", density)


@pytest.mark.asyncio
async def test_demo_requires_seeded_zones_and_match(mock_db: object) -> None:
    original_zones = deepcopy(mock_db.store["zones"])
    mock_db.store["zones"].pop("gate-2")
    with pytest.raises(ResourceNotFoundError, match="seed has not been applied"):
        await build_demo_experience(mock_db)

    mock_db.store["zones"] = original_zones
    mock_db.store["matches"].clear()
    with pytest.raises(ResourceNotFoundError, match="match has not been seeded"):
        await build_demo_experience(mock_db)


@pytest.mark.asyncio
async def test_security_headers_middleware_passes_non_http_scope() -> None:
    called: list[str] = []

    async def app(scope: object, receive: object, send: object) -> None:
        called.append(scope["type"])

    async def receive() -> dict[str, str]:
        return {"type": "websocket.disconnect"}

    async def send(message: object) -> None:
        raise AssertionError(f"unexpected message: {message}")

    middleware = SecurityHeadersMiddleware(app)
    await middleware({"type": "websocket"}, receive, send)
    assert called == ["websocket"]
