from datetime import UTC, datetime
from typing import Any

import asyncpg

from schemas.responses import ChatResponse
from services.ai_core import StadiumPulseAIClient, get_ai_client
from services.db import get_pool
from services.exceptions import AIServiceError
from services.genkit_flows import translateFlow

SUPPORTED_LANGUAGES: tuple[str, ...] = ("en", "es", "pt", "fr", "ar", "de", "ja", "ko", "zh", "hi")


def normalize_language(language: str) -> tuple[str, bool]:
    normalized = language.lower().strip()
    if normalized in SUPPORTED_LANGUAGES:
        return normalized, False
    return "en", True


async def get_or_create_session(
    user_id: str,
    requested_session_id: str | None,
    language: str,
    db: asyncpg.Pool,
) -> tuple[str, bool]:
    now = datetime.now(tz=UTC)
    if requested_session_id:
        row = await db.fetchrow(
            """
            update public.concierge_sessions
            set last_active_at = $1, language = $2
            where id = $3 and user_id = $4
            returning id
            """,
            now,
            language,
            requested_session_id,
            user_id,
        )
        if row:
            return str(row["id"]), False

    session_id = await db.fetchval(
        """
        insert into public.concierge_sessions (user_id, language, started_at, last_active_at)
        values ($1, $2, $3, $3)
        returning id
        """,
        user_id,
        language,
        now,
    )
    return str(session_id), True


async def load_recent_messages(db: asyncpg.Pool, session_id: str) -> list[dict[str, Any]]:
    rows = await db.fetch(
        """
        select role, text, created_at
        from public.concierge_messages
        where session_id = $1
        order by created_at desc
        limit 10
        """,
        session_id,
    )
    messages = [{"role": row["role"], "text": row["text"], "createdAt": row["created_at"]} for row in rows if row]
    messages.reverse()
    return messages


async def append_message(db: asyncpg.Pool, session_id: str, role: str, text: str) -> None:
    await db.execute(
        """
        insert into public.concierge_messages (session_id, role, text, created_at)
        values ($1, $2, $3, $4)
        """,
        session_id,
        role,
        text,
        datetime.now(tz=UTC),
    )


def build_reply_prompt(
    message: str,
    language: str,
    detected_language: str,
    recent_messages: list[dict[str, Any]],
) -> str:
    return (
        "You are StadiumPulse's multilingual stadium concierge. Answer using only practical "
        "match-day operations and fan experience guidance. Keep the reply concise and respond "
        "in the requested language.\n"
        f"Requested language: {language}\n"
        f"Detected language: {detected_language}\n"
        f"Recent session turns, capped at 10: {recent_messages}\n"
        f"Current user message: {message}"
    )


def fallback_concierge_reply(message: str, language: str) -> str:
    guidance = (
        "I can still help with venue basics: use wayfinding for step-free routes, "
        "check travel suggestions before arrival, and report urgent safety issues to stadium staff."
    )
    if language != "en":
        return f"AI translation is temporarily unavailable, so I am replying in English. {guidance}"
    if "gate" in message.lower():
        return f"{guidance} For gate questions, open Wayfinding and choose your start and destination zones."
    return guidance


async def handle_chat_message(
    user_id: str,
    message: str,
    language: str,
    session_id: str | None = None,
    db: asyncpg.Pool | None = None,
    ai_client: StadiumPulseAIClient | None = None,
) -> ChatResponse:
    pool = db or await get_pool()
    client = ai_client or get_ai_client()
    normalized_language, used_fallback = normalize_language(language)
    active_session_id, _created = await get_or_create_session(user_id, session_id, normalized_language, pool)

    try:
        translation = translateFlow(message, normalized_language, ai_client=client)
    except AIServiceError:
        translation = {"detectedLanguage": normalized_language, "translatedText": message}
    recent_messages = await load_recent_messages(pool, active_session_id)
    try:
        reply = client.generate_text(
            build_reply_prompt(message, normalized_language, translation["detectedLanguage"], recent_messages),
            tier="primary",
        )
    except AIServiceError:
        reply = fallback_concierge_reply(message, normalized_language)
    if used_fallback:
        reply = f"Language fallback: unsupported language '{language}' was handled in English. {reply}"

    await append_message(pool, active_session_id, "user", message)
    await append_message(pool, active_session_id, "assistant", reply)
    return ChatResponse(
        sessionId=active_session_id,
        reply=reply,
        detectedLanguage=translation["detectedLanguage"],
    )
