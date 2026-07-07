from fastapi import APIRouter, Depends, Request
from google.cloud import firestore

from dependencies import AuthenticatedUser, get_current_user
from limiter import limiter
from schemas.requests import ChatRequest
from schemas.responses import ChatResponse
from services.concierge_service import handle_chat_message
from services.firestore_client import get_firestore_client

router = APIRouter(prefix="/api/concierge", tags=["concierge"])


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat(
    request: Request,
    body: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client),
) -> ChatResponse:
    return handle_chat_message(
        current_user.uid,
        body.message,
        body.language,
        body.session_id,
        db=db,
    )
