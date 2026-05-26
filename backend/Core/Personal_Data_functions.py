from uuid import UUID
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..Models.Personal_Data import Profile, Doctor
from ..Schemas.Personal_Data_Schema import (
    ProfileCreate,
    ProfileUpdate,
    DoctorCreate,
    DoctorUpdate,
)


# ── Doctor ────────────────────────────────────────────────────────────────────

def create_doctor(db: Session, data: DoctorCreate) -> Doctor:
    existing = db.query(Doctor).filter(Doctor.license_number == data.license_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="License number already registered")
    doctor = Doctor(**data.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


def get_doctor_by_id(db: Session, doctor_id: UUID) -> Doctor:
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


def get_doctor_by_user_id(db: Session, user_id: UUID) -> Doctor:
    doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


def list_doctors(db: Session) -> List[Doctor]:
    return db.query(Doctor).all()


def update_doctor(db: Session, doctor_id: UUID, data: DoctorUpdate) -> Doctor:
    doctor = get_doctor_by_id(db, doctor_id)
    update_data = data.model_dump(exclude_none=True)

    if "license_number" in update_data:
        conflict = (
            db.query(Doctor)
            .filter(Doctor.license_number == update_data["license_number"], Doctor.id != doctor_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="License number already registered")

    for field, value in update_data.items():
        setattr(doctor, field, value)
    db.commit()
    db.refresh(doctor)
    return doctor


def delete_doctor(db: Session, doctor_id: UUID) -> dict:
    doctor = get_doctor_by_id(db, doctor_id)
    db.delete(doctor)
    db.commit()
    return {"detail": "Doctor deleted successfully"}


# ── Profile ───────────────────────────────────────────────────────────────────

def create_profile(db: Session, data: ProfileCreate) -> Profile:
    existing = db.query(Profile).filter(Profile.user_id == data.user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists for this user")
    profile = Profile(**data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_profile_by_id(db: Session, profile_id: UUID) -> Profile:
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


def get_profile_by_user_id(db: Session, user_id: UUID) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


def get_profiles_by_doctor(db: Session, doctor_id: UUID) -> List[Profile]:
    return db.query(Profile).filter(Profile.doctor_id == doctor_id).all()


def list_profiles(db: Session) -> List[Profile]:
    return db.query(Profile).all()


def update_profile(db: Session, profile_id: UUID, data: ProfileUpdate) -> Profile:
    profile = get_profile_by_id(db, profile_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


def delete_profile(db: Session, profile_id: UUID) -> dict:
    profile = get_profile_by_id(db, profile_id)
    db.delete(profile)
    db.commit()
    return {"detail": "Profile deleted successfully"}