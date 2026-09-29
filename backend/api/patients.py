import re
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.database import get_db
from backend.models import Patient, Screening
from backend.schemas import PatientCreate, PatientUpdate, PatientResponse, PatientDetailResponse

router = APIRouter(prefix="/patients", tags=["Patients"])

def generate_next_patient_id(db: Session) -> str:
    """Generate next sequential patient ID, e.g. RC-2026-0001."""
    current_year = datetime.now(timezone.utc).year
    prefix = f"RC-{current_year}-"
    last_patient = (
        db.query(Patient)
        .filter(Patient.patient_id.startswith(prefix))
        .order_by(desc(Patient.id))
        .first()
    )
    if last_patient and last_patient.patient_id:
        match = re.search(r"RC-\d{4}-(\d+)", last_patient.patient_id)
        if match:
            next_num = int(match.group(1)) + 1
            return f"{prefix}{next_num:04d}"
    return f"{prefix}0001"

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    """Register a new patient into the local SQLite database."""
    patient_id = generate_next_patient_id(db)

    patient = Patient(
        patient_id=patient_id,
        full_name=payload.full_name.strip(),
        age=payload.age,
        gender=payload.gender,
        contact_phone=payload.contact_phone.strip() if payload.contact_phone else None,
        contact_email=payload.contact_email.strip() if payload.contact_email else None,
        diabetes_type=payload.diabetes_type or "None",
        diabetes_duration_years=payload.diabetes_duration_years,
        hypertension=payload.hypertension or False,
        medical_history=payload.medical_history.strip() if payload.medical_history else None,
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return PatientResponse(
        id=patient.id,
        patient_id=patient.patient_id,
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        contact_phone=patient.contact_phone,
        contact_email=patient.contact_email,
        diabetes_type=patient.diabetes_type,
        diabetes_duration_years=patient.diabetes_duration_years,
        hypertension=patient.hypertension,
        medical_history=patient.medical_history,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
        screening_count=0
    )

@router.get("", response_model=List[PatientResponse])
def list_patients(
    q: Optional[str] = Query(None, description="Search by name, ID or phone"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieve list of registered patients with optional keyword search."""
    query = db.query(Patient)

    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Patient.full_name.ilike(search),
                Patient.patient_id.ilike(search),
                Patient.contact_phone.ilike(search),
                Patient.contact_email.ilike(search),
            )
        )

    patients = query.order_by(desc(Patient.id)).offset(offset).limit(limit).all()

    result = []
    for p in patients:
        count = db.query(Screening).filter(Screening.patient_id == p.id).count()
        result.append(
            PatientResponse(
                id=p.id,
                patient_id=p.patient_id,
                full_name=p.full_name,
                age=p.age,
                gender=p.gender,
                contact_phone=p.contact_phone,
                contact_email=p.contact_email,
                diabetes_type=p.diabetes_type,
                diabetes_duration_years=p.diabetes_duration_years,
                hypertension=p.hypertension,
                medical_history=p.medical_history,
                created_at=p.created_at,
                updated_at=p.updated_at,
                screening_count=count
            )
        )
    return result

@router.get("/{identifier}", response_model=PatientDetailResponse)
def get_patient(identifier: str, db: Session = Depends(get_db)):
    """Fetch patient by database ID or clinical patient_id string (e.g. RC-2026-0001)."""
    if identifier.isdigit():
        patient = db.query(Patient).filter(Patient.id == int(identifier)).first()
    else:
        patient = db.query(Patient).filter(Patient.patient_id == identifier).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{identifier}' not found in local database"
        )

    screenings = (
        db.query(Screening)
        .filter(Screening.patient_id == patient.id)
        .order_by(desc(Screening.created_at))
        .all()
    )

    screening_responses = []
    for s in screenings:
        left_url = f"/data/uploads/{s.left_eye_image_filename}" if s.left_eye_image_filename else None
        right_url = f"/data/uploads/{s.right_eye_image_filename}" if s.right_eye_image_filename else None

        screening_responses.append({
            "id": s.id,
            "screening_id": s.screening_id,
            "patient_id": s.patient_id,
            "screening_date": s.screening_date,
            "clinical_notes": s.clinical_notes,
            "visual_acuity_left": s.visual_acuity_left,
            "visual_acuity_right": s.visual_acuity_right,
            "left_eye_image_filename": s.left_eye_image_filename,
            "left_eye_image_url": left_url,
            "right_eye_image_filename": s.right_eye_image_filename,
            "right_eye_image_url": right_url,
            "left_eye_quality": s.left_eye_quality,
            "right_eye_quality": s.right_eye_quality,
            "quality_status": s.quality_status,
            "ai_status": s.ai_status,
            "created_at": s.created_at,
        })

    return PatientDetailResponse(
        id=patient.id,
        patient_id=patient.patient_id,
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        contact_phone=patient.contact_phone,
        contact_email=patient.contact_email,
        diabetes_type=patient.diabetes_type,
        diabetes_duration_years=patient.diabetes_duration_years,
        hypertension=patient.hypertension,
        medical_history=patient.medical_history,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
        screening_count=len(screenings),
        screenings=screening_responses
    )

@router.put("/{identifier}", response_model=PatientResponse)
def update_patient(identifier: str, payload: PatientUpdate, db: Session = Depends(get_db)):
    """Update patient information."""
    if identifier.isdigit():
        patient = db.query(Patient).filter(Patient.id == int(identifier)).first()
    else:
        patient = db.query(Patient).filter(Patient.patient_id == identifier).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(patient, field, value)

    patient.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(patient)

    count = db.query(Screening).filter(Screening.patient_id == patient.id).count()
    return PatientResponse(
        id=patient.id,
        patient_id=patient.patient_id,
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        contact_phone=patient.contact_phone,
        contact_email=patient.contact_email,
        diabetes_type=patient.diabetes_type,
        diabetes_duration_years=patient.diabetes_duration_years,
        hypertension=patient.hypertension,
        medical_history=patient.medical_history,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
        screening_count=count
    )

@router.delete("/{identifier}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(identifier: str, db: Session = Depends(get_db)):
    """Delete patient and related screenings."""
    if identifier.isdigit():
        patient = db.query(Patient).filter(Patient.id == int(identifier)).first()
    else:
        patient = db.query(Patient).filter(Patient.patient_id == identifier).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.delete(patient)
    db.commit()
    return None
