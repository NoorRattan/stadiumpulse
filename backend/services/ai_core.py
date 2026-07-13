from functools import lru_cache
from typing import Any, Literal

import httpx

from config import Settings, get_settings
from services.exceptions import AIServiceError

ModelTier = Literal["primary", "lite"]
GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"


class StadiumPulseAIClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = httpx.Client(timeout=15.0)

    def model_for(self, tier: ModelTier) -> str:
        if tier == "primary":
            return self._settings.groq_model_primary
        return self._settings.groq_model_lite

    def model_candidates_for(self, tier: ModelTier) -> list[str]:
        configured = self.model_for(tier)
        candidates = [configured, DEFAULT_GROQ_MODEL]
        return list(dict.fromkeys(candidate for candidate in candidates if candidate))

    def generate_text(self, prompt: str, *, tier: ModelTier) -> str:
        if not self._settings.groq_api_key:
            raise AIServiceError("Groq API key is not configured.")

        last_error: AIServiceError | None = None
        for model in self.model_candidates_for(tier):
            try:
                response = self._client.post(
                    GROQ_CHAT_COMPLETIONS_URL,
                    headers={
                        "Authorization": f"Bearer {self._settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.2,
                    },
                )
                response.raise_for_status()
                payload = response.json()
            except (httpx.HTTPError, ValueError) as exc:
                last_error = AIServiceError(f"Groq request failed for {model}.", upstream=exc)
                continue

            text = extract_chat_completion_text(payload)
            if isinstance(text, str) and text.strip():
                return text.strip()
            last_error = AIServiceError(f"Groq returned an empty response for {model}.")

        if last_error is not None:
            raise last_error
        raise AIServiceError("No Groq model was configured.")

    def generate_json(self, prompt: str, *, tier: ModelTier) -> dict[str, Any]:
        text = self.generate_text(prompt, tier=tier)
        return parse_json_object(text)


def extract_chat_completion_text(payload: object) -> str | None:
    if not isinstance(payload, dict):
        return None
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return None
    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        return None
    message = first_choice.get("message")
    if not isinstance(message, dict):
        return None
    content = message.get("content")
    return content if isinstance(content, str) else None


def parse_json_object(text: str) -> dict[str, Any]:
    import json

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
        try:
            start = cleaned.index("{")
            end = cleaned.rindex("}") + 1
            cleaned = cleaned[start:end]
        except ValueError:
            pass
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise AIServiceError("Groq returned invalid JSON.") from exc
    if not isinstance(parsed, dict):
        raise AIServiceError("Groq JSON response was not an object.")
    return parsed


@lru_cache
def get_ai_client() -> StadiumPulseAIClient:
    return StadiumPulseAIClient(get_settings())
