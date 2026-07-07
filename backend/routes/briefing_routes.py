from http import HTTPStatus

from fastapi import APIRouter, Depends, Request
from google.cloud import firestore

from dependencies import AuthenticatedUser, require_role
from limiter import limiter
from models.briefing import Briefing
from models.user import UserRole
from schemas.requests import BriefingGenerateRequest
from services.briefing_service import generate_briefing
from services.exceptions import ResourceNotFoundError
from services.firestore_client import get_firestore_client

router = APIRouter(prefix="/api/briefings", tags=["briefings"])


@router.post("/generate", response_model=Briefing, status_code=HTTPStatus.CREATED)
@limiter.limit("60/minute")
async def create_briefing(
    request: Request,
    body: BriefingGenerateRequest,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff)),
    db: firestore.Client = Depends(get_firestore_client),
) -> Briefing:
    return generate_briefing(body.zone_id, body.shift_label, current_user.uid, db=db)


@router.get("/{zone_id}", response_model=Briefing)
@limiter.limit("60/minute")
async def get_latest_briefing(
    request: Request,
    zone_id: str,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff, UserRole.volunteer)),
    db: firestore.Client = Depends(get_firestore_client),
) -> Briefing:
    zone_snapshot = db.collection("zones").document(zone_id).get()
    if not zone_snapshot.exists:
        raise ResourceNotFoundError(f"Zone not found: {zone_id}")

    snapshots = (
        db.collection("briefings")
        .where("zoneId", "==", zone_id)
        .order_by("generatedAt", direction=firestore.Query.DESCENDING)
        .limit(1)
        .stream()
    )
    for snapshot in snapshots:
        data = snapshot.to_dict()
        if data:
            return Briefing(briefingId=snapshot.id, **data)
    raise ResourceNotFoundError(f"Briefing not found for zone: {zone_id}")
