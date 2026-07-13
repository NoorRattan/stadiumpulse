from types import SimpleNamespace

import pytest

import services.ai_core as ai_core
from models.incident import IncidentSeverity
from models.route import AccessibilityNeed, CongestionLevel
from services.ai_core import StadiumPulseAIClient, parse_json_object
from services.exceptions import AIServiceError
from services.genkit_flows import (
    briefingFlow,
    describe_travel_options,
    incidentTriageFlow,
    translateFlow,
    wayfindingFlow,
)


class StubAIClient:
    def __init__(self, payload: dict[str, object] | str) -> None:
        self.payload = payload

    def generate_json(self, prompt: str, *, tier: str) -> dict[str, object]:
        assert prompt
        assert tier in {"primary", "lite"}
        assert isinstance(self.payload, dict)
        return self.payload

    def generate_text(self, prompt: str, *, tier: str) -> str:
        assert prompt
        assert tier in {"primary", "lite"}
        assert isinstance(self.payload, str)
        return self.payload


def test_parse_json_object_accepts_plain_and_fenced_json() -> None:
    assert parse_json_object('{"ok": true}') == {"ok": True}
    assert parse_json_object('```json\n{"ok": true}\n```') == {"ok": True}


def test_parse_json_object_rejects_invalid_and_non_object() -> None:
    with pytest.raises(AIServiceError, match="invalid JSON"):
        parse_json_object("{")
    with pytest.raises(AIServiceError, match="invalid JSON"):
        parse_json_object("```json\nnot-json\n```")
    with pytest.raises(AIServiceError, match="not an object"):
        parse_json_object("[1]")


def test_ai_client_model_selection_and_generate_text(monkeypatch: pytest.MonkeyPatch) -> None:
    generated: dict[str, str] = {}

    class FakeModels:
        def generate_content(self, *, model: str, contents: str) -> SimpleNamespace:
            generated["model"] = model
            generated["contents"] = contents
            return SimpleNamespace(text="  response text  ")

    monkeypatch.setattr(ai_core.genai, "Client", lambda **kwargs: SimpleNamespace(models=FakeModels()))
    settings = SimpleNamespace(
        gemini_api_key="gemini-key",
        gemini_model_primary="primary-model",
        gemini_model_lite="lite-model",
    )
    client = StadiumPulseAIClient(settings)

    assert client.model_for("primary") == "primary-model"
    assert client.model_for("lite") == "lite-model"
    assert client.model_candidates_for("primary") == ["primary-model", "gemini-2.5-flash", "gemini-2.5-flash-lite"]
    assert client.model_candidates_for("lite") == ["lite-model", "gemini-2.5-flash-lite"]
    assert client.generate_text("hello", tier="lite") == "response text"
    assert generated == {"model": "lite-model", "contents": "hello"}


def test_ai_client_retries_stable_model_after_configured_model_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    attempts: list[str] = []

    class RetryModels:
        def generate_content(self, *, model: str, contents: str) -> SimpleNamespace:
            attempts.append(model)
            if model == "bad-lite-model":
                raise RuntimeError("model not found")
            return SimpleNamespace(text="fallback response")

    monkeypatch.setattr(ai_core.genai, "Client", lambda **kwargs: SimpleNamespace(models=RetryModels()))
    settings = SimpleNamespace(
        gemini_api_key="gemini-key",
        gemini_model_primary="primary-model",
        gemini_model_lite="bad-lite-model",
    )

    assert StadiumPulseAIClient(settings).generate_text("hello", tier="lite") == "fallback response"
    assert attempts == ["bad-lite-model", "gemini-2.5-flash-lite"]


def test_ai_client_rejects_empty_model_candidate_list(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ai_core.genai, "Client", lambda **kwargs: SimpleNamespace(models=object()))
    settings = SimpleNamespace(
        gemini_api_key="gemini-key",
        gemini_model_primary="primary-model",
        gemini_model_lite="lite-model",
    )
    client = StadiumPulseAIClient(settings)
    monkeypatch.setattr(client, "model_candidates_for", lambda tier: [])

    with pytest.raises(AIServiceError, match="No Gemini model"):
        client.generate_text("hello", tier="lite")


