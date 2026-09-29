import re
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.database import get_db
from backend.models import User, UserSession, Patient, Screening, utc_now
from backend.schemas import (
    LoginRequest, LoginResponse, UserResponse, UserCreate,
    PatientSelfRegister, ScreeningResponse, PatientDetailResponse
)
from backend.auth_utils import (
    hash_password, verify_password, create_session,
    get_current_user, require_role, get_current_user_optional
)
from backend.api.patients import generate_next_patient_id

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])


def user_to_response(user: User) -> UserResponse:
    patient_code = user.patient_profile.patient_id if user.patient_profile else None
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        patient_id=user.patient_id,
        patient_code=patient_code,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user across designated portals (Admin, Doctor, Patient)."""
    search_term = payload.username.strip()
    
    # 1. Search by direct username or email (case-insensitive)
    user = (
        db.query(User)
        .filter(or_(User.username.ilike(search_term), User.email.ilike(search_term)))
        .first()
    )

    # 2. If not found and might be a Patient ID (e.g. RC-2026-0001)
    if not user:
        patient_match = db.query(Patient).filter(Patient.patient_id.ilike(search_term)).first()
        if patient_match:
            user = db.query(User).filter(User.patient_id == patient_match.id).first()
            # If a patient exists without an associated user account, create one for seamless access
            if not user:
                default_pwd = "patient123"
                p_hash, p_salt = hash_password(default_pwd)
                username_candidate = f"patient_{patient_match.id}"
                user = User(
                    username=username_candidate,
                    email=patient_match.contact_email,
                    password_hash=p_hash,
                    salt=p_salt,
                    role="patient",
                    full_name=patient_match.full_name,
                    patient_id=patient_match.id,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username, Patient ID, or password."
        )

    # 3. Check password
    if not verify_password(payload.password, user.password_hash, user.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username, Patient ID, or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact the administrator."
        )

    # 4. Enforce Portal-Specific Role Rules
    portal = (payload.portal or "").lower().strip()
    if portal == "admin" and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: This portal is strictly for Hospital Administrators. Doctors and Patients must use their respective portals."
        )
    elif portal == "doctor" and user.role not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: This portal is reserved for Clinicians and Eye Specialists. Patients must use the Patient Health Portal."
        )
    elif portal == "patient" and user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: This portal is dedicated to Patients. Clinicians and Admins should log into their clinical workstation."
        )

    # 5. Generate Session Token & Update last_login
    token = create_session(db, user.id)
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # Determine redirect URL based on effective role
    if user.role == "admin":
        redirect_url = "/pages/admin.html"
    elif user.role == "patient":
        redirect_url = "/pages/patient_portal.html"
    else:
        redirect_url = "/"

    return LoginResponse(
        token=token,
        user=user_to_response(user),
        redirect_url=redirect_url,
        message=f"Welcome, {user.full_name}!"
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    """Retrieve profile of currently authenticated user."""
    return user_to_response(user)


@router.post("/logout")
def logout(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_auth_token: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Log out user by deleting their active session token."""
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    elif x_auth_token:
        token = x_auth_token.strip()
    elif "retinacare_token" in request.cookies:
        token = request.cookies.get("retinacare_token")

    if token:
        db.query(UserSession).filter(UserSession.token == token).delete()
        db.commit()
    return {"message": "Successfully logged out."}


