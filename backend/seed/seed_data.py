from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

from google.cloud import firestore

from dependencies import ensure_firebase_app
from logger import configure_logging, get_logger
from services.firestore_client import get_firestore_client

logger = get_logger(__name__)


def utc_now() -> datetime:
    return datetime.now(tz=UTC)


def seed_zones(db: firestore.Client, timestamp: datetime) -> None:
    zones: Mapping[str, dict[str, Any]] = {
        "north-concourse": {
            "name": "North Concourse",
            "type": "concourse",
            "capacity": 4000,
            "currentDensityPct": 78.5,
            "lastUpdated": timestamp,
            "coordinates": {"lat": 32.7473, "lng": -97.0945},
        },
        "east-concourse": {
            "name": "East Concourse",
            "type": "concourse",
            "capacity": 3500,
            "currentDensityPct": 44.0,
            "lastUpdated": timestamp,
            "coordinates": {"lat": 32.7475, "lng": -97.0920},
        },
        "gate-2": {
            "name": "Gate 2",
            "type": "gate",
            "capacity": 1000,
            "currentDensityPct": 30.0,
            "lastUpdated": timestamp,
            "coordinates": {"lat": 32.7470, "lng": -97.0940},
        },
        "gate-4": {
            "name": "Gate 4",
            "type": "gate",
            "capacity": 1200,
            "currentDensityPct": 66.0,
            "lastUpdated": timestamp,
            "coordinates": {"lat": 32.7481, "lng": -97.0928},
        },
        "seat-block-114": {
            "name": "Section 114",
            "type": "seating-block",
            "capacity": 900,
            "currentDensityPct": 41.0,
            "lastUpdated": timestamp,
            "coordinates": {"lat": 32.7477, "lng": -97.0933},
        },
        "south-transit-hub": {
            "name": "South Transit Hub",
            "type": "transit-hub",
            "capacity": 2600,
            "currentDensityPct": 35.0,
            "lastUpdated": timestamp,
            "coordinates": {"lat": 32.7464, "lng": -97.0951},
        },
    }
    for zone_id, payload in zones.items():
        db.collection("zones").document(zone_id).set(payload, merge=True)


def seed_matches(db: firestore.Client, timestamp: datetime) -> None:
    db.collection("matches").document("m_2026_014").set(
        {
            "venueZoneIds": ["north-concourse", "gate-4", "seat-block-114"],
            "kickoffAt": timestamp,
            "homeTeam": "United States",
            "awayTeam": "Canada",
            "transitLoadEstimate": "high",
        },
        merge=True,
    )


def seed_incidents(db: firestore.Client, timestamp: datetime) -> None:
    db.collection("incidents").document("demo-gate-4-turnstile").set(
        {
            "zoneId": "gate-4",
            "status": "draft",
            "rawInput": "Large crowd bottleneck at gate 4, one turnstile down",
            "aiDraftSummary": (
                "Turnstile malfunction at Gate 4 causing queue buildup; "
                "recommend rerouting to Gate 5 and dispatching maintenance."
            ),
            "severity": "medium",
            "reportedByUid": None,
            "createdAt": timestamp,
            "submittedAt": None,
            "resolvedAt": None,
        },
        merge=True,
    )


def run_seed(db: firestore.Client) -> None:
    timestamp = utc_now()
    seed_zones(db, timestamp)
    seed_matches(db, timestamp)
    seed_incidents(db, timestamp)


def main() -> int:
    configure_logging("INFO")
    ensure_firebase_app()
    db = get_firestore_client()
    run_seed(db)
    logger.info("Seed data upserted")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
