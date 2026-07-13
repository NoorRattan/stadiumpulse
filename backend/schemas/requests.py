from pydantic import BaseModel, ConfigDict, Field

from models.incident import IncidentStatus
from models.route import AccessibilityNeed


class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    session_id: str | None = Field(default=None, alias="sessionId", min_length=1)
    message: str = Field(alias="message", min_length=1, max_length=4000)
    language: str = Field(alias="language", min_length=2, max_length=12)


class RouteRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_zone_id: str = Field(alias="fromZoneId", min_length=1)
    to_zone_id: str = Field(alias="toZoneId", min_length=1)
    accessibility_needs: list[AccessibilityNeed] = Field(default_factory=list, alias="accessibilityNeeds")


class IncidentCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    zone_id: str = Field(alias="zoneId", min_length=1)
    raw_input: str = Field(alias="rawInput", min_length=1, max_length=2000)


class IncidentUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: IncidentStatus = Field(alias="status")


class BriefingGenerateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    zone_id: str = Field(alias="zoneId", min_length=1)
    shift_label: str = Field(alias="shiftLabel", min_length=1, max_length=120)


class PasswordSignupRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str = Field(alias="email", min_length=3, max_length=320, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(alias="password", min_length=8, max_length=128)
