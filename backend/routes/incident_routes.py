from datetime import UTC, datetime
from http import HTTPStatus

import asyncpg
from fastapi import APIRouter, Depends, Query, Request

from dependencies import AuthenticatedUser, require_role
from limiter import limiter
from models.incident import IncidentReport, IncidentStatus
from models.user import UserRole
from schemas.requests import IncidentCreateRequest, IncidentUpdateRequest
from schemas.responses import IncidentListResponse
from services.briefing_service import incident_from_row
from services.db import get_pool
from services.exceptions import ResourceNotFoundError
from services.incident_service import draft_incident

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def incident_from_mapping(data: object | None) -> IncidentReport:
    if not data:
        raise ResourceNotFoundError("Incident not found.")
    return incident_from_row(data)


def incident_from_snapshot(snapshot: object) -> IncidentReport:
    data = snapshot.to_dict()
    if not data:
        raise ResourceNotFoundError("Incident not found.")
    return IncidentReport(incidentId=snapshot.id, **data)


@router.post("", response_model=IncidentReport, status_code=HTTPStatus.CREATED)
@limiter.limit("60/minute")
async def create_incident(
    request: Request,
    body: IncidentCreateRequest,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff, UserRole.volunteer)),
    db: asyncpg.Pool = Depends(get_pool),
) -> IncidentReport:
    return await draft_incident(body.zone_id, body.raw_input, current_user.uid, db=db)


@router.get("", response_model=IncidentListResponse)
@limiter.limit("60/minute")
async def list_incidents(
    request: Request,
    zone_id: str | None = Query(default=None, alias="zoneId"),
    status: IncidentStatus | None = Query(default=None),
    limit: int = Query(default=20, ge=1),
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff, UserRole.volunteer)),
    db: asyncpg.Pool = Depends(get_pool),
) -> IncidentListResponse:
    capped_limit = min(limit, 50)
    if zone_id:
        zone_exists = await db.fetchrow("select zone_id from public.zones where zone_id = $1", zone_id)
        if zone_exists is None:
            raise ResourceNotFoundError(f"Zone not found: {zone_id}")

    conditions: list[str] = []
    args: list[object] = []
    if zone_id:
        args.append(zone_id)
        conditions.append(f"zone_id = ${len(args)}")
    if status:
        args.append(status.value)
        conditions.append(f"status = ${len(args)}")
    args.append(capped_limit)
    where_clause = f"where {' and '.join(conditions)}" if conditions else ""
    rows = await db.fetch(
        f"""
        select id, zone_id, status, raw_input, ai_draft_summary, severity, reported_by_uid,
               created_at, submitted_at, resolved_at
        from public.incidents
        {where_clause}
        order by created_at desc
        limit ${len(args)}
        """,
        *args,
    )
    return IncidentListResponse(items=[incident_from_mapping(row) for row in rows], limit=capped_limit)


@router.patch("/{incident_id}", response_model=IncidentReport)
@limiter.limit("60/minute")
async def update_incident(
    request: Request,
    incident_id: str,
    body: IncidentUpdateRequest,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff)),
    db: asyncpg.Pool = Depends(get_pool),
) -> IncidentReport:
    updates: dict[str, object] = {"status": body.status.value}
    now = datetime.now(tz=UTC)
    if body.status == IncidentStatus.submitted:
        updates["submittedAt"] = now
    if body.status == IncidentStatus.resolved:
        updates["resolvedAt"] = now
    row = await db.fetchrow(
        """
        update public.incidents
        set status = $2,
            submitted_at = coalesce($3, submitted_at),
            resolved_at = coalesce($4, resolved_at)
        where id = $1
        returning id, zone_id, status, raw_input, ai_draft_summary, severity, reported_by_uid,
                  created_at, submitted_at, resolved_at
        """,
        incident_id,
        updates["status"],
        updates.get("submittedAt"),
        updates.get("resolvedAt"),
    )
    if row is None:
        raise ResourceNotFoundError(f"Incident not found: {incident_id}")
    return incident_from_mapping(row)
