from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from typing import List, Optional

from ..DataBase.Database import get_db
from ..Models.System import Appointment, HealthAdvice, ChatMessage
from ..Models.Medical_Data import HealthData
from ..Security.Dependencies import get_current_user
from ..Schemas.System_Schema import (
    AppointmentBase, AppointmentRead,
    HealthAdvice_Create, HealthAdvice_Read, HealthAdviceBase,
    ChatMessageCreate, ChatMessageRead, ChatSessionResponse
)

router = APIRouter(prefix="/system", tags=["System"])


@router.post("/appointments", response_model=AppointmentRead)
def create_appointment(payload: AppointmentBase, db: Session = Depends(get_db)):
    appointment = Appointment(**payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.get("/appointments", response_model=List[AppointmentRead])
def list_appointments(
    doctor_id: Optional[UUID] = Query(None),
    profile_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
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
def update_appointment(appointment_id: UUID, payload: AppointmentBase, db: Session = Depends(get_db)):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(appointment, key, value)
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


@router.post("/health-advice", response_model=HealthAdvice_Read)
def create_advice(payload: HealthAdvice_Create, db: Session = Depends(get_db)):
    advice = HealthAdvice(**payload.model_dump())
    db.add(advice)
    db.commit()
    db.refresh(advice)
    return advice

@router.get("/health-advice", response_model=List[HealthAdvice_Read])
def list_advice(
    condition_tag: Optional[str] = Query(None),
    severity_level: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(HealthAdvice)
    if condition_tag:
        query = query.filter(HealthAdvice.condition_tag == condition_tag)
    if severity_level:
        query = query.filter(HealthAdvice.severity_level == severity_level)
    return query.all()

@router.get("/health-advice/{advice_id}", response_model=HealthAdvice_Read)
def get_advice(advice_id: UUID, db: Session = Depends(get_db)):
    advice = db.get(HealthAdvice, advice_id)
    if not advice:
        raise HTTPException(status_code=404, detail="Health advice not found")
    return advice

@router.patch("/health-advice/{advice_id}", response_model=HealthAdvice_Read)
def update_advice(advice_id: UUID, payload: HealthAdviceBase, db: Session = Depends(get_db)):
    advice = db.get(HealthAdvice, advice_id)
    if not advice:
        raise HTTPException(status_code=404, detail="Health advice not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(advice, key, value)
    db.commit()
    db.refresh(advice)
    return advice

@router.delete("/health-advice/{advice_id}", status_code=204)
def delete_advice(advice_id: UUID, db: Session = Depends(get_db)):
    advice = db.get(HealthAdvice, advice_id)
    if not advice:
        raise HTTPException(status_code=404, detail="Health advice not found")
    db.delete(advice)
    db.commit()


@router.post("/chat", response_model=ChatMessageRead)
def send_message(
    payload: ChatMessageCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user
    session_id = payload.session_id or uuid4()
    chat_mode = payload.chat_mode or "gemini"
    chat_mode = chat_mode if chat_mode in {"gemini", "doctor"} else "gemini"

    reports = db.query(HealthData).filter(HealthData.user_id == user.id).order_by(HealthData.created_at.desc()).all()
    latest_report = reports[0] if reports else None

    if chat_mode == "doctor":
        ai_response = (
            f"Dr. {user.username.title()} is reviewing your case. "
            "Please expect a personalized treatment plan with medication, lifestyle guidance, "
            "and follow-up scheduling. If you want to discuss a prescription or appointment, say so."
        )
    else:
        if latest_report:
            ai_response = (
                f"Gemini clinical assistant here. Based on your latest report: HbA1c {latest_report.hba1c}%, "
                f"LDL {latest_report.ldl_cholesterol} mg/dL, blood pressure {latest_report.blood_pressure}. "
                "Ask me anything about your report, medications, or next steps."
            )
        else:
            ai_response = (
                "Gemini clinical assistant here. I don't have a recent report for you yet, "
                "but I can still answer general health questions or help you upload a report."
            )

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
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
    if not messages:
        raise HTTPException(status_code=404, detail="Session not found")
    return ChatSessionResponse(session_id=session_id, messages=messages)

@router.get("/chat/user/{user_id}", response_model=List[ChatMessageRead])
def get_user_messages(user_id: UUID, db: Session = Depends(get_db)):
    return db.query(ChatMessage).filter(ChatMessage.user_id == user_id).all()

@router.delete("/chat/{message_id}", status_code=204)
def delete_message(message_id: UUID, db: Session = Depends(get_db)):
    message = db.get(ChatMessage, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(message)
    db.commit()