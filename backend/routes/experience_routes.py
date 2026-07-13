import asyncpg
from fastapi import APIRouter, Depends, Request

from dependencies import AuthenticatedUser, get_current_user, require_role
from limiter import limiter
from models.user import UserRole
from schemas.experience import AccountExperienceResponse, PublicExperienceResponse, RolePortalResponse
from services.db import get_pool
from services.experience_service import build_account_experience, build_public_experience, build_role_portal

router = APIRouter(prefix="/api", tags=["experience"])


@router.get("/experience", response_model=PublicExperienceResponse)
@limiter.limit("60/minute")
async def get_public_experience(request: Request) -> PublicExperienceResponse:
    return build_public_experience()


@router.get("/account/overview", response_model=AccountExperienceResponse)
@limiter.limit("30/minute")
async def get_account_experience(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: asyncpg.Pool = Depends(get_pool),
) -> AccountExperienceResponse:
    return await build_account_experience(current_user, db)


@router.get("/portals/volunteer", response_model=RolePortalResponse)
@limiter.limit("30/minute")
async def get_volunteer_portal(
    request: Request,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.volunteer, UserRole.staff)),
) -> RolePortalResponse:
    return build_role_portal("volunteer", current_user)


@router.get("/portals/operations", response_model=RolePortalResponse)
@limiter.limit("30/minute")
async def get_operations_portal(
    request: Request,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff)),
) -> RolePortalResponse:
    return build_role_portal("operations", current_user)


@router.get("/portals/venue-staff", response_model=RolePortalResponse)
@limiter.limit("30/minute")
async def get_venue_staff_portal(
    request: Request,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff)),
) -> RolePortalResponse:
    return build_role_portal("venue-staff", current_user)


@router.get("/portals/command-center", response_model=RolePortalResponse)
@limiter.limit("30/minute")
async def get_command_center_portal(
    request: Request,
    current_user: AuthenticatedUser = Depends(require_role(UserRole.staff)),
) -> RolePortalResponse:
    return build_role_portal("command-center", current_user)
