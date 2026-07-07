from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

from google.cloud import firestore

from models.incident import IncidentReport, IncidentSeverity, IncidentStatus
from models.zone import Zone, ZoneType
from services.ai_core import StadiumPulseAIClient, get_ai_client
from services.firestore_client import get_firestore_client

CongestionBand = Literal["NORMAL", "MODERATE", "HIGH", "CRITICAL"]
ActionType = Literal["MONITOR", "SUGGEST_OVERFLOW", "URGENT_REROUTE"]


@dataclass(frozen=True)
class CrowdAlert:
    zone_id: str
    band: CongestionBand
    action_type: ActionType
    message: str
    overflow_zone_id: str | None = None


def congestion_band(density_pct: float) -> CongestionBand:
    if density_pct < 50:
        return "NORMAL"
    if density_pct < 75:
        return "MODERATE"
    if density_pct < 90:
        return "HIGH"
    return "CRITICAL"


def congestion_multiplier(density_pct: float) -> float:
    return 1.0 + (1.5 * (density_pct / 100))


def load_zones(db: firestore.Client) -> list[Zone]:
    snapshots = db.collection("zones").limit(50).stream()
    zones: list[Zone] = []
    for snapshot in snapshots:
        data = snapshot.to_dict()
        if data:
            zones.append(Zone(zoneId=snapshot.id, **data))
    return zones


def nearest_zone_matching(
    zone: Zone,
    zones: list[Zone],
    max_band: CongestionBand = "MODERATE",
) -> Zone | None:
    allowed_order: dict[CongestionBand, int] = {"NORMAL": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}
    candidates = [
        candidate
        for candidate in zones
        if candidate.zone_id != zone.zone_id
        and candidate.type == zone.type
        and allowed_order[congestion_band(candidate.current_density_pct)] <= allowed_order[max_band]
    ]
    candidates.sort(
        key=lambda candidate: (
            abs(candidate.coordinates.lat - zone.coordinates.lat)
            + abs(candidate.coordinates.lng - zone.coordinates.lng)
        )
    )
    return candidates[0] if candidates else None


def action_for_band(band: CongestionBand) -> ActionType | None:
    if band == "MODERATE":
        return "MONITOR"
    if band == "HIGH":
        return "SUGGEST_OVERFLOW"
    if band == "CRITICAL":
        return "URGENT_REROUTE"
    return None


def phrase_alert(
    zone: Zone,
    band: CongestionBand,
    action_type: ActionType,
    overflow_zone: Zone | None,
    ai_client: StadiumPulseAIClient | None = None,
) -> str:
    client = ai_client or get_ai_client()
    prompt = (
        "Write one concise StadiumPulse crowd alert for venue staff. "
        "Use the supplied deterministic band and action; do not change them.\n"
        f"Zone: {zone.model_dump(by_alias=True)}\n"
        f"Band: {band}\n"
        f"Action: {action_type}\n"
        f"Candidate overflow zone: {overflow_zone.model_dump(by_alias=True) if overflow_zone else None}"
    )
    return client.generate_text(prompt, tier="lite")


def build_alert(
    zone: Zone,
    zones: list[Zone],
    db: firestore.Client | None = None,
    ai_client: StadiumPulseAIClient | None = None,
) -> CrowdAlert | None:
    band = congestion_band(zone.current_density_pct)
    action_type = action_for_band(band)
    if action_type is None:
        return None

    overflow_zone = nearest_zone_matching(zone, zones) if band in {"HIGH", "CRITICAL"} else None
    message = phrase_alert(zone, band, action_type, overflow_zone, ai_client)
    if band == "CRITICAL":
        auto_flag_incident(zone, zone.current_density_pct, db=db)
    return CrowdAlert(
        zone_id=zone.zone_id,
        band=band,
        action_type=action_type,
        message=message,
        overflow_zone_id=overflow_zone.zone_id if overflow_zone else None,
    )


def auto_flag_incident(
    zone: Zone,
    density_pct: float,
    db: firestore.Client | None = None,
) -> IncidentReport:
    firestore_client = db or get_firestore_client()
    incident_ref = firestore_client.collection("incidents").document()
    created_at = datetime.now(tz=UTC)
    raw_input = (
        f"Auto-flagged: {zone.name} crowd density reached {density_pct}% at "
        f"{created_at.isoformat()}. No human report filed yet."
    )
    incident = IncidentReport(
        incidentId=incident_ref.id,
        zoneId=zone.zone_id,
        status=IncidentStatus.draft,
        rawInput=raw_input,
        aiDraftSummary=None,
        severity=IncidentSeverity.critical,
        reportedByUid=None,
        createdAt=created_at,
        submittedAt=None,
        resolvedAt=None,
    )
    incident_ref.set(incident.model_dump(by_alias=True, exclude={"incident_id"}))
    return incident


def list_zone_alerts(
    zone_type: ZoneType | None = None,
    db: firestore.Client | None = None,
) -> list[CrowdAlert]:
    firestore_client = db or get_firestore_client()
    zones = load_zones(firestore_client)
    filtered = [zone for zone in zones if zone_type is None or zone.type == zone_type]
    return [alert for zone in filtered if (alert := build_alert(zone, zones, firestore_client)) is not None]
