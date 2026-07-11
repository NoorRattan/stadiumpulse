import json
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
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_DB_URL", "postgresql://postgres:test@localhost:5432/postgres")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
os.environ.setdefault("ALLOWED_ORIGINS", "http://testserver")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("GEMINI_MODEL_PRIMARY", "gemini-2.5-flash")
os.environ.setdefault("GEMINI_MODEL_LITE", "gemini-2.5-flash-lite")
os.environ.setdefault("LOG_LEVEL", "INFO")

from dependencies import AuthenticatedUser, extract_bearer_token, get_current_user
from limiter import limiter
from main import app
from models.user import UserRole
from services.db import get_pool


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
    def __init__(self, db: "FakeDb", collection_path: str, doc_id: str) -> None:
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
    def __init__(self, db: "FakeDb", path: str) -> None:
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


class FakeDb:
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
        self.store["conciergeSessions"] = {}
        self.store["travelSuggestionsCache"] = {}
        self.store["profiles"] = {}
        self.store["users"] = self.store["profiles"]
        self.store["user_roles"] = {}
        self.store["accessibilitySettings"] = {}

    def zone_row(self, zone_id: str, data: dict[str, Any]) -> dict[str, Any]:
        return {
            "zone_id": zone_id,
            "name": data["name"],
            "type": data["type"],
            "capacity": data["capacity"],
            "current_density_pct": data["currentDensityPct"],
            "last_updated": data["lastUpdated"],
            "lat": data["coordinates"]["lat"],
            "lng": data["coordinates"]["lng"],
        }

    def incident_row(self, incident_id: str, data: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": incident_id,
            "zone_id": data["zoneId"],
            "status": data["status"],
            "raw_input": data["rawInput"],
            "ai_draft_summary": data.get("aiDraftSummary"),
            "severity": data.get("severity"),
            "reported_by_uid": data.get("reportedByUid"),
            "created_at": data["createdAt"],
            "submitted_at": data.get("submittedAt"),
            "resolved_at": data.get("resolvedAt"),
        }

    async def fetch(self, query: str, *args: Any) -> list[dict[str, Any]]:
        normalized = " ".join(query.lower().split())
        if "from public.zones" in normalized:
            if "select zone_id, name, type from" in normalized:
                return [
                    {"zone_id": zone_id, "name": data["name"], "type": data["type"]}
                    for zone_id, data in self.store["zones"].items()
                    if data
                ][:50]
            return [self.zone_row(zone_id, data) for zone_id, data in self.store["zones"].items() if data][:50]
        if "from public.concierge_messages" in normalized:
            session_id = str(args[0])
            rows = [
                {"role": data["role"], "text": data["text"], "created_at": data["createdAt"]}
                for data in self.store.get(f"conciergeSessions/{session_id}/messages", {}).values()
                if data
            ]
            rows.sort(key=lambda row: row["created_at"], reverse=True)
            return rows[:10]
        if "from public.incidents" in normalized:
            rows = [
                self.incident_row(incident_id, data) for incident_id, data in self.store["incidents"].items() if data
            ]
            if "where zone_id = $" in normalized:
                rows = [row for row in rows if row["zone_id"] == args[0]]
                if "status = $" in normalized:
                    rows = [row for row in rows if row["status"] == args[1]]
            elif "where status = $" in normalized:
                rows = [row for row in rows if row["status"] == args[0]]
            if "status <> 'resolved'" in normalized:
                rows = [row for row in rows if row["status"] != "resolved"]
            rows.sort(key=lambda row: row["created_at"], reverse=True)
            limit_arg = next((arg for arg in reversed(args) if isinstance(arg, int)), 20)
            return rows[:limit_arg]
        return []

    async def fetchrow(self, query: str, *args: Any) -> dict[str, Any] | None:
        normalized = " ".join(query.lower().split())
        if "insert into public.profiles" in normalized:
            existing = self.store["profiles"].get(str(args[0]))
            if existing is None:
                existing = {
                    "displayName": args[1],
                    "email": args[2],
                    "role": "fan",
                    "preferredLanguage": "en",
                    "createdAt": args[3],
                }
                self.store["profiles"][str(args[0])] = existing
            return {
                "display_name": existing["displayName"],
                "email": existing["email"],
                "role": existing["role"],
                "preferred_language": existing["preferredLanguage"],
            }
        if "from public.profiles" in normalized:
            data = self.store["profiles"].get(str(args[0]))
            if not data:
                return None
            return {
                "display_name": data["displayName"],
                "email": data["email"],
                "role": data["role"],
                "preferred_language": data["preferredLanguage"],
            }
        if "from public.zones" in normalized:
            data = self.store["zones"].get(str(args[0]))
            return self.zone_row(str(args[0]), data) if data else None
        if "from public.travel_suggestions_cache" in normalized:
            data = self.store["travelSuggestionsCache"].get(str(args[0]))
            if not data:
                return None
            expire_at = data.get("expireAt")
            if isinstance(expire_at, datetime) and expire_at <= datetime.now(tz=UTC):
                return None
            return {"suggestions": data.get("suggestions")}
        if "from public.matches" in normalized:
            data = self.store["matches"].get(str(args[0]))
            if not data:
                return None
            return {
                "id": args[0],
                "venue_zone_ids": data["venueZoneIds"],
                "kickoff_at": data.get("kickoffAt"),
                "home_team": data.get("homeTeam", ""),
                "away_team": data.get("awayTeam", ""),
                "transit_load_estimate": data["transitLoadEstimate"],
            }
        if "update public.concierge_sessions" in normalized:
            session_id = str(args[2])
            data = self.store["conciergeSessions"].get(session_id)
            if data and data.get("userId") == str(args[3]):
                data.update({"lastActiveAt": args[0], "language": args[1]})
                return {"id": session_id}
            return None
        if "from public.briefings" in normalized:
            zone_id = str(args[0])
            rows = [
                (briefing_id, data)
                for briefing_id, data in self.store["briefings"].items()
                if data and data["zoneId"] == zone_id
            ]
            rows.sort(key=lambda item: item[1]["generatedAt"], reverse=True)
            if not rows:
                return None
            briefing_id, data = rows[0]
            return {
                "id": briefing_id,
                "zone_id": data["zoneId"],
                "shift_label": data["shiftLabel"],
                "content": data["content"],
                "generated_by_uid": data["generatedByUid"],
                "generated_at": data["generatedAt"],
            }
        if "from public.accessibility_settings" in normalized:
            data = self.store["accessibilitySettings"].get(str(args[0]))
            if not data:
                return None
            return {
                "high_contrast": data["highContrast"],
                "reduced_motion": data["reducedMotion"],
                "screen_reader_mode": data["screenReaderMode"],
                "preferred_language": data["preferredLanguage"],
            }
        if "update public.incidents" in normalized:
            incident_id = str(args[0])
            data = self.store["incidents"].get(incident_id)
            if not data:
                return None
            data["status"] = args[1]
            if args[2] is not None:
                data["submittedAt"] = args[2]
            if args[3] is not None:
                data["resolvedAt"] = args[3]
            return self.incident_row(incident_id, data)
        return None

    async def fetchval(self, query: str, *args: Any) -> Any:
        normalized = " ".join(query.lower().split())
        if "insert into public.concierge_sessions" in normalized:
            session_id = self.next_id("conciergeSessions")
            self.store["conciergeSessions"][session_id] = {
                "userId": args[0],
                "language": args[1],
                "startedAt": args[2],
                "lastActiveAt": args[2],
            }
            return session_id
        if "insert into public.incidents" in normalized:
            incident_id = self.next_id("incidents")
            self.store["incidents"][incident_id] = {
                "zoneId": args[0],
                "status": "draft",
                "rawInput": args[1],
                "aiDraftSummary": args[2] if len(args) > 3 else None,
                "severity": args[3] if len(args) > 4 else "critical",
                "reportedByUid": args[4] if len(args) > 5 else None,
                "createdAt": args[-1] if isinstance(args[-1], datetime) else datetime.now(tz=UTC),
                "submittedAt": None,
                "resolvedAt": None,
            }
            return incident_id
        if "insert into public.briefings" in normalized:
            briefing_id = self.next_id("briefings")
            self.store["briefings"][briefing_id] = {
                "zoneId": args[0],
                "shiftLabel": args[1],
                "content": args[2],
                "generatedByUid": args[3],
                "generatedAt": args[4],
            }
            return briefing_id
        return None

    async def execute(self, query: str, *args: Any) -> str:
        normalized = " ".join(query.lower().split())
        if "insert into public.profiles" in normalized:
            existing = self.store["profiles"].get(str(args[0]))
            if existing:
                return "UPDATE 1"
            self.store["profiles"][str(args[0])] = {
                "displayName": args[1],
                "email": args[2],
                "role": "fan",
                "preferredLanguage": "en",
                "createdAt": args[3],
            }
            return "INSERT 1"
        if "insert into public.user_roles" in normalized:
            self.store["user_roles"].setdefault(str(args[0]), {"role": args[1] if len(args) > 1 else "fan"})
            return "INSERT 1"
        if "insert into public.concierge_messages" in normalized:
            path = f"conciergeSessions/{args[0]}/messages"
            message_id = self.next_id(path)
            self.store.setdefault(path, {})[message_id] = {"role": args[1], "text": args[2], "createdAt": args[3]}
            return "INSERT 1"
        if "insert into public.travel_suggestions_cache" in normalized:
            suggestions = args[2]
            if isinstance(suggestions, str):
                suggestions = json.loads(suggestions)
            self.store["travelSuggestionsCache"][str(args[0])] = {
                "generatedAt": args[1],
                "suggestions": suggestions,
                "expireAt": args[3],
            }
            return "INSERT 1"
        if "insert into public.accessibility_settings" in normalized:
            self.store["accessibilitySettings"][str(args[0])] = {
                "highContrast": args[1],
                "reducedMotion": args[2],
                "screenReaderMode": args[3],
                "preferredLanguage": args[4],
            }
            return "INSERT 1"
        return "OK"


class FakeAIClient:
    def generate_text(self, prompt: str, *, tier: str) -> str:
        return "Use the north concourse and monitor crowd density closely."

    def generate_json(self, prompt: str, *, tier: str) -> dict[str, Any]:
        return {"detectedLanguage": "en", "translatedText": "hello"}


@pytest.fixture
def mock_db() -> FakeDb:
    return FakeDb()


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
def client(mock_db: FakeDb) -> Iterator[TestClient]:
    app.dependency_overrides[get_pool] = lambda: mock_db
    app.dependency_overrides[get_current_user] = test_current_user_override
    reset_storage = getattr(limiter.limiter.storage, "reset", None)
    if callable(reset_storage):
        reset_storage()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def auth_headers(uid: str = "user-1", role: UserRole = UserRole.fan) -> dict[str, str]:
    return {"Authorization": f"Bearer {uid}:{role.value}"}
