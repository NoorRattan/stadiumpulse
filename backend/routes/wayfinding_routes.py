import asyncpg
from fastapi import APIRouter, Depends, Request

from dependencies import AuthenticatedUser, get_current_user
from limiter import limiter
from schemas.requests import RouteRequest
from schemas.responses import RouteResponse, ZoneListResponse, ZoneSummary
from services.db import get_pool
from services.wayfinding_service import get_route

router = APIRouter(prefix="/api/wayfinding", tags=["wayfinding"])


@router.get("/zones", response_model=ZoneListResponse)
@limiter.limit("60/minute")
async def list_zone_options(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: asyncpg.Pool = Depends(get_pool),
) -> ZoneListResponse:
    rows = await db.fetch(
        """
        select zone_id, name, type
        from public.zones
        order by zone_id
        limit 50
        """
    )
    zones = [ZoneSummary(zoneId=row["zone_id"], name=row["name"], type=row["type"]) for row in rows if row]
    return ZoneListResponse(zones=zones)


@router.post("/route", response_model=RouteResponse)
@limiter.limit("20/minute")
async def route(
    request: Request,
    body: RouteRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: asyncpg.Pool = Depends(get_pool),
) -> RouteResponse:
    return await get_route(
        body.from_zone_id,
        body.to_zone_id,
        body.accessibility_needs,
        db=db,
    )
