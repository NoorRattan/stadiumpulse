from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class ChatRole(StrEnum):
    user = "user"
    assistant = "assistant"


class ChatMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message_id: str = Field(alias="messageId", min_length=1)
    role: ChatRole = Field(alias="role")
    text: str = Field(alias="text", min_length=1, max_length=4000)
    created_at: datetime = Field(alias="createdAt")


class ChatSession(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    session_id: str = Field(alias="sessionId", min_length=1)
    user_id: str = Field(alias="userId", min_length=1)
    language: str = Field(alias="language", min_length=2, max_length=12)
    started_at: datetime = Field(alias="startedAt")
    last_active_at: datetime = Field(alias="lastActiveAt")
