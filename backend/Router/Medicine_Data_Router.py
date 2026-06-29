from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from ..Core.Personal_Data_functions import (
    get_doctor_by_user_id,
    get_profile_by_user_id,
)
from ..DataBase.Database import get_db
from ..Models.Personal_Data import Doctor, Profile
from ..Security.Dependencies import get_current_user
from ..Schemas.Medicine_Data_Schema import BulkPrescriptionCreate, PrescriptionRead
from ..Core.Medicine_Data_Functions import (
    create_prescription,
    get_active_prescription,
    get_all_prescriptions,
    get_prescription_by_id,
)

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


# ── helper ─────────────────────────────────────────────────────────────────────

def _verify_doctor_owns_profile(db: Session, doctor_user_id: UUID, profile_id: UUID) -> None:
    """
    Bug #4 fix: raises HTTP 403 if doctor is not assigned to this patient profile.
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == doctor_user_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor profile not found."
        )

    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    if profile.doctor_id != doctor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the assigned doctor for this patient."
        )


# ── routes ─────────────────────────────────────────────────────────────────────

@router.post("/uploadprescription", response_model=list[PrescriptionRead], status_code=status.HTTP_201_CREATED)
def upload_prescription(
    data: BulkPrescriptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can upload prescriptions."
        )

    _verify_doctor_owns_profile(db, current_user.id, data.profile_id)

    doctor = get_doctor_by_user_id(db, current_user.id)

    prescriptions = create_prescription(
        db=db,
        profile_id=data.profile_id,
        doctor_id=doctor.id,
        medicines=[m.model_dump() for m in data.medicines]
    )

    return prescriptions


@router.get("/active/{profile_id}", response_model=list[PrescriptionRead])
def active_prescriptions(
    profile_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role == "doctor":
        _verify_doctor_owns_profile(db, current_user.id, profile_id)
    else:
        profile = db.query(Profile).filter(
            Profile.id == profile_id,
            Profile.user_id == current_user.id
        ).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view these prescriptions."
            )

    return get_active_prescription(db, profile_id)


@router.get("/history/{profile_id}", response_model=list[PrescriptionRead])
def prescription_history(
    profile_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role == "doctor":
        _verify_doctor_owns_profile(db, current_user.id, profile_id)
    else:
        profile = db.query(Profile).filter(
            Profile.id == profile_id,
            Profile.user_id == current_user.id
        ).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view these prescriptions."
            )

    return get_all_prescriptions(db, profile_id)


@router.get("/my-active", response_model=list[PrescriptionRead])
def my_active_prescriptions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    profile = get_profile_by_user_id(db, current_user.id)
    return get_active_prescription(db, profile.id)


@router.get("/my-history", response_model=list[PrescriptionRead])
def my_history_prescriptions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    profile = get_profile_by_user_id(db, current_user.id)
    return get_all_prescriptions(db, profile.id)


@router.get("/{prescription_id}", response_model=PrescriptionRead)
def get_prescription(
    prescription_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    prescription = get_prescription_by_id(db, prescription_id)

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found."
        )

    if current_user.role == "doctor":
        _verify_doctor_owns_profile(db, current_user.id, prescription.profile_id)
    else:
        profile = db.query(Profile).filter(
            Profile.id == prescription.profile_id,
            Profile.user_id == current_user.id
        ).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this prescription."
            )

    return prescription