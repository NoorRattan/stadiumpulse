import asyncpg
from fastapi import APIRouter, Depends, Request

from limiter import limiter
from schemas.responses import DemoBriefingResponse, DemoExperienceResponse, DemoIncidentDraftResponse
from services.db import get_pool
from services.demo_generation_service import generate_demo_incident_draft, generate_demo_volunteer_briefing
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


@router.post("/incident-draft", response_model=DemoIncidentDraftResponse)
@limiter.limit("10/minute")
async def create_demo_incident_draft(
    request: Request,
    db: asyncpg.Pool = Depends(get_pool),
) -> DemoIncidentDraftResponse:
    """Generate a public incident draft preview without writing a record."""
    return await generate_demo_incident_draft(db)


@router.post("/volunteer-briefing", response_model=DemoBriefingResponse)
@limiter.limit("10/minute")
async def create_demo_volunteer_briefing(
    request: Request,
    db: asyncpg.Pool = Depends(get_pool),
) -> DemoBriefingResponse:
    """Generate a public volunteer briefing preview without writing a record."""
    return await generate_demo_volunteer_briefing(db)
