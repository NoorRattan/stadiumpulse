import asyncpg
from fastapi import APIRouter, Depends, Request

from limiter import limiter
from schemas.responses import DemoExperienceResponse
from services.db import get_pool
from services.demo_service import build_demo_experience

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.get("", response_model=DemoExperienceResponse)
@limiter.limit("30/minute")
async def get_demo_experience(
    request: Request,
    db: asyncpg.Pool = Depends(get_pool),
) -> DemoExperienceResponse:
    """Return the connected, read-only FIFA 2026 demonstration scenario."""
    return await build_demo_experience(db)
