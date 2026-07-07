import os
from collections.abc import Iterator
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from fastapi import Header, Request
from fastapi.testclient import TestClient

import services.briefing_service as briefing_service
import services.concierge_service as concierge_service
import services.crowd_service as crowd_service
import services.incident_service as incident_service
import services.travel_service as travel_service
import services.wayfinding_service as wayfinding_service

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("GCP_PROJECT_ID", "stadiumpulse-wc26")
os.environ.setdefault("ALLOWED_ORIGINS", "http://testserver")
os.environ.setdefault("VERTEX_AI_LOCATION", "us-central1")
os.environ.setdefault("GEMINI_MODEL_PRIMARY", "gemini-3.5-flash")
os.environ.setdefault("GEMINI_MODEL_LITE", "gemini-3.1-flash-lite")
os.environ.setdefault("LOG_LEVEL", "INFO")

from dependencies import AuthenticatedUser, extract_bearer_token, get_current_user
from limiter import limiter
from main import app
from models.user import UserRole
from services.firestore_client import get_firestore_client


class FakeSnapshot:
    def __init__(self, doc_id: str, data: dict[str, Any] | None, reference: "FakeDocumentReference") -> None:
        self.id = doc_id
        self._data = deepcopy(data) if data is not None else None
        self.reference = reference

    @property
    def exists(self) -> bool:
        return self._data is not None

    def to_dict(self) -> dict[str, Any]:
        return deepcopy(self._data or {})


class FakeDocumentReference:
    def __init__(self, db: "FakeFirestore", collection_path: str, doc_id: str) -> None:
        self._db = db
        self._collection_path = collection_path
        self.id = doc_id

    def get(self) -> FakeSnapshot:
        return FakeSnapshot(self.id, self._db.store.get(self._collection_path, {}).get(self.id), self)

    def set(self, data: dict[str, Any], merge: bool = False) -> None:
        collection = self._db.store.setdefault(self._collection_path, {})
        if merge and self.id in collection:
            collection[self.id].update(deepcopy(data))
        else:
            collection[self.id] = deepcopy(data)

    def update(self, data: dict[str, Any]) -> None:
        collection = self._db.store.setdefault(self._collection_path, {})
        if self.id not in collection:
            raise KeyError(self.id)
        collection[self.id].update(deepcopy(data))

    def collection(self, name: str) -> "FakeCollectionReference":
        return FakeCollectionReference(self._db, f"{self._collection_path}/{self.id}/{name}")


class FakeQuery:
    def __init__(
        self,
        collection: "FakeCollectionReference",
        filters: list[tuple[str, str, Any]] | None = None,
        order: tuple[str, object] | None = None,
        limit_count: int | None = None,
    ) -> None:
        self._collection = collection
        self._filters = filters or []
        self._order = order
        self._limit_count = limit_count

    def where(self, field: str, op: str, value: Any) -> "FakeQuery":
        return FakeQuery(self._collection, [*self._filters, (field, op, value)], self._order, self._limit_count)

    def order_by(self, field: str, direction: object | None = None) -> "FakeQuery":
        return FakeQuery(self._collection, self._filters, (field, direction), self._limit_count)

    def limit(self, count: int) -> "FakeQuery":
        return FakeQuery(self._collection, self._filters, self._order, count)

    def stream(self) -> list[FakeSnapshot]:
        items = list(self._collection._items())
        for field, op, value in self._filters:
            if op == "==":
                items = [(doc_id, data) for doc_id, data in items if data.get(field) == value]
            elif op == "!=":
                items = [(doc_id, data) for doc_id, data in items if data.get(field) != value]
        if self._order:
            field, direction = self._order
            reverse = str(direction).upper().endswith("DESCENDING")
            items.sort(key=lambda item: item[1].get(field), reverse=reverse)
        if self._limit_count is not None:
            items = items[: self._limit_count]
        return [FakeSnapshot(doc_id, data, self._collection.document(doc_id)) for doc_id, data in items]


class FakeCollectionReference:
    def __init__(self, db: "FakeFirestore", path: str) -> None:
        self._db = db
        self._path = path

    def _items(self) -> list[tuple[str, dict[str, Any]]]:
        return list(self._db.store.get(self._path, {}).items())

    def document(self, doc_id: str | None = None) -> FakeDocumentReference:
        generated_id = doc_id or self._db.next_id(self._path)
        return FakeDocumentReference(self._db, self._path, generated_id)

    def where(self, field: str, op: str, value: Any) -> FakeQuery:
        return FakeQuery(self).where(field, op, value)

    def order_by(self, field: str, direction: object | None = None) -> FakeQuery:
        return FakeQuery(self).order_by(field, direction)

    def limit(self, count: int) -> FakeQuery:
        return FakeQuery(self).limit(count)

    def stream(self) -> list[FakeSnapshot]:
        return FakeQuery(self).stream()


