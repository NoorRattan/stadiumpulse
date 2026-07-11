from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

import asyncpg

from models.incident import IncidentReport, IncidentSeverity, IncidentStatus
from models.zone import Zone, ZoneType
from services.ai_core import StadiumPulseAIClient, get_ai_client
from services.db import get_pool

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


def zone_from_row(row: object) -> Zone:
    data = dict(row)
    return Zone(
        zoneId=data["zone_id"],
        name=data["name"],
        type=data["type"],
        capacity=data["capacity"],
        currentDensityPct=float(data["current_density_pct"]),
        lastUpdated=data["last_updated"],
        coordinates={"lat": data["lat"], "lng": data["lng"]},
    )


async def load_zones(db: asyncpg.Pool) -> list[Zone]:
    rows = await db.fetch(
        """
        select zone_id, name, type, capacity, current_density_pct, last_updated, lat, lng
        from public.zones
        order by zone_id
        limit 50
        """
    )
    return [zone_from_row(row) for row in rows if row]


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
    db: asyncpg.Pool | None = None,
    ai_client: StadiumPulseAIClient | None = None,
) -> CrowdAlert | None:
    band = congestion_band(zone.current_density_pct)
    action_type = action_for_band(band)
    if action_type is None:
        return None

    overflow_zone = nearest_zone_matching(zone, zones) if band in {"HIGH", "CRITICAL"} else None
    message = phrase_alert(zone, band, action_type, overflow_zone, ai_client)
    return CrowdAlert(
        zone_id=zone.zone_id,
        band=band,
        action_type=action_type,
        message=message,
        overflow_zone_id=overflow_zone.zone_id if overflow_zone else None,
    )


async def auto_flag_incident(
    zone: Zone,
    density_pct: float,
    db: asyncpg.Pool | None = None,
) -> IncidentReport:
    pool = db or await get_pool()
    created_at = datetime.now(tz=UTC)
    raw_input = (
        f"Auto-flagged: {zone.name} crowd density reached {density_pct}% at "
        f"{created_at.isoformat()}. No human report filed yet."
    )
    incident_id = await pool.fetchval(
        """
        insert into public.incidents (
          zone_id, status, raw_input, ai_draft_summary, severity, reported_by_uid, created_at,
          submitted_at, resolved_at
        )
        values ($1, 'draft', $2, null, 'critical', null, $3, null, null)
        returning id
        """,
        zone.zone_id,
        raw_input,
        created_at,
    )
    incident = IncidentReport(
        incidentId=str(incident_id),
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
    return incident


async def list_zone_alerts(
    zone_type: ZoneType | None = None,
    db: asyncpg.Pool | None = None,
) -> list[CrowdAlert]:
    pool = db or await get_pool()
    zones = await load_zones(pool)
    filtered = [zone for zone in zones if zone_type is None or zone.type == zone_type]
    alerts: list[CrowdAlert] = []
    for zone in filtered:
        alert = build_alert(zone, zones, pool)
        if alert is not None:
            if alert.band == "CRITICAL":
                await auto_flag_incident(zone, zone.current_density_pct, db=pool)
            alerts.append(alert)
    return alerts
