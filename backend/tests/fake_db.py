import json
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from fake_db_seed import build_seed_store


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
        self.store: dict[str, Any] = {}
        self._counters: dict[str, int] = {}
        self.seed()

    def next_id(self, collection_path: str) -> str:
        self._counters[collection_path] = self._counters.get(collection_path, 0) + 1
        return f"{collection_path.split('/')[-1]}-{self._counters[collection_path]}"

    def collection(self, path: str) -> FakeCollectionReference:
        return FakeCollectionReference(self, path)

    def seed(self) -> None:
        self.store.update(build_seed_store())

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
        if "from public.zone_readings" in normalized:
            return [{"density_pct": value} for value in reversed(self.store["zoneReadings"].get(str(args[0]), []))][:8]
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

    @staticmethod
    def _serialize_profile(data: dict[str, Any]) -> dict[str, Any]:
        return {
            "display_name": data["displayName"],
            "email": data["email"],
            "role": data["role"],
            "preferred_language": data["preferredLanguage"],
        }

    def _upsert_profile(self, args: tuple[Any, ...]) -> dict[str, Any]:
        uid = str(args[0])
        existing = self.store["profiles"].get(uid)
        if existing is None:
            existing = {
                "displayName": args[1],
                "email": args[2],
                "role": "fan",
                "preferredLanguage": "en",
                "createdAt": args[3],
            }
            self.store["profiles"][uid] = existing
        return self._serialize_profile(existing)

    def _load_profile(self, args: tuple[Any, ...]) -> dict[str, Any] | None:
        data = self.store["profiles"].get(str(args[0]))
        return self._serialize_profile(data) if data else None

    def _load_travel_cache(self, args: tuple[Any, ...]) -> dict[str, Any] | None:
        data = self.store["travelSuggestionsCache"].get(str(args[0]))
        if not data:
            return None
        expire_at = data.get("expireAt")
        if isinstance(expire_at, datetime) and expire_at <= datetime.now(tz=UTC):
            return None
        return {"suggestions": data.get("suggestions")}

    def _load_match(self, args: tuple[Any, ...]) -> dict[str, Any] | None:
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

    def _update_concierge_session(self, args: tuple[Any, ...]) -> dict[str, Any] | None:
        session_id = str(args[2])
        data = self.store["conciergeSessions"].get(session_id)
        if data and data.get("userId") == str(args[3]):
            data.update({"lastActiveAt": args[0], "language": args[1]})
            return {"id": session_id}
        return None

    def _load_latest_briefing(self, args: tuple[Any, ...]) -> dict[str, Any] | None:
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

    def _load_accessibility_settings(self, args: tuple[Any, ...]) -> dict[str, Any] | None:
        data = self.store["accessibilitySettings"].get(str(args[0]))
        if not data:
            return None
        return {
            "high_contrast": data["highContrast"],
            "reduced_motion": data["reducedMotion"],
            "screen_reader_mode": data["screenReaderMode"],
            "preferred_language": data["preferredLanguage"],
        }

    def _update_incident(self, args: tuple[Any, ...]) -> dict[str, Any] | None:
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

    async def fetchrow(self, query: str, *args: Any) -> dict[str, Any] | None:
        normalized = " ".join(query.lower().split())
        if "insert into public.profiles" in normalized:
            return self._upsert_profile(args)
        if "from public.profiles" in normalized:
            return self._load_profile(args)
        if "from public.zones" in normalized:
            data = self.store["zones"].get(str(args[0]))
            return self.zone_row(str(args[0]), data) if data else None
        if "from public.travel_suggestions_cache" in normalized:
            return self._load_travel_cache(args)
        if "from public.matches" in normalized:
            return self._load_match(args)
        if "update public.concierge_sessions" in normalized:
            return self._update_concierge_session(args)
        if "from public.briefings" in normalized:
            return self._load_latest_briefing(args)
        if "from public.accessibility_settings" in normalized:
            return self._load_accessibility_settings(args)
        if "update public.incidents" in normalized:
            return self._update_incident(args)
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
            if "where not exists" in normalized:
                duplicate = any(
                    data
                    and data["zoneId"] == args[0]
                    and data["status"] != "resolved"
                    and data["rawInput"].startswith("Auto-flagged:")
                    for data in self.store["incidents"].values()
                )
                if duplicate:
                    return None
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
        if "insert into public.zone_readings" in normalized:
            return "INSERT 0 6"
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
            self.store.setdefault(path, {})[message_id] = {
                "role": args[1],
                "text": args[2],
                "createdAt": args[3],
            }
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
