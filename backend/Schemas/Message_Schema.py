from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Literal


class StartConversationRequest(BaseModel):
    other_user_id: UUID


class ConversationParticipant(BaseModel):
    id: UUID
    username: str
    role: Literal["doctor", "patient"]
    model_config = ConfigDict(from_attributes=True)


class ConversationRead(BaseModel):
    id: UUID
    doctor_user_id: UUID
    patient_user_id: UUID
    created_at: datetime
    last_message_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ConversationSummary(ConversationRead):
    other_user: ConversationParticipant
    last_message_at: Optional[datetime] = None
    unread_count: int = 0


class DirectMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)


class DirectMessageRead(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── WebSocket payload shapes ─────────────────────────────────────────────────

class WSIncomingMessage(BaseModel):
    type: Literal["message"] = "message"
    content: str = Field(..., min_length=1, max_length=4000)


class WSOutgoingMessage(BaseModel):
    type: Literal["message", "read_receipt", "error", "typing"] = "message"
    data: dict