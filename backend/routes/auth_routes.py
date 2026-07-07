from datetime import UTC, datetime
from http import HTTPStatus

from fastapi import APIRouter, Depends, Request
from google.cloud import firestore

from dependencies import AuthenticatedUser, get_current_user
from limiter import limiter
from models.user import UserRole
from schemas.responses import UserProfileResponse
from services.firestore_client import get_firestore_client

router = APIRouter(prefix="/api/auth", tags=["auth"])


def profile_response(current_user: AuthenticatedUser, data: dict[str, object] | None = None) -> UserProfileResponse:
    profile = data or {}
    return UserProfileResponse(
        uid=current_user.uid,
        displayName=str(profile.get("displayName") or current_user.display_name or "StadiumPulse User"),
        role=str(profile.get("role") or current_user.role.value),
        preferredLanguage=str(profile.get("preferredLanguage") or "en"),
    )


@router.get("/me", response_model=UserProfileResponse)
@limiter.limit("60/minute")
async def get_me(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client),
) -> UserProfileResponse:
    snapshot = db.collection("users").document(current_user.uid).get()
    data = snapshot.to_dict() if snapshot.exists else None
    return profile_response(current_user, data)


@router.post("/bootstrap", response_model=UserProfileResponse, status_code=HTTPStatus.CREATED)
@limiter.limit("60/minute")
async def bootstrap_user(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client),
) -> UserProfileResponse:
    user_ref = db.collection("users").document(current_user.uid)
    snapshot = user_ref.get()
    if snapshot.exists:
        data = snapshot.to_dict()
        return profile_response(current_user, data)

    payload = {
        "displayName": current_user.display_name or "StadiumPulse User",
        "email": current_user.email or f"{current_user.uid}@example.invalid",
        "role": UserRole.fan.value,
        "preferredLanguage": "en",
        "createdAt": datetime.now(tz=UTC),
    }
    user_ref.set(payload)
    return profile_response(current_user, payload)
