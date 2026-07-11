from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from models.briefing import Briefing
from models.incident import IncidentReport
from models.route import RouteOption
from models.zone import ZoneType

MAX_PAGE_LIMIT = 50


class ResponseEnvelope[DataT](BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    data: DataT = Field(alias="data")


class PaginatedResponse[DataT](BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[DataT] = Field(alias="items")
    limit: int = Field(alias="limit", ge=1, le=MAX_PAGE_LIMIT)
    next_page_token: str | None = Field(default=None, alias="nextPageToken")


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    uid: str = Field(alias="uid")
    display_name: str = Field(alias="displayName")
    role: str = Field(alias="role")
    preferred_language: str = Field(alias="preferredLanguage")


class ChatResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    session_id: str = Field(alias="sessionId")
    reply: str = Field(alias="reply")
    detected_language: str = Field(alias="detectedLanguage")


class RouteResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    route_options: list[RouteOption] = Field(alias="routeOptions")
    generated_by: str = Field(alias="generatedBy", pattern=r"^(ai|fallback)$")


class ZoneSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    zone_id: str = Field(alias="zoneId")
    name: str = Field(alias="name")
    type: ZoneType = Field(alias="type")


class ZoneListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    zones: list[ZoneSummary] = Field(alias="zones")


class AccessibilitySettingsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    high_contrast: bool = Field(alias="highContrast")
    reduced_motion: bool = Field(alias="reducedMotion")
    screen_reader_mode: bool = Field(alias="screenReaderMode")
    preferred_language: str = Field(alias="preferredLanguage")


class TravelSuggestion(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    mode: str = Field(alias="mode")
    description: str = Field(alias="description")


class TravelSuggestionsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    match_id: str = Field(alias="matchId")
    suggestions: list[TravelSuggestion] = Field(alias="suggestions")


class CrowdZoneSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    zone_id: str = Field(alias="zoneId")
    name: str = Field(alias="name")
    current_density_pct: float = Field(alias="currentDensityPct", ge=0, le=100)
    band: Literal["normal", "moderate", "high", "critical"] = Field(alias="band")
    alert: str = Field(alias="alert")
    last_updated: str = Field(alias="lastUpdated")


class CrowdZonesResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    zones: list[CrowdZoneSummary] = Field(alias="zones")


class CrowdForecastResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    zone_id: str = Field(alias="zoneId")
    current_density_pct: float = Field(alias="currentDensityPct", ge=0, le=100)
    projected_density_pct: float = Field(alias="projectedDensityPct", ge=0, le=100)
    minutes_ahead: int = Field(alias="minutesAhead", ge=1)
    projected_band: Literal["normal", "moderate", "high", "critical"] = Field(alias="projectedBand")
    direction: Literal["rising", "stable", "falling"] = Field(alias="direction")
    confidence: Literal["low", "medium", "high"] = Field(alias="confidence")
    narrative: str = Field(alias="narrative")


class IncidentListResponse(PaginatedResponse[IncidentReport]):
    pass


class BriefingResponse(ResponseEnvelope[Briefing]):
    pass


class RawDataResponse(ResponseEnvelope[dict[str, Any]]):
    pass
