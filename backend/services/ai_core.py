from functools import lru_cache
from typing import Any, Literal

from google import genai

from config import Settings, get_settings
from services.exceptions import AIServiceError

ModelTier = Literal["primary", "lite"]


class StadiumPulseAIClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = genai.Client(
            vertexai=True,
            project=settings.gcp_project_id,
            location=settings.vertex_ai_location,
        )

    def model_for(self, tier: ModelTier) -> str:
        if tier == "primary":
            return self._settings.gemini_model_primary
        return self._settings.gemini_model_lite

    def generate_text(self, prompt: str, *, tier: ModelTier) -> str:
        model = self.model_for(tier)
        try:
            response = self._client.models.generate_content(model=model, contents=prompt)
        except Exception as exc:
            raise AIServiceError(f"Gemini request failed for {model}.", upstream=exc) from exc

        text = getattr(response, "text", None)
        if not isinstance(text, str) or not text.strip():
            raise AIServiceError(f"Gemini returned an empty response for {model}.")
        return text.strip()

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
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise AIServiceError("Gemini returned invalid JSON.") from exc
    if not isinstance(parsed, dict):
        raise AIServiceError("Gemini JSON response was not an object.")
    return parsed


@lru_cache
def get_ai_client() -> StadiumPulseAIClient:
    return StadiumPulseAIClient(get_settings())
