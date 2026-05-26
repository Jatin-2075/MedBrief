from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class AppointmentBase(BaseModel):
    doctor_id: UUID
    profile_id: UUID
    start_time: datetime
    end_time: datetime
    status: str = "scheduled"

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


class HealthAdviceBase(BaseModel):
    condition_tag: str = Field(..., example="hydration")
    advice_title: str = Field(..., example="Drink More Water")
    advice_content: str = Field(..., min_length=10)
    severity_level: int = Field(..., ge=1, le=5, description="1 (Low) to 5 (Critical)")

class HealthAdvice_Create(HealthAdviceBase):
    pass

class HealthAdvice_Read(HealthAdviceBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)

class ChatMessageBase(BaseModel):
    user_query: str = Field(..., min_length=1)
    session_id: Optional[UUID] = None
    chat_mode: str = Field("gemini", regex=r"^(gemini|doctor)$")

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
    messages: List[ChatMessageRead]

class ChatMessageWithUser(ChatMessageRead):
    owner: UserResponse