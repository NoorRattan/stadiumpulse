from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

import asyncpg

from models.incident import IncidentReport, IncidentSeverity, IncidentStatus
from models.zone import Zone, ZoneType
from schemas.responses import OperationalDigestItem
from services.ai_core import StadiumPulseAIClient, get_ai_client
from services.db import get_pool
from services.exceptions import AIServiceError

CongestionBand = Literal["NORMAL", "MODERATE", "HIGH", "CRITICAL"]
ActionType = Literal["MONITOR", "SUGGEST_OVERFLOW", "URGENT_REROUTE"]


@dataclass(frozen=True)
class CrowdAlert:
    zone_id: str
    band: CongestionBand
    action_type: ActionType
    message: str
    overflow_zone_id: str | None = None


@dataclass(frozen=True)
class DensityForecast:
    projected_density_pct: float
    projected_band: CongestionBand
    direction: Literal["rising", "stable", "falling"]
    confidence: Literal["low", "medium", "high"]


@dataclass(frozen=True)
class OperationalRisk:
    zone: Zone
    forecast: DensityForecast
    priority: Literal["watch", "prepare", "urgent"]
    recommended_action: str


def forecast_density(current_density_pct: float, readings: list[float]) -> DensityForecast:
    """Project 15 minutes from the recent five-minute demo readings."""
    if len(readings) < 2:
        delta = 0.0
        confidence: Literal["low", "medium", "high"] = "low"
    else:
        chronological = list(reversed(readings))
        delta = (chronological[-1] - chronological[0]) / (len(chronological) - 1)
        confidence = "high" if len(readings) >= 6 else "medium"
    projected = max(0.0, min(100.0, current_density_pct + delta * 3))
    direction: Literal["rising", "stable", "falling"]
    if delta > 1:
        direction = "rising"
    elif delta < -1:
        direction = "falling"
    else:
        direction = "stable"
    return DensityForecast(
        projected_density_pct=round(projected, 1),
        projected_band=congestion_band(projected),
        direction=direction,
        confidence=confidence,
    )


async def load_recent_density_readings(db: asyncpg.Pool, zone_id: str) -> list[float]:
    rows = await db.fetch(
        """
        select density_pct
        from public.zone_readings
        where zone_id = $1
        order by recorded_at desc
        limit 8
        """,
        zone_id,
    )
    return [float(dict(row)["density_pct"]) for row in rows]


def phrase_forecast(
    zone: Zone,
    forecast: DensityForecast,
    ai_client: StadiumPulseAIClient | None = None,
) -> str:
    client = ai_client or get_ai_client()
    prompt = (
        "Write one concise operational forecast. Treat all numbers and the projected band as fixed. "
        "State a practical staff action and do not claim these demo estimates are physical sensor data.\n"
        f"Zone: {zone.name}\nCurrent density: {zone.current_density_pct}%\n"
        f"15-minute projection: {forecast.projected_density_pct}% ({forecast.projected_band})\n"
        f"Trend: {forecast.direction}; confidence: {forecast.confidence}"
    )
    try:
        return client.generate_text(prompt, tier="lite")
    except AIServiceError:
        return (
            f"{zone.name} is {forecast.direction}; plan for approximately "
            f"{forecast.projected_density_pct}% density in 15 minutes and continue staff monitoring."
        )


def priority_for_band(band: CongestionBand) -> Literal["watch", "prepare", "urgent"] | None:
    if band == "MODERATE":
        return "watch"
    if band == "HIGH":
        return "prepare"
    if band == "CRITICAL":
        return "urgent"
    return None


def recommendation_for_risk(zone: Zone, forecast: DensityForecast) -> str:
    if forecast.projected_band == "CRITICAL":
        return f"Hold new inflow toward {zone.name} and prepare a supervised reroute."
    if forecast.projected_band == "HIGH":
        return f"Position staff at {zone.name} approaches and prepare overflow routing."
    return f"Increase observation at {zone.name} and verify the next density reading."


def build_operational_risks(zones: list[Zone], readings_by_zone: dict[str, list[float]]) -> list[OperationalRisk]:
    risks: list[OperationalRisk] = []
    priority_rank = {"watch": 1, "prepare": 2, "urgent": 3}
    for zone in zones:
        forecast = forecast_density(zone.current_density_pct, readings_by_zone.get(zone.zone_id, []))
        priority = priority_for_band(forecast.projected_band)
        if priority is None:
            continue
        risks.append(
            OperationalRisk(
                zone=zone,
                forecast=forecast,
                priority=priority,
                recommended_action=recommendation_for_risk(zone, forecast),
            )
        )
    risks.sort(
        key=lambda risk: (
            priority_rank[risk.priority],
            risk.forecast.direction == "rising",
            risk.forecast.projected_density_pct,
        ),
        reverse=True,
    )
    return risks[:3]


def build_operational_digest_items(risks: list[OperationalRisk]) -> list[OperationalDigestItem]:
    """Map ranked domain risks to the shared public API response contract."""
    return [
        OperationalDigestItem(
            zoneId=risk.zone.zone_id,
            zoneName=risk.zone.name,
            currentDensityPct=risk.zone.current_density_pct,
            projectedDensityPct=risk.forecast.projected_density_pct,
            projectedBand=risk.forecast.projected_band.lower(),
            direction=risk.forecast.direction,
            confidence=risk.forecast.confidence,
            priority=risk.priority,
            recommendedAction=risk.recommended_action,
            requiresSupervisorApproval=True,
        )
        for risk in risks
    ]


def phrase_operational_digest(risks: list[OperationalRisk], ai_client: StadiumPulseAIClient | None = None) -> str:
    if not risks:
        return "No zone is projected above normal density. Maintain routine monitoring."
    facts = "\n".join(
        f"- {risk.zone.name}: {risk.forecast.projected_density_pct}% "
        f"{risk.forecast.projected_band}, {risk.forecast.direction}; action: {risk.recommended_action}"
        for risk in risks
    )
    prompt = (
        "Write a two-sentence stadium operations digest using only the fixed facts below. "
        "Do not invent incidents, sensor sources, or actions already taken. State that a supervisor "
        "must approve operational changes. The readings are simulated demo data.\n"
        f"{facts}"
    )
    client = ai_client or get_ai_client()
    try:
        return client.generate_text(prompt, tier="lite")
    except AIServiceError:
        lead = risks[0]
        return (
            f"{lead.zone.name} is the highest projected pressure point at "
            f"{lead.forecast.projected_density_pct}%. Review the ranked actions and obtain supervisor "
            "approval before making operational changes."
        )


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
    try:
        return client.generate_text(prompt, tier="lite")
    except AIServiceError:
        overflow = f" Redirect toward {overflow_zone.name}." if overflow_zone else ""
        return f"{zone.name} is {band.lower()}. Required action: {action_type.lower()}.{overflow}"


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
) -> IncidentReport | None:
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
        select $1, 'draft', $2, null, 'critical', null, $3, null, null
        where not exists (
          select 1
          from public.incidents
          where zone_id = $1
            and status <> 'resolved'
            and raw_input like 'Auto-flagged:%'
            and created_at > $3::timestamptz - interval '15 minutes'
        )
        returning id
        """,
        zone.zone_id,
        raw_input,
        created_at,
    )
    if incident_id is None:
        return None
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