class FakeFirestore:
    def __init__(self) -> None:
        self.store: dict[str, dict[str, dict[str, Any]]] = {}
        self._counters: dict[str, int] = {}
        self.seed()

    def next_id(self, collection_path: str) -> str:
        self._counters[collection_path] = self._counters.get(collection_path, 0) + 1
        return f"{collection_path.split('/')[-1]}-{self._counters[collection_path]}"

    def collection(self, path: str) -> FakeCollectionReference:
        return FakeCollectionReference(self, path)

    def seed(self) -> None:
        now = datetime(2026, 6, 15, 18, 42, tzinfo=UTC)
        self.store["zones"] = {
            "gate-2": {
                "name": "Gate 2",
                "type": "gate",
                "capacity": 1000,
                "currentDensityPct": 30.0,
                "lastUpdated": now,
                "coordinates": {"lat": 32.7470, "lng": -97.0940},
            },
            "gate-4": {
                "name": "Gate 4",
                "type": "gate",
                "capacity": 1200,
                "currentDensityPct": 82.0,
                "lastUpdated": now,
                "coordinates": {"lat": 32.7481, "lng": -97.0928},
            },
            "north-concourse": {
                "name": "North Concourse",
                "type": "concourse",
                "capacity": 4000,
                "currentDensityPct": 78.5,
                "lastUpdated": now,
                "coordinates": {"lat": 32.7473, "lng": -97.0945},
            },
            "east-concourse": {
                "name": "East Concourse",
                "type": "concourse",
                "capacity": 3500,
                "currentDensityPct": 44.0,
                "lastUpdated": now,
                "coordinates": {"lat": 32.7475, "lng": -97.0920},
            },
            "seat-block-114": {
                "name": "Section 114",
                "type": "seating-block",
                "capacity": 900,
                "currentDensityPct": 41.0,
                "lastUpdated": now,
                "coordinates": {"lat": 32.7477, "lng": -97.0933},
            },
            "south-transit-hub": {
                "name": "South Transit Hub",
                "type": "transit-hub",
                "capacity": 2600,
                "currentDensityPct": 35.0,
                "lastUpdated": now,
                "coordinates": {"lat": 32.7464, "lng": -97.0951},
            },
        }
        self.store["matches"] = {
            "m_2026_014": {
                "venueZoneIds": ["gate-2", "north-concourse"],
                "kickoffAt": now + timedelta(hours=3),
                "homeTeam": "United States",
                "awayTeam": "Canada",
                "transitLoadEstimate": "high",
            }
        }
        self.store["incidents"] = {
            "incident-old": {
                "zoneId": "gate-4",
                "status": "draft",
                "rawInput": "One turnstile is down.",
                "aiDraftSummary": "Turnstile outage at Gate 4.",
                "severity": "medium",
                "reportedByUid": "staff-1",
                "createdAt": now - timedelta(minutes=10),
                "submittedAt": None,
                "resolvedAt": None,
            }
        }
        self.store["briefings"] = {
            "briefing-old": {
                "zoneId": "gate-4",
                "shiftLabel": "Morning - Gates Open to Kickoff",
                "content": "Existing briefing",
                "generatedByUid": "staff-1",
                "generatedAt": now,
            }
        }
        self.store["travelSuggestionsCache"] = {}
        self.store["users"] = {}
        self.store["accessibilitySettings"] = {}


class FakeAIClient:
    def generate_text(self, prompt: str, *, tier: str) -> str:
        return "Use the north concourse and monitor crowd density closely."

    def generate_json(self, prompt: str, *, tier: str) -> dict[str, Any]:
        return {"detectedLanguage": "en", "translatedText": "hello"}


@pytest.fixture
def mock_firestore() -> FakeFirestore:
    return FakeFirestore()


@pytest.fixture
def mock_genai_client() -> FakeAIClient:
    return FakeAIClient()


@pytest.fixture(autouse=True)
def patch_ai_helpers(monkeypatch: pytest.MonkeyPatch, mock_genai_client: FakeAIClient) -> Iterator[None]:
    monkeypatch.setattr(concierge_service, "get_ai_client", lambda: mock_genai_client)
    monkeypatch.setattr(crowd_service, "get_ai_client", lambda: mock_genai_client)
    monkeypatch.setattr(
        incident_service,
        "incidentTriageFlow",
        lambda zone_id, zone_name, raw_input: {"summary": f"Summary for {zone_name}", "severity": "medium"},
    )
    monkeypatch.setattr(briefing_service, "briefingFlow", lambda zone, shift_label, open_incidents: "Arrive ready.")
    monkeypatch.setattr(
        travel_service,
        "describe_travel_options",
        lambda options, transit_load_estimate: [f"Use {option['mode']}." for option in options],
    )
    monkeypatch.setattr(
        wayfinding_service,
        "wayfindingFlow",
        lambda baseline_path, alternative_paths, accessibility_needs: [
            {
                "steps": [{"instruction": f"Go to {zone_id}.", "zoneId": zone_id} for zone_id in baseline_path],
                "estimatedMinutes": 6,
                "congestionLevel": "medium",
            }
        ],
    )
    yield


async def test_current_user_override(
    request: Request,
    authorization: str | None = Header(default=None),
) -> AuthenticatedUser:
    token = extract_bearer_token(authorization)
    parts = token.split(":")
    uid = parts[0]
    role = UserRole(parts[1]) if len(parts) > 1 else UserRole.fan
    current_user = AuthenticatedUser(
        uid=uid,
        role=role,
        email=f"{uid}@example.com",
        displayName=f"{role.value.title()} User",
    )
    request.state.current_user = current_user
    return current_user


@pytest.fixture
def client(mock_firestore: FakeFirestore) -> Iterator[TestClient]:
    app.dependency_overrides[get_firestore_client] = lambda: mock_firestore
    app.dependency_overrides[get_current_user] = test_current_user_override
    try:
        limiter.limiter.storage.reset()
    except AttributeError:
        pass
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def auth_headers(uid: str = "user-1", role: UserRole = UserRole.fan) -> dict[str, str]:
    return {"Authorization": f"Bearer {uid}:{role.value}"}
