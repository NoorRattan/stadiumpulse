from datetime import UTC, datetime, timedelta
from typing import Any


def _zones(now: datetime) -> dict[str, dict[str, Any]]:
    return {
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


def _matches(now: datetime) -> dict[str, dict[str, Any]]:
    return {
        "m_2026_014": {
            "venueZoneIds": ["gate-2", "north-concourse"],
            "kickoffAt": now + timedelta(hours=3),
            "homeTeam": "United States",
            "awayTeam": "Canada",
            "transitLoadEstimate": "high",
        }
    }


def _incidents(now: datetime) -> dict[str, dict[str, Any]]:
    return {
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


def _briefings(now: datetime) -> dict[str, dict[str, Any]]:
    return {
        "briefing-old": {
            "zoneId": "gate-4",
            "shiftLabel": "Morning - Gates Open to Kickoff",
            "content": "Existing briefing",
            "generatedByUid": "staff-1",
            "generatedAt": now,
        }
    }


def build_seed_store() -> dict[str, Any]:
    now = datetime(2026, 6, 15, 18, 42, tzinfo=UTC)
    profiles: dict[str, dict[str, Any]] = {}
    return {
        "zones": _zones(now),
        "matches": _matches(now),
        "incidents": _incidents(now),
        "briefings": _briefings(now),
        "conciergeSessions": {},
        "travelSuggestionsCache": {},
        "profiles": profiles,
        "users": profiles,
        "user_roles": {},
        "accessibilitySettings": {},
        "zoneReadings": {"gate-4": [70.0, 74.0, 77.0, 80.0, 82.0]},
    }
