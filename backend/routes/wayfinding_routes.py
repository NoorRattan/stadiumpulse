from fastapi import APIRouter, Depends, Request
from google.cloud import firestore

from dependencies import AuthenticatedUser, get_current_user
from limiter import limiter
from schemas.requests import RouteRequest
from schemas.responses import RouteResponse
from services.firestore_client import get_firestore_client
from services.wayfinding_service import get_route

router = APIRouter(prefix="/api/wayfinding", tags=["wayfinding"])


@router.post("/route", response_model=RouteResponse)
@limiter.limit("20/minute")
async def route(
    request: Request,
    body: RouteRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client),
) -> RouteResponse:
    return get_route(
        body.from_zone_id,
        body.to_zone_id,
        body.accessibility_needs,
        db=db,
    )
