from pydantic import BaseModel, Field, ConfigDict, model_validator
from uuid import UUID
from datetime import datetime
from typing import Optional
from typing import Literal

from .Auth_Schema import UserResponse


class AppointmentBase(BaseModel):
    doctor_id: UUID
    profile_id: UUID
    start_time: datetime
    end_time: datetime
    typeof: Optional[Literal["offline", "online"]] = None
    meeting_link: Optional[str] = None
    status: Literal["pending", "approved", "rejected", "completed", "cancelled"] = "pending"

class AppointmentStatusUpdate(BaseModel):
    status: Literal["approved", "rejected"]
    meeting_link: Optional[str] = None

class AppointmentFinalize(BaseModel):
    typeof: Literal["offline", "online"]
    meeting_link: Optional[str] = None
    status: Literal["approved", "rejected"] = "approved"

    @model_validator(mode="after")
    def check_link_for_online(self):
        if self.status == "approved" and self.typeof == "online" and not self.meeting_link:
            raise ValueError("meeting_link is required for online appointments")
        return self

        
class AppointmentRead(AppointmentBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class NotificationRead(BaseModel):
    id: UUID
    title: str
    message: str
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AuditLogCreate(BaseModel):
    actor_id: UUID
    target_profile_id: UUID
    action: str
    ip_address: Optional[str] = None


class ChatMessageBase(BaseModel):
    user_query: str = Field(..., min_length=1)
    session_id: Optional[UUID] = None
    chat_mode: str = Field("gemini", pattern=r"^(gemini|doctor)$")

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageRead(ChatMessageBase):
    id: UUID
    user_id: UUID
    ai_response: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatSessionResponse(BaseModel):
    session_id: UUID
    messages: list[ChatMessageRead]

class ChatMessageWithUser(ChatMessageRead):
    owner: UserResponse