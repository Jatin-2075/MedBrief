from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from uuid import UUID
from typing import List

from ..DataBase.Database import get_db
from ..Models.Auth_Data import Auth_User
from ..Models.Messaging import Conversation, DirectMessage
from ..Security.Dependencies import get_current_user, get_user_from_token_ws
from ..Services.Connection_Manager import manager
from ..Schemas.Message_Schema import (
    StartConversationRequest,
    ConversationRead,
    ConversationSummary,
    ConversationParticipant,
    DirectMessageCreate,
    DirectMessageRead,
)

router = APIRouter(prefix="/messaging", tags=["Messaging"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _ordered_pair(user_a: Auth_User, user_b: Auth_User) -> tuple[UUID, UUID]:
    if user_a.role == user_b.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A conversation must be between a doctor and a patient.",
        )
    if user_a.role == "doctor":
        return user_a.id, user_b.id
    return user_b.id, user_a.id


def _get_or_create_conversation(db: Session, current_user: Auth_User, other_user: Auth_User) -> Conversation:
    doctor_id, patient_id = _ordered_pair(current_user, other_user)

    convo = (
        db.query(Conversation)
        .filter(
            Conversation.doctor_user_id == doctor_id,
            Conversation.patient_user_id == patient_id,
        )
        .first()
    )
    if convo:
        return convo

    convo = Conversation(doctor_user_id=doctor_id, patient_user_id=patient_id)
    db.add(convo)
    db.commit()
    db.refresh(convo)
    return convo


def _assert_participant(conversation: Conversation, user: Auth_User) -> None:
    if user.id not in (conversation.doctor_user_id, conversation.patient_user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant in this conversation.")


def _other_user_id(conversation: Conversation, user_id: UUID) -> UUID:
    return conversation.patient_user_id if user_id == conversation.doctor_user_id else conversation.doctor_user_id


# ── REST: conversations ──────────────────────────────────────────────────────

@router.post("/conversations", response_model=ConversationRead)
def start_conversation(
    payload: StartConversationRequest,
    current_user: Auth_User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    other_user = db.query(Auth_User).filter(Auth_User.id == payload.other_user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found.")
    if other_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot start a conversation with yourself.")

    return _get_or_create_conversation(db, current_user, other_user)


@router.get("/conversations", response_model=List[ConversationSummary])
def list_conversations(
    current_user: Auth_User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversations = (
        db.query(Conversation)
        .filter(
            or_(
                Conversation.doctor_user_id == current_user.id,
                Conversation.patient_user_id == current_user.id,
            )
        )
        .order_by(Conversation.last_message_at.desc())
        .all()
    )

    summaries: list[ConversationSummary] = []
    for convo in conversations:
        other_id = _other_user_id(convo, current_user.id)
        other_user = db.query(Auth_User).filter(Auth_User.id == other_id).first()

        last_message = (
            db.query(DirectMessage)
            .filter(DirectMessage.conversation_id == convo.id)
            .order_by(DirectMessage.created_at.desc())
            .first()
        )
        unread_count = (
            db.query(DirectMessage)
            .filter(
                DirectMessage.conversation_id == convo.id,
                DirectMessage.sender_id != current_user.id,
                DirectMessage.is_read == False,
            )
            .count()
        )

        summaries.append(
            ConversationSummary(
                id=convo.id,
                doctor_user_id=convo.doctor_user_id,
                patient_user_id=convo.patient_user_id,
                created_at=convo.created_at,
                last_message_at=convo.last_message_at,
                other_user=ConversationParticipant.model_validate(other_user),
                last_message_preview=(last_message.content[:120] if last_message else None),
                unread_count=unread_count,
            )
        )
    return summaries


# ── REST: messages within a conversation ────────────────────────────────────

@router.get("/conversations/{conversation_id}/messages", response_model=List[DirectMessageRead])
def get_messages(
    conversation_id: UUID,
    current_user: Auth_User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convo = db.get(Conversation, conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    _assert_participant(convo, current_user)

    return (
        db.query(DirectMessage)
        .filter(DirectMessage.conversation_id == conversation_id)
        .order_by(DirectMessage.created_at.asc())
        .all()
    )


@router.post("/conversations/{conversation_id}/messages", response_model=DirectMessageRead)
async def send_message(
    conversation_id: UUID,
    payload: DirectMessageCreate,
    current_user: Auth_User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convo = db.get(Conversation, conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    _assert_participant(convo, current_user)

    message = DirectMessage(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=payload.content,
    )
    db.add(message)
    convo.last_message_at = message.created_at
    db.commit()
    db.refresh(message)

    other_id = _other_user_id(convo, current_user.id)
    await manager.send_to_user(
        other_id,
        {"type": "message", "data": DirectMessageRead.model_validate(message).model_dump(mode="json")},
    )
    return message


@router.patch("/conversations/{conversation_id}/read", status_code=204)
def mark_read(
    conversation_id: UUID,
    current_user: Auth_User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convo = db.get(Conversation, conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    _assert_participant(convo, current_user)

    (
        db.query(DirectMessage)
        .filter(
            DirectMessage.conversation_id == conversation_id,
            DirectMessage.sender_id != current_user.id,
            DirectMessage.is_read == False,  # noqa: E712
        )
        .update({"is_read": True})
    )
    db.commit()


# ── WebSocket: live chat ─────────────────────────────────────────────────────

@router.websocket("/ws/{conversation_id}")
async def chat_socket(websocket: WebSocket, conversation_id: UUID, token: str):

    user = get_user_from_token_ws(token)
    if user is None:
        await websocket.close(code=4401)
        return

    from ..DataBase.Database import SessionLocal
    db = SessionLocal()
    try:
        convo = db.get(Conversation, conversation_id)
        if not convo or user.id not in (convo.doctor_user_id, convo.patient_user_id):
            await websocket.close(code=4403)
            return
    finally:
        db.close()

    await manager.connect(user.id, websocket)

    try:
        while True:
            raw = await websocket.receive_json()

            content = (raw or {}).get("content", "").strip()
            if not content:
                await websocket.send_json({"type": "error", "data": {"detail": "Empty message."}})
                continue
            if len(content) > 4000:
                await websocket.send_json({"type": "error", "data": {"detail": "Message too long."}})
                continue

            db = SessionLocal()
            try:
                message = DirectMessage(
                    conversation_id=conversation_id,
                    sender_id=user.id,
                    content=content,
                )
                db.add(message)
                convo = db.get(Conversation, conversation_id)
                convo.last_message_at = message.created_at
                db.commit()
                db.refresh(message)

                payload = {
                    "type": "message",
                    "data": DirectMessageRead.model_validate(message).model_dump(mode="json"),
                }
                other_id = _other_user_id(convo, user.id)
            finally:
                db.close()

            await websocket.send_json(payload)
            await manager.send_to_user(other_id, payload)

    except WebSocketDisconnect:
        manager.disconnect(user.id, websocket)
    except Exception:
        manager.disconnect(user.id, websocket)
        raise