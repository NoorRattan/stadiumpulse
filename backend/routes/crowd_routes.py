from fastapi import APIRouter, Depends, Request
from google.cloud import firestore

from dependencies import AuthenticatedUser, require_role
from limiter import limiter
from models.user import UserRole
from models.zone import Zone
from schemas.responses import CrowdZonesResponse, CrowdZoneSummary
from services.crowd_service import build_alert, congestion_band, load_zones
from services.exceptions import ResourceNotFoundError
from services.firestore_client import get_firestore_client

router = APIRouter(prefix="/api/crowd", tags=["crowd"])


def flatten_zone(zone: Zone, zones: list[Zone], db: firestore.Client) -> CrowdZoneSummary:
    alert = build_alert(zone, zones, db=db)
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
    db: firestore.Client = Depends(get_firestore_client),
) -> CrowdZonesResponse:
    zones = load_zones(db)
    return CrowdZonesResponse(zones=[flatten_zone(zone, zones, db) for zone in zones])


@router.get("/zones/{zone_id}", response_model=CrowdZoneSummary)
@limiter.limit("60/minute")
async def get_zone(
    request: Request,
    zone_id: str,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff, UserRole.volunteer)),
    db: firestore.Client = Depends(get_firestore_client),
) -> CrowdZoneSummary:
    zones = load_zones(db)
    for zone in zones:
        if zone.zone_id == zone_id:
            return flatten_zone(zone, zones, db)
    raise ResourceNotFoundError(f"Zone not found: {zone_id}")
