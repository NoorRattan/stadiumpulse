from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class ZoneType(StrEnum):
    concourse = "concourse"
    gate = "gate"
    seating_block = "seating-block"
    transit_hub = "transit-hub"


class ReadingSource(StrEnum):
    sensor = "sensor"
    manual = "manual"
    estimated = "estimated"


class Coordinates(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    lat: float = Field(alias="lat")
    lng: float = Field(alias="lng")


class Zone(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    zone_id: str = Field(alias="zoneId", min_length=1)
    name: str = Field(alias="name", min_length=1, max_length=80)
    type: ZoneType = Field(alias="type")
    capacity: int = Field(alias="capacity", gt=0)
    current_density_pct: float = Field(alias="currentDensityPct", ge=0, le=100)
    last_updated: datetime = Field(alias="lastUpdated")
    coordinates: Coordinates = Field(alias="coordinates")


class CrowdDensityReading(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    reading_id: str = Field(alias="readingId", min_length=1)
    zone_id: str = Field(alias="zoneId", min_length=1)
    density_pct: float = Field(alias="densityPct", ge=0, le=100)
    source: ReadingSource = Field(alias="source")
    recorded_at: datetime = Field(alias="recordedAt")
