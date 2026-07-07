from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class IncidentStatus(StrEnum):
    draft = "draft"
    submitted = "submitted"
    resolved = "resolved"


class IncidentSeverity(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class IncidentReport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    incident_id: str = Field(alias="incidentId", min_length=1)
    zone_id: str = Field(alias="zoneId", min_length=1)
    status: IncidentStatus = Field(default=IncidentStatus.draft, alias="status")
    raw_input: str = Field(alias="rawInput", min_length=1, max_length=2000)
    ai_draft_summary: str | None = Field(default=None, alias="aiDraftSummary", max_length=4000)
    severity: IncidentSeverity | None = Field(default=None, alias="severity")
    reported_by_uid: str | None = Field(default=None, alias="reportedByUid")
    created_at: datetime = Field(alias="createdAt")
    submitted_at: datetime | None = Field(default=None, alias="submittedAt")
    resolved_at: datetime | None = Field(default=None, alias="resolvedAt")
