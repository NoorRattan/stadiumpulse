from http import HTTPStatus

import asyncpg
from fastapi import APIRouter, Depends, Request

from dependencies import AuthenticatedUser, require_role
from limiter import limiter
from models.briefing import Briefing
from models.user import UserRole
from schemas.requests import BriefingGenerateRequest
from services.briefing_service import generate_briefing
from services.db import get_pool
from services.exceptions import ResourceNotFoundError

router = APIRouter(prefix="/api/briefings", tags=["briefings"])


@router.post("/generate", response_model=Briefing, status_code=HTTPStatus.CREATED)
@limiter.limit("60/minute")
async def create_briefing(
    request: Request,
    body: BriefingGenerateRequest,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff)),
    db: asyncpg.Pool = Depends(get_pool),
) -> Briefing:
    return await generate_briefing(body.zone_id, body.shift_label, current_user.uid, db=db)


@router.get("/{zone_id}", response_model=Briefing)
@limiter.limit("60/minute")
async def get_latest_briefing(
    request: Request,
    zone_id: str,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff, UserRole.volunteer)),
    db: asyncpg.Pool = Depends(get_pool),
) -> Briefing:
    zone_snapshot = await db.fetchrow("select zone_id from public.zones where zone_id = $1", zone_id)
    if zone_snapshot is None:
        raise ResourceNotFoundError(f"Zone not found: {zone_id}")

    row = await db.fetchrow(
        """
        select id, zone_id, shift_label, content, generated_by_uid, generated_at
        from public.briefings
        where zone_id = $1
        order by generated_at desc
        limit 1
        """,
        zone_id,
    )
    if row:
        return Briefing(
            briefingId=str(row["id"]),
            zoneId=row["zone_id"],
            shiftLabel=row["shift_label"],
            content=row["content"],
            generatedByUid=str(row["generated_by_uid"]),
            generatedAt=row["generated_at"],
        )
    raise ResourceNotFoundError(f"Briefing not found for zone: {zone_id}")
