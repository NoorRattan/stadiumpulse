from datetime import UTC, datetime
from http import HTTPStatus

import asyncpg
from fastapi import APIRouter, Depends, Request

from dependencies import AuthenticatedUser, get_current_user
from limiter import limiter
from models.user import UserRole
from schemas.responses import UserProfileResponse
from services.db import get_pool

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
    db: asyncpg.Pool = Depends(get_pool),
) -> UserProfileResponse:
    row = await db.fetchrow(
        """
        select display_name, email, role, preferred_language
        from public.profiles
        where id = $1
        """,
        current_user.uid,
    )
    data = (
        {
            "displayName": row["display_name"],
            "email": row["email"],
            "role": row["role"],
            "preferredLanguage": row["preferred_language"],
        }
        if row
        else None
    )
    return profile_response(current_user, data)


@router.post("/bootstrap", response_model=UserProfileResponse, status_code=HTTPStatus.CREATED)
@limiter.limit("60/minute")
async def bootstrap_user(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: asyncpg.Pool = Depends(get_pool),
) -> UserProfileResponse:
    payload = {
        "displayName": current_user.display_name or "StadiumPulse User",
        "email": current_user.email or f"{current_user.uid}@example.invalid",
        "role": UserRole.fan.value,
        "preferredLanguage": "en",
        "createdAt": datetime.now(tz=UTC),
    }
    row = await db.fetchrow(
        """
        insert into public.profiles (id, display_name, email, role, preferred_language, created_at)
        values ($1, $2, $3, 'fan', 'en', $4)
        on conflict (id) do update
        set display_name = public.profiles.display_name
        returning display_name, email, role, preferred_language
        """,
        current_user.uid,
        payload["displayName"],
        payload["email"],
        payload["createdAt"],
    )
    await db.execute(
        """
        insert into public.user_roles (uid, role)
        values ($1, 'fan')
        on conflict (uid) do nothing
        """,
        current_user.uid,
    )
    return profile_response(
        current_user,
        {
            "displayName": row["display_name"],
            "email": row["email"],
            "role": row["role"],
            "preferredLanguage": row["preferred_language"],
        },
    )
