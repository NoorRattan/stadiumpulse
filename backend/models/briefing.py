from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Briefing(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    briefing_id: str = Field(alias="briefingId", min_length=1)
    zone_id: str = Field(alias="zoneId", min_length=1)
    shift_label: str = Field(alias="shiftLabel", min_length=1, max_length=120)
    content: str = Field(alias="content", min_length=1, max_length=8000)
    generated_by_uid: str = Field(alias="generatedByUid", min_length=1)
    generated_at: datetime = Field(alias="generatedAt")
