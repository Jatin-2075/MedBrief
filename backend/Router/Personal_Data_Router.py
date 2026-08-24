from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from ..Security.Dependencies import get_current_user
from ..DataBase.Database import get_db
from ..Services.Cache_Service import (
    cache_get,
    cache_set,
    cache_delete,
    cache_delete_pattern,
    TTL_LONG,
)
from ..Schemas.Personal_Data_Schema import (
    DoctorCreate,
    DoctorUpdate,
    DoctorResponse,
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse,
)
from ..Core.Personal_Data_functions import (
    create_doctor,
    get_doctor_by_id,
    get_doctor_by_user_id,
    list_doctors,
    update_doctor,
    delete_doctor,
    create_profile,
    get_profile_by_id,
    get_profile_by_user_id,
    get_profiles_by_doctor,
    list_profiles,
    update_profile,
    delete_profile,
    get_my_doctor,
    assign_patient_to_doctor,
)

router = APIRouter(prefix="/personal", tags=["Personal Data"])

@router.post("/doctors", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor_route(payload: DoctorCreate, db: Session = Depends(get_db)):
    doctor = create_doctor(db, payload)
    cache_delete("personal:doctors:all")
    return doctor


@router.get("/doctors", response_model=List[DoctorResponse])
def list_doctors_route(db: Session = Depends(get_db)):
    cache_key = "personal:doctors:all"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    doctors = list_doctors(db)
    result = [DoctorResponse.model_validate(d).model_dump(mode="json") for d in doctors]
    cache_set(cache_key, result, ttl=TTL_LONG)
    return result


@router.get("/doctors/{doctor_id}", response_model=DoctorResponse)
def read_doctor(doctor_id: UUID, db: Session = Depends(get_db)):
    cache_key = f"personal:doctor:{doctor_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    doctor = get_doctor_by_id(db, doctor_id)
    result = DoctorResponse.model_validate(doctor).model_dump(mode="json")
    cache_set(cache_key, result, ttl=TTL_LONG)
    return result


@router.get("/doctors/user/{user_id}", response_model=DoctorResponse)
def read_doctor_by_user(user_id: UUID, db: Session = Depends(get_db)):
    cache_key = f"personal:doctor:user:{user_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    doctor = get_doctor_by_user_id(db, user_id)
    result = DoctorResponse.model_validate(doctor).model_dump(mode="json")
    cache_set(cache_key, result, ttl=TTL_LONG)
    return result


@router.get("/doctors/{doctor_id}/patients", response_model=List[ProfileResponse])
def read_doctor_patients(doctor_id: UUID, db: Session = Depends(get_db)):
    cache_key = f"personal:doctor:{doctor_id}:patients"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    # Verify doctor exists first
    doctor = get_doctor_by_id(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile records not found.")

    patients = get_profiles_by_doctor(db, doctor_id)
    result = [ProfileResponse.model_validate(p).model_dump(mode="json") for p in patients]
    cache_set(cache_key, result, ttl=TTL_LONG)
    return result


@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
def update_doctor_route(doctor_id: UUID, payload: DoctorUpdate, db: Session = Depends(get_db)):
    doctor = update_doctor(db, doctor_id, payload)
    cache_delete(
        "personal:doctors:all",
        f"personal:doctor:{doctor_id}",
        f"personal:doctor:user:{doctor.user_id}",
    )
    return doctor


@router.delete("/doctors/{doctor_id}")
def delete_doctor_route(doctor_id: UUID, db: Session = Depends(get_db)):
    result = delete_doctor(db, doctor_id)
    cache_delete("personal:doctors:all", f"personal:doctor:{doctor_id}")
    cache_delete_pattern("personal:doctor:user:*", f"personal:doctor:{doctor_id}:patients")
    return result


# --- PATIENT PROFILE MANAGEMENT ROUTES ---

def _invalidate_profile_caches(profile_id: UUID | None = None, user_id: UUID | None = None) -> None:
    keys = ["personal:profiles:all"]
    if profile_id:
        keys.append(f"personal:profile:{profile_id}")
    if user_id:
        keys.append(f"personal:profile:user:{user_id}")
        keys.append(f"personal:my-doctor:{user_id}")
    cache_delete(*keys)
    # doctor-scoped patient lists and doctor dashboards can't be targeted by a
    # single key here (we don't always know the doctor_id), so sweep them.
    cache_delete_pattern(
        "personal:profiles:doctor:*",
        "personal:my-patients:*",
        "personal:doctor:*:patients",
    )


@router.post("/profiles", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile_route(payload: ProfileCreate, db: Session = Depends(get_db)):
    profile = create_profile(db, payload)
    _invalidate_profile_caches(user_id=payload.user_id)
    return profile


@router.get("/profiles", response_model=List[ProfileResponse])
def list_profiles_route(db: Session = Depends(get_db)):
    cache_key = "personal:profiles:all"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    profiles = list_profiles(db)
    result = [ProfileResponse.model_validate(p).model_dump(mode="json") for p in profiles]
    cache_set(cache_key, result, ttl=TTL_LONG)
    return result


@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
def read_profile(profile_id: UUID, db: Session = Depends(get_db)):
    cache_key = f"personal:profile:{profile_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    profile = get_profile_by_id(db, profile_id)
    result = ProfileResponse.model_validate(profile).model_dump(mode="json")
    cache_set(cache_key, result, ttl=TTL_LONG)
    return result


@router.get("/profiles/user/{user_id}", response_model=ProfileResponse)
def read_profile_by_user(user_id: UUID, db: Session = Depends(get_db)):
    cache_key = f"personal:profile:user:{user_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    profile = get_profile_by_user_id(db, user_id)
    result = ProfileResponse.model_validate(profile).model_dump(mode="json")
    cache_set(cache_key, result, ttl=TTL_LONG)
    return result


@router.get("/profiles/doctor/{doctor_id}", response_model=List[ProfileResponse])
def read_profiles_by_doctor(doctor_id: UUID, db: Session = Depends(get_db)):
    cache_key = f"personal:profiles:doctor:{doctor_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    profiles = get_profiles_by_doctor(db, doctor_id)
    result = [ProfileResponse.model_validate(p).model_dump(mode="json") for p in profiles]
    cache_set(cache_key, result, ttl=TTL_LONG)
    return result


@router.put("/profiles/{profile_id}", response_model=ProfileResponse)
def update_profile_route(profile_id: UUID, payload: ProfileUpdate, db: Session = Depends(get_db)):
    profile = update_profile(db, profile_id, payload)
    _invalidate_profile_caches(profile_id=profile_id, user_id=profile.user_id)
    return profile


@router.delete("/profiles/{profile_id}")
def delete_profile_route(profile_id: UUID, db: Session = Depends(get_db)):
    result = delete_profile(db, profile_id)
    _invalidate_profile_caches(profile_id=profile_id)
    return result



@router.get("/my-doctor", response_model=DoctorResponse)
def my_doctor_route(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if getattr(current_user, "role", None) == "doctor":
        raise HTTPException(status_code=400, detail="Doctors cannot search for their own doctor assignment profile.")

    cache_key = f"personal:my-doctor:{current_user.id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    doctor = get_my_doctor(db, current_user.id)
    result = DoctorResponse.model_validate(doctor).model_dump(mode="json")
    cache_set(cache_key, result, ttl=TTL_LONG)
    return result


@router.post("/assign-patient/{profile_id}")
def assign_patient(
    profile_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if getattr(current_user, "role", None) != "doctor":
        raise HTTPException(status_code=43, detail="Only verified doctors can link patient profiles.")
    result = assign_patient_to_doctor(db, current_user.id, profile_id)
    _invalidate_profile_caches(profile_id=profile_id)
    cache_delete(f"personal:my-patients:{current_user.id}")
    return result


@router.get("/my-patients", response_model=List[ProfileResponse])
def my_patients(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if getattr(current_user, "role", None) != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied: This dashboard view is restricted to medical doctor accounts only."
        )

    cache_key = f"personal:my-patients:{current_user.id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    doctor = get_doctor_by_user_id(db, current_user.id)

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Your account is set to 'doctor' but no matching profile metadata exists."
        )

    patients = get_profiles_by_doctor(db, doctor.id)
    result = [ProfileResponse.model_validate(p).model_dump(mode="json") for p in patients]
    cache_set(cache_key, result, ttl=TTL_LONG)
    return result