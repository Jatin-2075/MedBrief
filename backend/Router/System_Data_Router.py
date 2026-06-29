from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from typing import List, Optional
from collections import defaultdict
import time

from ..DataBase.Database import get_db
from ..Models.System import Appointment, ChatMessage
from ..Models.Medical_Data import HealthData
from ..Security.Dependencies import get_current_user
from ..Schemas.System_Schema import (
    AppointmentBase,
    AppointmentRead,
    AppointmentStatusUpdate,
    ChatMessageCreate,
    ChatMessageRead,
    ChatSessionResponse,
)
from ..Services.Gemini.Client import call_genai
from ..Services.Gemini.Prompts.Chat_Prompts import build_gemini_chat_prompt

router = APIRouter(prefix="/system", tags=["System"])


# ── rate limiter ───────────────────────────────────────────────────────────────
_request_log: dict[str, list[float]] = defaultdict(list)

CHAT_RATE_LIMIT = 20
CHAT_WINDOW_SECONDS = 60


def _check_chat_rate_limit(user_id: UUID) -> None:
    key = str(user_id)
    now = time.time()
    window_start = now - CHAT_WINDOW_SECONDS

    _request_log[key] = [t for t in _request_log[key] if t > window_start]

    if len(_request_log[key]) >= CHAT_RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Max {CHAT_RATE_LIMIT} messages per minute.",
            headers={"Retry-After": str(CHAT_WINDOW_SECONDS)},
        )

    _request_log[key].append(now)


# ── appointments ───────────────────────────────────────────────────────────────

@router.post("/appointments", response_model=AppointmentRead)
def create_appointment(
    payload: AppointmentBase,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = Appointment(**payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/appointments", response_model=List[AppointmentRead])
def list_appointments(
    doctor_id: Optional[UUID] = Query(None),
    profile_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Appointment)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if profile_id:
        query = query.filter(Appointment.profile_id == profile_id)
    return query.all()


@router.get("/appointments/{appointment_id}", response_model=AppointmentRead)
def get_appointment(appointment_id: UUID, db: Session = Depends(get_db)):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.patch("/appointments/{appointment_id}", response_model=AppointmentRead)
def update_appointment(
    appointment_id: UUID,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Only doctors can update appointment status"
        )

    appointment.status = payload.status
    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/appointments/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: UUID, db: Session = Depends(get_db)):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appointment)
    db.commit()


# ── chat ───────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatMessageRead)
async def send_message(
    payload: ChatMessageCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_chat_rate_limit(current_user.id)

    user = current_user
    session_id = payload.session_id or uuid4()
    chat_mode = payload.chat_mode or "gemini"
    chat_mode = chat_mode if chat_mode in {"gemini", "doctor"} else "gemini"

    reports = (
        db.query(HealthData)
        .filter(HealthData.user_id == user.id)
        .order_by(HealthData.created_at.desc())
        .all()
    )
    latest_report = reports[0] if reports else None

    session_history = []
    if payload.session_id:
        session_history = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .all()
        )

    prompt = build_gemini_chat_prompt(
        user_name=user.username,
        user_query=payload.user_query,
        latest_report=latest_report,
        session_history=session_history,
        chat_mode=chat_mode,
    )

    ai_response = await call_genai(prompt)
    if not ai_response.strip():
        ai_response = "Gemini could not generate a response. Please try again."

    message = ChatMessage(
        user_id=user.id,
        user_query=payload.user_query,
        ai_response=ai_response,
        session_id=session_id,
        chat_mode=chat_mode,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/chat/session/{session_id}", response_model=ChatSessionResponse)
def get_session(session_id: UUID, db: Session = Depends(get_db)):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .all()
    )
    if not messages:
        raise HTTPException(status_code=404, detail="Session not found")
    return ChatSessionResponse(session_id=session_id, messages=messages)


@router.get("/chat/user/{user_id}", response_model=list[ChatMessageRead])
def get_user_messages(user_id: UUID, db: Session = Depends(get_db)):
    return db.query(ChatMessage).filter(ChatMessage.user_id == user_id).all()


@router.delete("/chat/{message_id}", status_code=204)
def delete_message(message_id: UUID, db: Session = Depends(get_db)):
    message = db.get(ChatMessage, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(message)
    db.commit()