from fastapi import APIRouter, Depends, Request
from google.cloud import firestore

from dependencies import AuthenticatedUser, get_current_user
from limiter import limiter
from models.accessibility import AccessibilitySettings
from services.firestore_client import get_firestore_client

router = APIRouter(prefix="/api/accessibility", tags=["accessibility"])


@router.get("/settings", response_model=AccessibilitySettings)
@limiter.limit("60/minute")
async def get_settings(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client),
) -> AccessibilitySettings:
    snapshot = db.collection("accessibilitySettings").document(current_user.uid).get()
    data = snapshot.to_dict() if snapshot.exists else None
    return AccessibilitySettings.model_validate(data or {})


@router.put("/settings", response_model=AccessibilitySettings)
@limiter.limit("60/minute")
async def put_settings(
    request: Request,
    body: AccessibilitySettings,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client),
) -> AccessibilitySettings:
    db.collection("accessibilitySettings").document(current_user.uid).set(body.model_dump(by_alias=True))
    return body