@router.post("/register-patient", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register_patient_account(payload: PatientSelfRegister, db: Session = Depends(get_db)):
    """Allow a patient to self-register and create both medical record & login credentials."""
    # Check if username or email already taken
    username = payload.username.strip() if payload.username else None
    if not username:
        # Use email prefix or generate from name
        base = re.sub(r'[^a-zA-Z0-9]', '', payload.full_name.lower())[:10]
        count = db.query(User).count() + 1
        username = f"{base}{count}"

    existing = db.query(User).filter(User.username.ilike(username)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{username}' is already in use. Please choose another."
        )

    if payload.contact_email:
        email_existing = db.query(User).filter(User.email.ilike(payload.contact_email)).first()
        if email_existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists. Please sign in."
            )

    # 1. Create Patient record in patients table
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

    # 2. Create User account linked to patient
    p_hash, p_salt = hash_password(payload.password)
    user = User(
        username=username,
        email=payload.contact_email,
        password_hash=p_hash,
        salt=p_salt,
        role="patient",
        full_name=payload.full_name.strip(),
        patient_id=patient.id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_session(db, user.id)
    return LoginResponse(
        token=token,
        user=user_to_response(user),
        redirect_url="/pages/patient_portal.html",
        message="Account created successfully! Welcome to your RetinaCare Patient Health Portal."
    )


# --- Patient Data Access for Logged-In Patient ---
@router.get("/my-records")
def get_my_patient_records(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full screening history, images, and medical profile for current patient user."""
    if user.role != "patient" and not user.patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not associated with a patient profile."
        )

    patient = None
    if user.patient_id:
        patient = db.query(Patient).filter(Patient.id == user.patient_id).first()
    
    if not patient:
        # Fallback search by email
        if user.email:
            patient = db.query(Patient).filter(Patient.contact_email == user.email).first()

    if not patient:
        return {
            "patient": None,
            "screenings": [],
            "message": "No clinical patient record currently linked to your user account."
        }

    screenings = (
        db.query(Screening)
        .filter(Screening.patient_id == patient.id)
        .order_by(desc(Screening.screening_date))
        .all()
    )

    screening_list = []
    for s in screenings:
        screening_list.append({
            "id": s.id,
            "screening_id": s.screening_id,
            "patient_id": s.patient_id,
            "screening_date": s.screening_date.isoformat() if s.screening_date else None,
            "clinical_notes": s.clinical_notes,
            "visual_acuity_left": s.visual_acuity_left,
            "visual_acuity_right": s.visual_acuity_right,
            "left_eye_image_url": f"/data/uploads/{s.left_eye_image_filename}" if s.left_eye_image_filename else None,
            "right_eye_image_url": f"/data/uploads/{s.right_eye_image_filename}" if s.right_eye_image_filename else None,
            "left_eye_quality": s.left_eye_quality,
            "right_eye_quality": s.right_eye_quality,
            "left_eye_ai": s.left_eye_ai,
            "right_eye_ai": s.right_eye_ai,
            "overall_predicted_class": s.overall_predicted_class,
            "quality_status": s.quality_status,
            "ai_status": s.ai_status,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })

    return {
        "patient": {
            "id": patient.id,
            "patient_id": patient.patient_id,
            "full_name": patient.full_name,
            "age": patient.age,
            "gender": patient.gender,
            "contact_phone": patient.contact_phone,
            "contact_email": patient.contact_email,
            "diabetes_type": patient.diabetes_type,
            "diabetes_duration_years": patient.diabetes_duration_years,
            "hypertension": patient.hypertension,
            "medical_history": patient.medical_history,
            "created_at": patient.created_at.isoformat() if patient.created_at else None
        },
        "screenings": screening_list,
        "total_screenings": len(screening_list)
    }


# --- Admin User Management Endpoints ---
@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"]))
):
    """[Admin Only] List all registered user accounts with roles and activity."""
    users = db.query(User).order_by(desc(User.created_at)).all()
    return [user_to_response(u) for u in users]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"]))
):
    """[Admin Only] Create a new Doctor, Admin, or Patient user account."""
    existing = db.query(User).filter(User.username.ilike(payload.username.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{payload.username}' is already in use."
        )

    if payload.email:
        email_existing = db.query(User).filter(User.email.ilike(payload.email.strip())).first()
        if email_existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{payload.email}' is already in use."
            )

    p_hash, p_salt = hash_password(payload.password)
    user = User(
        username=payload.username.strip(),
        email=payload.email.strip() if payload.email else None,
        password_hash=p_hash,
        salt=p_salt,
        role=payload.role,
        full_name=payload.full_name.strip(),
        patient_id=payload.patient_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_response(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_or_toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"]))
):
    """[Admin Only] Deactivate or delete user account."""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete or deactivate your own administrator account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    db.delete(user)
    db.commit()
    return {"message": f"User '{user.username}' successfully removed."}
