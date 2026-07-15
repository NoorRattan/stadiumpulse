from datetime import UTC, datetime

import asyncpg
from fastapi import APIRouter, Depends, Request

from dependencies import AuthenticatedUser, require_role
from limiter import limiter
from models.user import UserRole
from models.zone import Zone
from schemas.responses import (
    CrowdForecastResponse,
    CrowdZonesResponse,
    CrowdZoneSummary,
    OperationalDigestResponse,
)
from services.crowd_service import (
    auto_flag_incident,
    build_alert,
    build_operational_digest_items,
    build_operational_risks,
    congestion_band,
    forecast_density,
    load_recent_density_readings,
    load_zones,
    phrase_forecast,
    phrase_operational_digest,
)
from services.db import get_pool
from services.exceptions import ResourceNotFoundError

router = APIRouter(prefix="/api/crowd", tags=["crowd"])


async def flatten_zone(zone: Zone, zones: list[Zone], db: asyncpg.Pool) -> CrowdZoneSummary:
    alert = build_alert(zone, zones, db=db)
    if alert and alert.band == "CRITICAL":
        await auto_flag_incident(zone, zone.current_density_pct, db=db)
    return CrowdZoneSummary(
        zoneId=zone.zone_id,
        name=zone.name,
        currentDensityPct=zone.current_density_pct,
        band=congestion_band(zone.current_density_pct).lower(),
        alert=alert.message if alert else "",
        lastUpdated=zone.last_updated.isoformat(),
    )


@router.get("/zones", response_model=CrowdZonesResponse)
@limiter.limit("60/minute")
async def get_zones(
    request: Request,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff, UserRole.volunteer)),
    db: asyncpg.Pool = Depends(get_pool),
) -> CrowdZonesResponse:
    zones = await load_zones(db)
    return CrowdZonesResponse(zones=[await flatten_zone(zone, zones, db) for zone in zones])


@router.get("/digest", response_model=OperationalDigestResponse)
@limiter.limit("30/minute")
async def get_operational_digest(
    request: Request,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff, UserRole.volunteer)),
    db: asyncpg.Pool = Depends(get_pool),
) -> OperationalDigestResponse:
    zones = await load_zones(db)
    readings_by_zone = {zone.zone_id: await load_recent_density_readings(db, zone.zone_id) for zone in zones}
    risks = build_operational_risks(zones, readings_by_zone)
    if risks:
        headline = f"{len(risks)} zone{'s' if len(risks) != 1 else ''} need attention"
    else:
        headline = "No elevated zones projected"
    return OperationalDigestResponse(
        generatedAt=datetime.now(tz=UTC).isoformat(),
        minutesAhead=15,
        headline=headline,
        narrative=phrase_operational_digest(risks),
        dataStatus="simulated",
        items=build_operational_digest_items(risks),
    )


@router.get("/zones/{zone_id}", response_model=CrowdZoneSummary)
@limiter.limit("60/minute")
async def get_zone(
    request: Request,
    zone_id: str,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff, UserRole.volunteer)),
    db: asyncpg.Pool = Depends(get_pool),
) -> CrowdZoneSummary:
    zones = await load_zones(db)
    for zone in zones:
        if zone.zone_id == zone_id:
            return await flatten_zone(zone, zones, db)
    raise ResourceNotFoundError(f"Zone not found: {zone_id}")


@router.get("/zones/{zone_id}/forecast", response_model=CrowdForecastResponse)
@limiter.limit("60/minute")
async def get_zone_forecast(
    request: Request,
    zone_id: str,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff, UserRole.volunteer)),
    db: asyncpg.Pool = Depends(get_pool),
) -> CrowdForecastResponse:
    zones = await load_zones(db)
    zone = next((candidate for candidate in zones if candidate.zone_id == zone_id), None)
    if zone is None:
        raise ResourceNotFoundError(f"Zone not found: {zone_id}")
    readings = await load_recent_density_readings(db, zone_id)
    forecast = forecast_density(zone.current_density_pct, readings)
    return CrowdForecastResponse(
        zoneId=zone.zone_id,
        currentDensityPct=zone.current_density_pct,
        projectedDensityPct=forecast.projected_density_pct,
        minutesAhead=15,
        projectedBand=forecast.projected_band.lower(),
        direction=forecast.direction,
        confidence=forecast.confidence,
        narrative=phrase_forecast(zone, forecast),
    )
