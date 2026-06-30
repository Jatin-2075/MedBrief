import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..DataBase import Base


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint("doctor_user_id", "patient_user_id", name="uq_conversation_pair"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_user_id = Column(UUID(as_uuid=True), ForeignKey("auth_users.id"), nullable=False, index=True)
    patient_user_id = Column(UUID(as_uuid=True), ForeignKey("auth_users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=func.now())
    last_message_at = Column(DateTime, server_default=func.now(), default=func.now(), onupdate=func.now())

    doctor = relationship("Auth_User", foreign_keys=[doctor_user_id])
    patient = relationship("Auth_User", foreign_keys=[patient_user_id])
    messages = relationship(
        "DirectMessage",
        back_populates="conversation",
        order_by="DirectMessage.created_at",
        cascade="all, delete-orphan",
    )


class DirectMessage(Base):
    __tablename__ = "direct_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("auth_users.id"), nullable=False)
    content = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=func.now(), index=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("Auth_User")