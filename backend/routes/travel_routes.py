import asyncpg
from fastapi import APIRouter, Depends, Query, Request

from dependencies import AuthenticatedUser, get_current_user
from limiter import limiter
from schemas.responses import TravelSuggestionsResponse
from services.db import get_pool
from services.travel_service import get_travel_suggestions

router = APIRouter(prefix="/api/travel", tags=["travel"])


@router.get("/suggestions", response_model=TravelSuggestionsResponse)
@limiter.limit("60/minute")
async def suggestions(
    request: Request,
    match_id: str = Query(alias="matchId", min_length=1),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: asyncpg.Pool = Depends(get_pool),
) -> TravelSuggestionsResponse:
    return await get_travel_suggestions(match_id, db=db)
