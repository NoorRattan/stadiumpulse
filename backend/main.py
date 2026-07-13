import asyncio
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from http import HTTPStatus

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.cors import CORSMiddleware

from config import Settings, get_bootstrap_allowed_origins, get_settings
from limiter import limiter
from logger import configure_logging
from routes import (
    accessibility_routes,
    auth_routes,
    briefing_routes,
    concierge_routes,
    crowd_routes,
    demo_routes,
    experience_routes,
    incident_routes,
    travel_routes,
    wayfinding_routes,
)
from schemas.errors import (
    ApiError,
    ai_service_error_handler,
    api_error_handler,
    http_error_handler,
    rate_limit_handler,
    resource_not_found_handler,
    unhandled_error_handler,
    validation_error_handler,
)
from security import SecurityHeadersMiddleware
from services.crowd_simulator import run_crowd_simulation
from services.exceptions import AIServiceError, ResourceNotFoundError


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    simulation_task: asyncio.Task[None] | None = None
    if settings.simulate_crowd_data:
        simulation_task = asyncio.create_task(
            run_crowd_simulation(settings.crowd_simulation_interval_seconds),
            name="stadiumpulse-demo-crowd-simulation",
        )
    try:
        yield
    finally:
        if simulation_task is not None:
            simulation_task.cancel()
            try:
                await simulation_task
            except asyncio.CancelledError:
                pass


def create_app(settings: Settings | None = None) -> FastAPI:
    allowed_origins = settings.allowed_origins if settings else get_bootstrap_allowed_origins()
    # Keep the canonical Cloudflare origin connected even if a Render env edit
    # accidentally omits it. Preview/custom domains still belong in ALLOWED_ORIGINS.
    allowed_origins = list(dict.fromkeys([*allowed_origins, "https://stadiumpulse.pages.dev"]))
    environment = settings.environment if settings else os.getenv("ENVIRONMENT", "development")
    is_production = environment == "production"
    app = FastAPI(
        title="StadiumPulse API",
        version="0.2.0",
        lifespan=lifespan,
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json",
    )
    app.state.limiter = limiter

    app.add_middleware(SecurityHeadersMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(ApiError, api_error_handler)
    app.add_exception_handler(AIServiceError, ai_service_error_handler)
    app.add_exception_handler(ResourceNotFoundError, resource_not_found_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)

    app.include_router(auth_routes.router)
    app.include_router(concierge_routes.router)
    app.include_router(wayfinding_routes.router)
    app.include_router(accessibility_routes.router)
    app.include_router(travel_routes.router)
    app.include_router(crowd_routes.router)
    app.include_router(demo_routes.router)
    app.include_router(experience_routes.router)
    app.include_router(incident_routes.router)
    app.include_router(briefing_routes.router)

    @app.get("/health", status_code=HTTPStatus.OK)
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "stadiumpulse-backend"}

    return app


app = create_app()
