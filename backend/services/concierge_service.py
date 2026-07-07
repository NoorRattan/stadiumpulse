from datetime import UTC, datetime
from typing import Any

from google.cloud import firestore

from schemas.responses import ChatResponse
from services.ai_core import StadiumPulseAIClient, get_ai_client
from services.firestore_client import get_firestore_client
from services.genkit_flows import translateFlow

SUPPORTED_LANGUAGES: tuple[str, ...] = ("en", "es", "pt", "fr", "ar", "de", "ja", "ko", "zh", "hi")


def normalize_language(language: str) -> tuple[str, bool]:
    normalized = language.lower().strip()
    if normalized in SUPPORTED_LANGUAGES:
        return normalized, False
    return "en", True


def get_or_create_session(
    user_id: str,
    requested_session_id: str | None,
    language: str,
    db: firestore.Client,
) -> tuple[str, bool]:
    now = datetime.now(tz=UTC)
    if requested_session_id:
        snapshot = db.collection("conciergeSessions").document(requested_session_id).get()
        data = snapshot.to_dict() if snapshot.exists else None
        if data and data.get("userId") == user_id:
            snapshot.reference.set({"lastActiveAt": now, "language": language}, merge=True)
            return snapshot.id, False

    session_ref = db.collection("conciergeSessions").document()
    session_ref.set(
        {
            "userId": user_id,
            "language": language,
            "startedAt": now,
            "lastActiveAt": now,
        }
    )
    return session_ref.id, True


def load_recent_messages(db: firestore.Client, session_id: str) -> list[dict[str, Any]]:
    snapshots = (
        db.collection("conciergeSessions")
        .document(session_id)
        .collection("messages")
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .limit(10)
        .stream()
    )
    messages = [snapshot.to_dict() for snapshot in snapshots if snapshot.to_dict()]
    messages.reverse()
    return messages


def append_message(db: firestore.Client, session_id: str, role: str, text: str) -> None:
    db.collection("conciergeSessions").document(session_id).collection("messages").document().set(
        {
            "role": role,
            "text": text,
            "createdAt": datetime.now(tz=UTC),
        }
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


def handle_chat_message(
    user_id: str,
    message: str,
    language: str,
    session_id: str | None = None,
    db: firestore.Client | None = None,
    ai_client: StadiumPulseAIClient | None = None,
) -> ChatResponse:
    firestore_client = db or get_firestore_client()
    client = ai_client or get_ai_client()
    normalized_language, used_fallback = normalize_language(language)
    active_session_id, _created = get_or_create_session(user_id, session_id, normalized_language, firestore_client)

    translation = translateFlow(message, normalized_language, ai_client=client)
    recent_messages = load_recent_messages(firestore_client, active_session_id)
    reply = client.generate_text(
        build_reply_prompt(message, normalized_language, translation["detectedLanguage"], recent_messages),
        tier="primary",
    )
    if used_fallback:
        reply = f"Language fallback: unsupported language '{language}' was handled in English. {reply}"

    append_message(firestore_client, active_session_id, "user", message)
    append_message(firestore_client, active_session_id, "assistant", reply)
    return ChatResponse(
        sessionId=active_session_id,
        reply=reply,
        detectedLanguage=translation["detectedLanguage"],
    )
