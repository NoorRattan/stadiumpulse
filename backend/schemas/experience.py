from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ExperienceModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class TournamentOverview(ExperienceModel):
    name: str
    starts_on: str = Field(alias="startsOn")
    ends_on: str = Field(alias="endsOn")
    host_countries: list[str] = Field(alias="hostCountries")
    summary: str


class PublicMatch(ExperienceModel):
    match_id: str = Field(alias="matchId")
    home_team: str = Field(alias="homeTeam")
    away_team: str = Field(alias="awayTeam")
    kickoff_at: str = Field(alias="kickoffAt")
    venue_id: str = Field(alias="venueId")
    venue_name: str = Field(alias="venueName")
    status: Literal["upcoming", "live", "complete"]
    score: str | None = None
    ticket_status: str = Field(alias="ticketStatus")


class VenueInfo(ExperienceModel):
    venue_id: str = Field(alias="venueId")
    name: str
    city: str
    country: str
    address: str
    map_label: str = Field(alias="mapLabel")
    capacity: int = Field(ge=1)
    gates: list[str]
    seating_highlights: list[str] = Field(alias="seatingHighlights")
    accessibility_features: list[str] = Field(alias="accessibilityFeatures")


class AmenityInfo(ExperienceModel):
    amenity_id: str = Field(alias="amenityId")
    name: str
    category: Literal["food", "retail", "medical", "restroom", "guest-services"]
    zone: str
    opening_note: str = Field(alias="openingNote")
    accessibility_note: str = Field(alias="accessibilityNote")


class FanEvent(ExperienceModel):
    event_id: str = Field(alias="eventId")
    title: str
    location: str
    starts_at: str = Field(alias="startsAt")
    description: str
    ticket_required: bool = Field(alias="ticketRequired")


class SustainabilityMetric(ExperienceModel):
    metric_id: str = Field(alias="metricId")
    label: str
    value: str
    trend: str
    explanation: str


class SafetyAlert(ExperienceModel):
    alert_id: str = Field(alias="alertId")
    severity: Literal["info", "advisory", "urgent"]
    title: str
    message: str
    zone: str
    issued_at: str = Field(alias="issuedAt")


class FaqEntry(ExperienceModel):
    question: str
    answer: str
    category: str


class PublicExperienceResponse(ExperienceModel):
    generated_at: str = Field(alias="generatedAt")
    data_status: Literal["curated-and-simulated"] = Field(alias="dataStatus")
    tournament: TournamentOverview
    match_ticker: list[PublicMatch] = Field(alias="matchTicker")
    matches: list[PublicMatch]
    venues: list[VenueInfo]
    amenities: list[AmenityInfo]
    fan_events: list[FanEvent] = Field(alias="fanEvents")
    sustainability: list[SustainabilityMetric]
    alerts: list[SafetyAlert]
    faq: list[FaqEntry]
    official_ticket_url: str = Field(alias="officialTicketUrl")


class AccountTicket(ExperienceModel):
    ticket_id: str = Field(alias="ticketId")
    match_label: str = Field(alias="matchLabel")
    venue_name: str = Field(alias="venueName")
    gate: str
    seat: str
    status: Literal["demo-pass"]
    disclaimer: str


class AccountPreferences(ExperienceModel):
    language: str
    accessibility_needs: list[str] = Field(alias="accessibilityNeeds")
    alert_channels: list[str] = Field(alias="alertChannels")
    sustainability_goal: str = Field(alias="sustainabilityGoal")


class AccountExperienceResponse(ExperienceModel):
    uid: str
    role: str
    tickets: list[AccountTicket]
    preferences: AccountPreferences


class PortalCard(ExperienceModel):
    card_id: str = Field(alias="cardId")
    title: str
    detail: str
    status: str
    priority: Literal["low", "normal", "high", "urgent"]


class RolePortalResponse(ExperienceModel):
    portal: Literal["volunteer", "operations", "venue-staff", "command-center"]
    role: str
    generated_at: str = Field(alias="generatedAt")
    data_status: Literal["simulated"] = Field(alias="dataStatus")
    headline: str
    cards: list[PortalCard]
    advanced_capabilities: list[str] = Field(alias="advancedCapabilities")
