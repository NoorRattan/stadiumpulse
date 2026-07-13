from datetime import UTC, datetime
from http import HTTPStatus

import asyncpg
import httpx
from fastapi import APIRouter, Depends, Request

from config import get_settings
from dependencies import AuthenticatedUser, get_current_user
from limiter import limiter
from models.user import UserRole
from schemas.errors import ApiError, ErrorCode
from schemas.requests import PasswordSignupRequest
from schemas.responses import PasswordSignupResponse, UserProfileResponse
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


async def create_confirmed_supabase_user(payload: PasswordSignupRequest) -> dict[str, object]:
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise ApiError(
            ErrorCode.internal_error,
            "Password signup is not configured.",
            HTTPStatus.SERVICE_UNAVAILABLE,
        )

    endpoint = f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                endpoint,
                headers={
                    "apikey": settings.supabase_service_role_key,
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "email": payload.email,
                    "password": payload.password,
                    "email_confirm": True,
                    "user_metadata": {
                        "display_name": "StadiumPulse User",
                    },
                },
            )
    except httpx.HTTPError as exc:
        raise ApiError(
            ErrorCode.internal_error,
            "Supabase signup service is unavailable.",
            HTTPStatus.BAD_GATEWAY,
        ) from exc

    body = response.json() if response.content else {}
    if response.status_code in {HTTPStatus.CONFLICT, HTTPStatus.UNPROCESSABLE_ENTITY}:
        message = str(body.get("msg") or body.get("message") or "Account already exists.")
        raise ApiError(ErrorCode.conflict, message, HTTPStatus.CONFLICT)
    if response.status_code >= HTTPStatus.BAD_REQUEST:
        message = str(body.get("msg") or body.get("message") or "Account creation failed.")
        raise ApiError(ErrorCode.validation_error, message, response.status_code)
    return dict(body)


@router.post("/signup", response_model=PasswordSignupResponse, status_code=HTTPStatus.CREATED)
@limiter.limit("10/minute")
async def signup_without_email_confirmation(
    request: Request,
    payload: PasswordSignupRequest,
    db: asyncpg.Pool = Depends(get_pool),
) -> PasswordSignupResponse:
    user = await create_confirmed_supabase_user(payload)
    uid = user.get("id")
    email = user.get("email") or payload.email
    if not isinstance(uid, str):
        raise ApiError(ErrorCode.internal_error, "Supabase signup returned an invalid user.", HTTPStatus.BAD_GATEWAY)

    await db.execute(
        """
        insert into public.profiles (id, display_name, email, role, preferred_language, created_at)
        values ($1, $2, $3, 'fan', 'en', $4)
        on conflict (id) do nothing
        """,
        uid,
        "StadiumPulse User",
        str(email),
        datetime.now(tz=UTC),
    )
    await db.execute(
        """
        insert into public.user_roles (uid, role)
        values ($1, 'fan')
        on conflict (uid) do nothing
        """,
        uid,
    )
    return PasswordSignupResponse(uid=uid, email=str(email))


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
