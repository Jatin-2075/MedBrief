import enum
import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship 
from DataBase import Base

class GenderEnum(enum.IntEnum):
    MALE = 1
    FEMALE = 2
    OTHER = 3

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth_users.id"), unique=True)
    specialization = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)

    patients = relationship("Profile", back_populates="managed_by_doctor")
    uploaded_images = relationship("UserImage", back_populates="uploaded_by_doctor")
    appointments = relationship("Appointment", back_populates="doctor")

class Profile(Base):
    __tablename__ = "Profile"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth_users.id"))
    
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=True)

    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(Enum(GenderEnum), nullable=False)
    weight = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)

    owner = relationship("Auth_User", back_populates="profile")
    managed_by_doctor = relationship("Doctor", back_populates="patients")
    images = relationship("UserImage", back_populates="profile")
    appointments = relationship("Appointment", back_populates="profile")

