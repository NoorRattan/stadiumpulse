from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

Environment = Literal["development", "production", "test"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Environment = Field(validation_alias="ENVIRONMENT")
    gcp_project_id: str = Field(validation_alias="GCP_PROJECT_ID")
    firebase_service_account_path: str | None = Field(
        default=None,
        validation_alias="FIREBASE_SERVICE_ACCOUNT_PATH",
    )
    allowed_origins: Annotated[list[str], NoDecode] = Field(validation_alias="ALLOWED_ORIGINS")
    vertex_ai_location: str = Field(validation_alias="VERTEX_AI_LOCATION")
    gemini_model_primary: str = Field(validation_alias="GEMINI_MODEL_PRIMARY")
    gemini_model_lite: str = Field(validation_alias="GEMINI_MODEL_LITE")
    log_level: str = Field(validation_alias="LOG_LEVEL")

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_allowed_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        return [origin.strip() for origin in value.split(",") if origin.strip()]


class CorsBootstrapSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        validation_alias="ALLOWED_ORIGINS",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_allowed_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        return [origin.strip() for origin in value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_bootstrap_allowed_origins() -> list[str]:
    return CorsBootstrapSettings().allowed_origins
