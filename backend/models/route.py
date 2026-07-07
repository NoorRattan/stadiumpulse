from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class AccessibilityNeed(StrEnum):
    wheelchair = "wheelchair"
    visual = "visual"
    hearing = "hearing"
    cognitive = "cognitive"
    none_ = "none"


class CongestionLevel(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class RouteStep(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    instruction: str = Field(alias="instruction", min_length=1, max_length=500)
    zone_id: str = Field(alias="zoneId", min_length=1)


class RouteOption(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    steps: list[RouteStep] = Field(alias="steps", min_length=1)
    estimated_minutes: int = Field(alias="estimatedMinutes", ge=1, le=180)
    congestion_level: CongestionLevel = Field(alias="congestionLevel")
