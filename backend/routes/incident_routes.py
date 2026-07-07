from datetime import UTC, datetime
from http import HTTPStatus

from fastapi import APIRouter, Depends, Query, Request
from google.cloud import firestore

from dependencies import AuthenticatedUser, require_role
from limiter import limiter
from models.incident import IncidentReport, IncidentStatus
from models.user import UserRole
from schemas.requests import IncidentCreateRequest, IncidentUpdateRequest
from schemas.responses import IncidentListResponse
from services.exceptions import ResourceNotFoundError
from services.firestore_client import get_firestore_client
from services.incident_service import draft_incident

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


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
    db: firestore.Client = Depends(get_firestore_client),
) -> IncidentReport:
    return draft_incident(body.zone_id, body.raw_input, current_user.uid, db=db)


@router.get("", response_model=IncidentListResponse)
@limiter.limit("60/minute")
async def list_incidents(
    request: Request,
    zone_id: str | None = Query(default=None, alias="zoneId"),
    status: IncidentStatus | None = Query(default=None),
    limit: int = Query(default=20, ge=1),
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff, UserRole.volunteer)),
    db: firestore.Client = Depends(get_firestore_client),
) -> IncidentListResponse:
    capped_limit = min(limit, 50)
    query = db.collection("incidents")
    if zone_id:
        zone_snapshot = db.collection("zones").document(zone_id).get()
        if not zone_snapshot.exists:
            raise ResourceNotFoundError(f"Zone not found: {zone_id}")
        query = query.where("zoneId", "==", zone_id)
    if status:
        query = query.where("status", "==", status.value)
    snapshots = query.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(capped_limit).stream()
    return IncidentListResponse(items=[incident_from_snapshot(snapshot) for snapshot in snapshots], limit=capped_limit)


@router.patch("/{incident_id}", response_model=IncidentReport)
@limiter.limit("60/minute")
async def update_incident(
    request: Request,
    incident_id: str,
    body: IncidentUpdateRequest,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff)),
    db: firestore.Client = Depends(get_firestore_client),
) -> IncidentReport:
    incident_ref = db.collection("incidents").document(incident_id)
    snapshot = incident_ref.get()
    if not snapshot.exists:
        raise ResourceNotFoundError(f"Incident not found: {incident_id}")

    updates: dict[str, object] = {"status": body.status.value}
    now = datetime.now(tz=UTC)
    if body.status == IncidentStatus.submitted:
        updates["submittedAt"] = now
    if body.status == IncidentStatus.resolved:
        updates["resolvedAt"] = now
    incident_ref.update(updates)
    return incident_from_snapshot(incident_ref.get())
