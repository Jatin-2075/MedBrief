from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..DataBase.Database import get_db
from ..Models.Auth_Data import Auth_User
from ..Models.Personal_Data import Doctor, Profile
from ..Security.Dependencies import get_current_user
from ..Schemas.Auth_Schema import SignupRequest, LoginRequest, TokenResponse, UserResponse
from ..Core.Security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token 
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(Auth_User).filter(
        (Auth_User.username == payload.username) | (Auth_User.email == payload.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or Email Already Registered"
        )
    
    new_user = Auth_User(
        username = payload.username,
        email = payload.email,
        password = hash_password(payload.password),
        role = payload.role.lower()
    )

    db.add(new_user)
    db.flush()

    try:
        if payload.role.lower() == "doctor":
            doctor_entry = Doctor(
                user_id=new_user.id,
                specialization="General",
                license_number=f"REG-{payload.username.upper()}"
            )
            db.add(doctor_entry)
        else :
            patient_profile = Profile(
                user_id = new_user.id,
                name = payload.username,
                age = 0, gender=0, weight=0, height=0
            )
            db.add(patient_profile)
        db.commit()
    
    except Exception as e:
        db.rollback()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed To Create Role-Specific Profile"
        )
    return {
        "message" : f"User Registered SuccessFully as {payload.role}"
    }


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Auth_User).filter(Auth_User.username == payload.username).first()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Username or Password"
        )
    
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: Auth_User = Depends(get_current_user)):
    return current_user