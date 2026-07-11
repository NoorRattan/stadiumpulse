import asyncpg
from fastapi import APIRouter, Depends, Request

from dependencies import AuthenticatedUser, require_role
from limiter import limiter
from models.user import UserRole
from models.zone import Zone
from schemas.responses import CrowdZonesResponse, CrowdZoneSummary
from services.crowd_service import auto_flag_incident, build_alert, congestion_band, load_zones
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
