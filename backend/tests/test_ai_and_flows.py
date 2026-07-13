from types import SimpleNamespace

import httpx
import pytest

import services.ai_core as ai_core
from models.incident import IncidentSeverity
from models.route import AccessibilityNeed, CongestionLevel
from services.ai_core import (
    GROQ_CHAT_COMPLETIONS_URL,
    StadiumPulseAIClient,
    extract_chat_completion_text,
    parse_json_object,
)
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


class FakeGroqHttpClient:
    def __init__(self, responses: list[object]) -> None:
        self.responses = responses
        self.requests: list[dict[str, object]] = []

    def post(self, url: str, *, headers: dict[str, str], json: dict[str, object]) -> object:
        self.requests.append({"url": url, "headers": headers, "json": json})
        response = self.responses.pop(0)
        if isinstance(response, BaseException):
            raise response
        return response


class FakeGroqResponse:
    def __init__(self, payload: object) -> None:
        self.payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> object:
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


def test_extract_chat_completion_text_rejects_malformed_payloads() -> None:
    assert extract_chat_completion_text(None) is None
    assert extract_chat_completion_text({}) is None
    assert extract_chat_completion_text({"choices": ["bad"]}) is None
    assert extract_chat_completion_text({"choices": [{"message": "bad"}]}) is None


def test_ai_client_model_selection_and_generate_text(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = SimpleNamespace(
        groq_api_key="groq-key",
        groq_model_primary="primary-model",
        groq_model_lite="lite-model",
    )
    client = StadiumPulseAIClient(settings)
    fake_http = FakeGroqHttpClient([FakeGroqResponse({"choices": [{"message": {"content": "  response text  "}}]})])
    monkeypatch.setattr(client, "_client", fake_http)

    assert client.model_for("primary") == "primary-model"
    assert client.model_for("lite") == "lite-model"
    assert client.model_candidates_for("primary") == ["primary-model", "llama-3.1-8b-instant"]
    assert client.model_candidates_for("lite") == ["lite-model", "llama-3.1-8b-instant"]
    assert client.generate_text("hello", tier="lite") == "response text"
    assert fake_http.requests == [
        {
            "url": GROQ_CHAT_COMPLETIONS_URL,
            "headers": {"Authorization": "Bearer groq-key", "Content-Type": "application/json"},
            "json": {
                "model": "lite-model",
                "messages": [{"role": "user", "content": "hello"}],
                "temperature": 0.2,
            },
        }
    ]


def test_ai_client_retries_stable_model_after_configured_model_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = SimpleNamespace(
        groq_api_key="groq-key",
        groq_model_primary="primary-model",
        groq_model_lite="bad-lite-model",
    )
    client = StadiumPulseAIClient(settings)
    fake_http = FakeGroqHttpClient(
        [
            httpx.ConnectError("model not found"),
            FakeGroqResponse({"choices": [{"message": {"content": "fallback response"}}]}),
        ]
    )
    monkeypatch.setattr(client, "_client", fake_http)

    assert client.generate_text("hello", tier="lite") == "fallback response"
    assert [request["json"]["model"] for request in fake_http.requests] == ["bad-lite-model", "llama-3.1-8b-instant"]


def test_ai_client_rejects_empty_model_candidate_list(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = SimpleNamespace(
        groq_api_key="groq-key",
        groq_model_primary="primary-model",
        groq_model_lite="lite-model",
    )
    client = StadiumPulseAIClient(settings)
    monkeypatch.setattr(client, "model_candidates_for", lambda tier: [])

    with pytest.raises(AIServiceError, match="No Groq model"):
        client.generate_text("hello", tier="lite")


def test_ai_client_requires_groq_api_key() -> None:
    settings = SimpleNamespace(
        groq_api_key=None,
        groq_model_primary="primary-model",
        groq_model_lite="lite-model",
    )

    with pytest.raises(AIServiceError, match="API key"):
        StadiumPulseAIClient(settings).generate_text("hello", tier="primary")


def test_ai_client_raises_on_upstream_and_empty_response(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = SimpleNamespace(
        groq_api_key="groq-key",
        groq_model_primary="primary-model",
        groq_model_lite="lite-model",
    )
    client = StadiumPulseAIClient(settings)
    monkeypatch.setattr(
        client,
        "_client",
        FakeGroqHttpClient([httpx.ConnectError("down"), httpx.ConnectError("still down")]),
    )

    with pytest.raises(AIServiceError, match="request failed"):
        client.generate_text("hello", tier="primary")

    empty_client = StadiumPulseAIClient(settings)
    monkeypatch.setattr(
        empty_client,
        "_client",
        FakeGroqHttpClient(
            [
                FakeGroqResponse({"choices": [{"message": {"content": " "}}]}),
                FakeGroqResponse({"choices": [{"message": {"content": " "}}]}),
            ]
        ),
    )
    with pytest.raises(AIServiceError, match="empty response"):
        empty_client.generate_text("hello", tier="primary")


def test_ai_client_generate_json_and_cached_factory(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = SimpleNamespace(
        groq_api_key="groq-key",
        groq_model_primary="primary-model",
        groq_model_lite="lite-model",
    )
    monkeypatch.setattr(ai_core, "get_settings", lambda: settings)
    ai_core.get_ai_client.cache_clear()
    client = StadiumPulseAIClient(settings)
    monkeypatch.setattr(
        client,
        "_client",
        FakeGroqHttpClient([FakeGroqResponse({"choices": [{"message": {"content": '{"ok": true}'}}]})]),
    )

    assert client.generate_json("hello", tier="primary") == {"ok": True}
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
