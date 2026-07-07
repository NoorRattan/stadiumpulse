import logging
from http import HTTPStatus

import pytest
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.testclient import TestClient
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

import config
import main
from config import CorsBootstrapSettings, Settings
from limiter import rate_limit_key
from logger import JsonFormatter, configure_logging, get_logger
from schemas.errors import (
    ApiError,
    ErrorCode,
    ai_service_error_handler,
    api_error_handler,
    http_error_handler,
    rate_limit_handler,
    resource_not_found_handler,
    unhandled_error_handler,
    validation_error_handler,
)
from services.exceptions import AIServiceError, ResourceNotFoundError
from services.firestore_client import get_firestore_client


def bare_request() -> Request:
    return Request({"type": "http", "method": "GET", "path": "/", "headers": [], "client": ("1.2.3.4", 1234)})


@pytest.mark.asyncio
async def test_error_handlers_return_backend_error_taxonomy() -> None:
    request = bare_request()

    responses = [
        await api_error_handler(request, ApiError(ErrorCode.forbidden, "no", HTTPStatus.FORBIDDEN)),
        await ai_service_error_handler(request, AIServiceError("upstream")),
        await resource_not_found_handler(request, ResourceNotFoundError("missing")),
        await validation_error_handler(request, RequestValidationError([])),
        await rate_limit_handler(request, object()),
        await unhandled_error_handler(request, RuntimeError("boom")),
    ]

    assert [response.status_code for response in responses] == [403, 502, 404, 400, 429, 500]


@pytest.mark.asyncio
async def test_http_error_handler_maps_expected_statuses() -> None:
    request = bare_request()

    assert (await http_error_handler(request, StarletteHTTPException(401))).status_code == 401
    assert (await http_error_handler(request, StarletteHTTPException(403))).status_code == 403
    assert (await http_error_handler(request, StarletteHTTPException(404))).status_code == 404
    assert (await http_error_handler(request, StarletteHTTPException(418))).status_code == 500


def test_config_parses_list_and_comma_delimited_origins(monkeypatch: pytest.MonkeyPatch) -> None:
    assert Settings.split_allowed_origins(["http://a"]) == ["http://a"]
    assert CorsBootstrapSettings.split_allowed_origins(["http://a"]) == ["http://a"]
    assert CorsBootstrapSettings.split_allowed_origins("http://a, http://b") == ["http://a", "http://b"]

    monkeypatch.setenv("ALLOWED_ORIGINS", "http://a, http://b")
    assert config.get_bootstrap_allowed_origins() == ["http://a", "http://b"]


def test_create_app_health_and_lifespan(monkeypatch: pytest.MonkeyPatch) -> None:
    configured: list[str] = []
    settings = Settings(
        ENVIRONMENT="test",
        GCP_PROJECT_ID="project-1",
        ALLOWED_ORIGINS=["http://testserver"],
        VERTEX_AI_LOCATION="us-central1",
        GEMINI_MODEL_PRIMARY="primary",
        GEMINI_MODEL_LITE="lite",
        LOG_LEVEL="debug",
    )
    monkeypatch.setattr(main, "get_settings", lambda: settings)
    monkeypatch.setattr(main, "configure_logging", configured.append)

    app = main.create_app(settings)

    assert isinstance(app, FastAPI)
    assert app.title == "StadiumPulse API"


def test_health_endpoint(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok", "service": "stadiumpulse-backend"}


@pytest.mark.asyncio
async def test_lifespan_configures_logging(monkeypatch: pytest.MonkeyPatch) -> None:
    configured: list[str] = []
    settings = Settings(
        ENVIRONMENT="test",
        GCP_PROJECT_ID="project-1",
        ALLOWED_ORIGINS=["http://testserver"],
        VERTEX_AI_LOCATION="us-central1",
        GEMINI_MODEL_PRIMARY="primary",
        GEMINI_MODEL_LITE="lite",
        LOG_LEVEL="warning",
    )
    monkeypatch.setattr(main, "get_settings", lambda: settings)
    monkeypatch.setattr(main, "configure_logging", configured.append)

    async with main.lifespan(main.app):
        assert configured == ["warning"]


def test_rate_limit_key_falls_back_to_remote_address() -> None:
    assert rate_limit_key(bare_request()) == "1.2.3.4"


def test_logging_formatter_includes_exception_and_get_logger() -> None:
    configure_logging("info")
    logger = get_logger("stadium-test")
    record = logger.makeRecord("stadium-test", logging.ERROR, __file__, 1, "failed", None, None)
    try:
        raise RuntimeError("boom")
    except RuntimeError:
        record.exc_info = __import__("sys").exc_info()

    formatted = JsonFormatter().format(record)

    assert '"severity":"ERROR"' in formatted
    assert '"exception":' in formatted
    assert get_logger("stadium-test").name == "stadium-test"


def test_get_firestore_client_uses_configured_project(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: dict[str, str] = {}
    monkeypatch.setattr(
        "services.firestore_client.get_settings",
        lambda: Settings(
            ENVIRONMENT="test",
            GCP_PROJECT_ID="project-1",
            ALLOWED_ORIGINS=["http://testserver"],
            VERTEX_AI_LOCATION="us-central1",
            GEMINI_MODEL_PRIMARY="primary",
            GEMINI_MODEL_LITE="lite",
            LOG_LEVEL="info",
        ),
    )

    def capture_project(project: str) -> str:
        return seen.setdefault("project", project)

    monkeypatch.setattr("services.firestore_client.firestore.Client", capture_project)
    get_firestore_client.cache_clear()

    assert get_firestore_client() == "project-1"
    assert seen == {"project": "project-1"}