def test_ai_client_raises_on_upstream_and_empty_response(monkeypatch: pytest.MonkeyPatch) -> None:
    class FailingModels:
        def generate_content(self, *, model: str, contents: str) -> SimpleNamespace:
            raise RuntimeError("down")

    monkeypatch.setattr(ai_core.genai, "Client", lambda **kwargs: SimpleNamespace(models=FailingModels()))
    settings = SimpleNamespace(
        gemini_api_key="gemini-key",
        gemini_model_primary="primary-model",
        gemini_model_lite="lite-model",
    )
    client = StadiumPulseAIClient(settings)

    with pytest.raises(AIServiceError, match="request failed"):
        client.generate_text("hello", tier="primary")

    class EmptyModels:
        def generate_content(self, *, model: str, contents: str) -> SimpleNamespace:
            return SimpleNamespace(text=" ")

    monkeypatch.setattr(ai_core.genai, "Client", lambda **kwargs: SimpleNamespace(models=EmptyModels()))
    with pytest.raises(AIServiceError, match="empty response"):
        StadiumPulseAIClient(settings).generate_text("hello", tier="primary")


def test_ai_client_generate_json_and_cached_factory(monkeypatch: pytest.MonkeyPatch) -> None:
    class JsonModels:
        def generate_content(self, *, model: str, contents: str) -> SimpleNamespace:
            return SimpleNamespace(text='{"ok": true}')

    settings = SimpleNamespace(
        gemini_api_key="gemini-key",
        gemini_model_primary="primary-model",
        gemini_model_lite="lite-model",
    )
    monkeypatch.setattr(ai_core.genai, "Client", lambda **kwargs: SimpleNamespace(models=JsonModels()))
    monkeypatch.setattr(ai_core, "get_settings", lambda: settings)
    ai_core.get_ai_client.cache_clear()

    assert StadiumPulseAIClient(settings).generate_json("hello", tier="primary") == {"ok": True}
    assert isinstance(ai_core.get_ai_client(), StadiumPulseAIClient)


def test_genkit_flows_accept_valid_shapes() -> None:
    route_options = wayfindingFlow(
        ["gate-2", "gate-4"],
        [],
        [AccessibilityNeed.wheelchair],
        ai_client=StubAIClient(
            {
                "routeOptions": [
                    {
                        "steps": [{"instruction": "Go to Gate 4.", "zoneId": "gate-4"}],
                        "estimatedMinutes": 5,
                        "congestionLevel": CongestionLevel.low.value,
                    }
                ]
            }
        ),
    )

    assert (
        translateFlow(
            "hola",
            "en",
            source_language="es",
            ai_client=StubAIClient({"detectedLanguage": "es", "translatedText": "hello"}),
        )["translatedText"]
        == "hello"
    )
    assert route_options[0].estimated_minutes == 5
    assert incidentTriageFlow(
        "gate-4",
        "Gate 4",
        "crowd",
        ai_client=StubAIClient({"summary": "Crowd at Gate 4.", "severity": IncidentSeverity.high.value}),
    ) == {"summary": "Crowd at Gate 4.", "severity": "high"}
    assert briefingFlow({"zoneId": "gate-4"}, "AM", [], ai_client=StubAIClient("Briefing text.")) == "Briefing text."
    assert describe_travel_options(
        [{"mode": "rail"}], "high", ai_client=StubAIClient({"descriptions": ["Use rail."]})
    ) == ["Use rail."]


def test_genkit_flows_reject_invalid_shapes() -> None:
    with pytest.raises(AIServiceError, match="Translation"):
        translateFlow("hola", "en", ai_client=StubAIClient({"detectedLanguage": "es"}))
    with pytest.raises(AIServiceError, match="routeOptions"):
        wayfindingFlow(["gate-2"], [], [], ai_client=StubAIClient({}))
    with pytest.raises(AIServiceError, match="invalid shape"):
        incidentTriageFlow("gate-4", "Gate 4", "crowd", ai_client=StubAIClient({"summary": "x"}))
    with pytest.raises(AIServiceError, match="unsupported severity"):
        incidentTriageFlow("gate-4", "Gate 4", "crowd", ai_client=StubAIClient({"summary": "x", "severity": "huge"}))
    with pytest.raises(AIServiceError, match="Travel description"):
        describe_travel_options([{"mode": "rail"}], "high", ai_client=StubAIClient({"descriptions": ["ok", 3]}))
