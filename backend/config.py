from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

Environment = Literal["development", "production", "test"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Environment = Field(validation_alias="ENVIRONMENT")
    supabase_url: str = Field(validation_alias="SUPABASE_URL")
    supabase_db_url: str = Field(validation_alias="SUPABASE_DB_URL")
    supabase_service_role_key: str | None = Field(
        default=None,
        validation_alias="SUPABASE_SERVICE_ROLE_KEY",
    )
    supabase_jwt_secret: str | None = Field(
        default=None,
        validation_alias="SUPABASE_JWT_SECRET",
    )
    supabase_jwks_url: str | None = Field(
        default=None,
        validation_alias="SUPABASE_JWKS_URL",
    )
    supabase_jwt_audience: str = Field(
        default="authenticated",
        validation_alias="SUPABASE_JWT_AUDIENCE",
    )
    allowed_origins: Annotated[list[str], NoDecode] = Field(validation_alias="ALLOWED_ORIGINS")
    gemini_api_key: str = Field(validation_alias="GEMINI_API_KEY")
    gemini_model_primary: str = Field(validation_alias="GEMINI_MODEL_PRIMARY")
    gemini_model_lite: str = Field(validation_alias="GEMINI_MODEL_LITE")
    log_level: str = Field(validation_alias="LOG_LEVEL")
    # StadiumPulse ships as an explicitly labeled tournament demo. Real venue
    # deployments must opt out when physical telemetry is connected.
    simulate_crowd_data: bool = Field(default=True, validation_alias="SIMULATE_CROWD_DATA")
    crowd_simulation_interval_seconds: int = Field(
        default=20,
        ge=10,
        validation_alias="CROWD_SIMULATION_INTERVAL_SECONDS",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_allowed_origins(cls: type["Settings"], value: str | list[str]) -> list[str]:
        origins = value if isinstance(value, list) else [origin.strip() for origin in value.split(",")]
        origins = [origin.strip().rstrip("/") for origin in origins if origin.strip()]
        if "*" in origins:
            raise ValueError("Wildcard CORS origins are not allowed with authenticated requests.")
        return origins


class CorsBootstrapSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        validation_alias="ALLOWED_ORIGINS",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_allowed_origins(cls: type["CorsBootstrapSettings"], value: str | list[str]) -> list[str]:
        origins = value if isinstance(value, list) else [origin.strip() for origin in value.split(",")]
        origins = [origin.strip().rstrip("/") for origin in origins if origin.strip()]
        if "*" in origins:
            raise ValueError("Wildcard CORS origins are not allowed with authenticated requests.")
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_bootstrap_allowed_origins() -> list[str]:
    return CorsBootstrapSettings().allowed_origins


def get_supabase_jwks_url(settings: Settings) -> str:
    if settings.supabase_jwks_url:
        return settings.supabase_jwks_url
    return f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
