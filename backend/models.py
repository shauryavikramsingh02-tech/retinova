from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from backend.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(32), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False, index=True)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    contact_phone = Column(String(30), nullable=True)
    contact_email = Column(String(100), nullable=True)
    diabetes_type = Column(String(30), default="None")
    diabetes_duration_years = Column(Float, nullable=True)
    hypertension = Column(Boolean, default=False)
    medical_history = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    screenings = relationship(
        "Screening",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(Screening.created_at)"
    )

class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    screening_id = Column(String(32), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    screening_date = Column(DateTime(timezone=True), default=utc_now)
    clinical_notes = Column(Text, nullable=True)
    visual_acuity_left = Column(String(30), nullable=True)
    visual_acuity_right = Column(String(30), nullable=True)

    # Local file storage references
    left_eye_image_filename = Column(String(255), nullable=True)
    left_eye_image_path = Column(String(500), nullable=True)
    right_eye_image_filename = Column(String(255), nullable=True)
    right_eye_image_path = Column(String(500), nullable=True)

    # OpenCV Image Quality Analysis results (stored as JSON)
    left_eye_quality = Column(JSON, nullable=True)
    right_eye_quality = Column(JSON, nullable=True)

    # PyTorch Model Inference & Grad-CAM results (stored as JSON)
    left_eye_ai = Column(JSON, nullable=True)
    right_eye_ai = Column(JSON, nullable=True)
    overall_predicted_class = Column(String(100), nullable=True)

    # Overall Quality Gate Status: "Passed", "Warning", "Retake Required"
    quality_status = Column(String(50), default="Pending Quality Check")

    # Local AI Model Status: "Inference Complete (Grad-CAM Generated)" or "Pending"
    ai_status = Column(String(100), default="Pending Local Model Inference")

    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    patient = relationship("Patient", back_populates="screenings")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=True)
    password_hash = Column(String(128), nullable=False)
    salt = Column(String(64), nullable=False)
    role = Column(String(20), nullable=False, index=True)  # "admin", "doctor", "patient"
    full_name = Column(String(120), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_login = Column(DateTime(timezone=True), nullable=True)

    patient_profile = relationship("Patient", foreign_keys=[patient_id])
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="sessions")
