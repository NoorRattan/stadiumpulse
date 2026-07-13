from functools import lru_cache
from typing import Any, Literal

from google import genai

from config import Settings, get_settings
from services.exceptions import AIServiceError

ModelTier = Literal["primary", "lite"]
DEFAULT_PRIMARY_MODEL = "gemini-2.5-flash"
DEFAULT_LITE_MODEL = "gemini-2.5-flash-lite"


class StadiumPulseAIClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = genai.Client(api_key=settings.gemini_api_key)

    def model_for(self, tier: ModelTier) -> str:
        if tier == "primary":
            return self._settings.gemini_model_primary
        return self._settings.gemini_model_lite

    def model_candidates_for(self, tier: ModelTier) -> list[str]:
        configured = self.model_for(tier)
        fallback = DEFAULT_PRIMARY_MODEL if tier == "primary" else DEFAULT_LITE_MODEL
        candidates = [configured, fallback, DEFAULT_LITE_MODEL]
        return list(dict.fromkeys(candidate for candidate in candidates if candidate))

    def generate_text(self, prompt: str, *, tier: ModelTier) -> str:
        last_error: AIServiceError | None = None
        for model in self.model_candidates_for(tier):
            try:
                response = self._client.models.generate_content(model=model, contents=prompt)
            except Exception as exc:
                last_error = AIServiceError(f"Gemini request failed for {model}.", upstream=exc)
                continue

            text = getattr(response, "text", None)
            if isinstance(text, str) and text.strip():
                return text.strip()
            last_error = AIServiceError(f"Gemini returned an empty response for {model}.")

        if last_error is not None:
            raise last_error
        raise AIServiceError("No Gemini model was configured.")

    def generate_json(self, prompt: str, *, tier: ModelTier) -> dict[str, Any]:
        text = self.generate_text(prompt, tier=tier)
        return parse_json_object(text)


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
        raise AIServiceError("Gemini returned invalid JSON.") from exc
    if not isinstance(parsed, dict):
        raise AIServiceError("Gemini JSON response was not an object.")
    return parsed


@lru_cache
def get_ai_client() -> StadiumPulseAIClient:
    return StadiumPulseAIClient(get_settings())
