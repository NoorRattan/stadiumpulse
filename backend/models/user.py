from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class UserRole(StrEnum):
    fan = "fan"
    staff = "staff"
    volunteer = "volunteer"


class UserProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    uid: str = Field(alias="uid", min_length=1)
    display_name: str = Field(alias="displayName", min_length=1, max_length=80)
    email: str = Field(alias="email", pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    role: UserRole = Field(alias="role")
    preferred_language: str = Field(default="en", alias="preferredLanguage", min_length=2, max_length=12)
    created_at: datetime = Field(alias="createdAt")
