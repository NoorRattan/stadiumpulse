from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from models.briefing import Briefing
from models.incident import IncidentReport, IncidentSeverity
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


class PasswordSignupResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    uid: str = Field(alias="uid")
    email: str = Field(alias="email")


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


class OperationalDigestItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    zone_id: str = Field(alias="zoneId")
    zone_name: str = Field(alias="zoneName")
    current_density_pct: float = Field(alias="currentDensityPct", ge=0, le=100)
    projected_density_pct: float = Field(alias="projectedDensityPct", ge=0, le=100)
    projected_band: Literal["moderate", "high", "critical"] = Field(alias="projectedBand")
    direction: Literal["rising", "stable", "falling"] = Field(alias="direction")
    confidence: Literal["low", "medium", "high"] = Field(alias="confidence")
    priority: Literal["watch", "prepare", "urgent"] = Field(alias="priority")
    recommended_action: str = Field(alias="recommendedAction")
    requires_supervisor_approval: bool = Field(alias="requiresSupervisorApproval")


class OperationalDigestResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    generated_at: str = Field(alias="generatedAt")
    minutes_ahead: int = Field(alias="minutesAhead", ge=1)
    headline: str = Field(alias="headline")
    narrative: str = Field(alias="narrative")
    data_status: Literal["simulated"] = Field(alias="dataStatus")
    items: list[OperationalDigestItem] = Field(alias="items")


class DemoMatchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    match_id: str = Field(alias="matchId")
    home_team: str = Field(alias="homeTeam")
    away_team: str = Field(alias="awayTeam")
    kickoff_at: str = Field(alias="kickoffAt")
    transit_load_estimate: Literal["low", "medium", "high"] = Field(alias="transitLoadEstimate")


class DemoConciergeExample(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    language: str = Field(alias="language")
    question: str = Field(alias="question")
    answer: str = Field(alias="answer")


class DemoCapability(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    label: str = Field(alias="label")
    description: str = Field(alias="description")
    live_endpoint: str = Field(alias="liveEndpoint")


class DemoExperienceResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    scenario_id: str = Field(alias="scenarioId")
    title: str = Field(alias="title")
    tournament: str = Field(alias="tournament")
    generated_at: str = Field(alias="generatedAt")
    data_status: Literal["simulated"] = Field(alias="dataStatus")
    database_status: Literal["connected"] = Field(alias="databaseStatus")
    output_source: Literal["curated-demo-preview"] = Field(alias="outputSource")
    match: DemoMatchResponse = Field(alias="match")
    zones: list[CrowdZoneSummary] = Field(alias="zones")
    accessible_route: RouteOption = Field(alias="accessibleRoute")
    concierge_examples: list[DemoConciergeExample] = Field(alias="conciergeExamples")
    travel_suggestions: list[TravelSuggestion] = Field(alias="travelSuggestions")
    operations_digest: OperationalDigestResponse = Field(alias="operationsDigest")
    capabilities: list[DemoCapability] = Field(alias="capabilities")


class _DemoGeneratedArtifactResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    scenario_id: Literal["fifa-2026-matchday"] = Field(alias="scenarioId")
    data_status: Literal["simulated"] = Field(alias="dataStatus")
    generated_by: Literal["ai", "fallback"] = Field(alias="generatedBy")
    zone_id: str = Field(alias="zoneId")
    zone_name: str = Field(alias="zoneName")
    current_density_pct: float = Field(alias="currentDensityPct", ge=0, le=100)


class DemoIncidentDraftResponse(_DemoGeneratedArtifactResponse):
    raw_input: str = Field(alias="rawInput")
    summary: str = Field(alias="summary")
    severity: IncidentSeverity = Field(alias="severity")
    status: Literal["draft"] = Field(alias="status")
    review_required: Literal[True] = Field(alias="reviewRequired")
    persisted: Literal[False] = Field(alias="persisted")


class DemoBriefingResponse(_DemoGeneratedArtifactResponse):
    shift_label: str = Field(alias="shiftLabel")
    open_incident_count: int = Field(alias="openIncidentCount", ge=0)
    content: str = Field(alias="content")
    review_required: Literal[True] = Field(alias="reviewRequired")
    persisted: Literal[False] = Field(alias="persisted")


class IncidentListResponse(PaginatedResponse[IncidentReport]):
    pass


class BriefingResponse(ResponseEnvelope[Briefing]):
    pass


class RawDataResponse(ResponseEnvelope[dict[str, Any]]):
    pass
