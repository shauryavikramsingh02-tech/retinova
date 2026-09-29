import hashlib
import hmac
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, Header, status, Request
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, UserSession, Patient, utc_now

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hash a password using PBKDF2-HMAC-SHA256 with 100,000 iterations."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return key.hex(), salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """Verify a password against the stored hash and salt."""
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return hmac.compare_digest(key.hex(), password_hash)

def create_session(db: Session, user_id: int, days_valid: int = 14) -> str:
    """Create a new session token for the user."""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=days_valid)
    
    session_obj = UserSession(
        token=token,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(session_obj)
    db.commit()
    return token

def get_user_from_token(db: Session, token: str) -> Optional[User]:
    """Retrieve user associated with an unexpired session token."""
    now = datetime.now(timezone.utc)
    session_obj = (
        db.query(UserSession)
        .filter(UserSession.token == token, UserSession.expires_at > now)
        .first()
    )
    if session_obj and session_obj.user and session_obj.user.is_active:
        return session_obj.user
    return None

def get_current_user_optional(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_auth_token: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Extract and validate user from Authorization or X-Auth-Token header without raising 401."""
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    elif x_auth_token:
        token = x_auth_token.strip()
    elif "retinacare_token" in request.cookies:
        token = request.cookies.get("retinacare_token")
    
    if not token:
        return None
        
    return get_user_from_token(db, token)

def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    """Strict dependency requiring authenticated user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_role(allowed_roles: List[str]):
    """Dependency factory checking that user belongs to one of the specified roles."""
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{user.role}' lacks permission. Required: {', '.join(allowed_roles)}",
            )
        return user
    return role_checker

def init_default_users(db: Session):
    """Seed initial demo accounts for Admin, Doctor, and Patient roles if missing."""
    # 1. Admin
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        pwd_hash, salt = hash_password("admin123")
        admin = User(
            username="admin",
            email="admin@retinacare.local",
            password_hash=pwd_hash,
            salt=salt,
            role="admin",
            full_name="Chief Medical Administrator",
            is_active=True
        )
        db.add(admin)

    # 2. Doctor
    doctor = db.query(User).filter(User.username == "doctor").first()
    if not doctor:
        pwd_hash, salt = hash_password("doctor123")
        doctor = User(
            username="doctor",
            email="dr.sharma@retinacare.local",
            password_hash=pwd_hash,
            salt=salt,
            role="doctor",
            full_name="Dr. Ananya Sharma, MD (Retina)",
            is_active=True
        )
        db.add(doctor)

    # 3. Patient
    patient_user = db.query(User).filter(User.username == "patient").first()
    first_patient = db.query(Patient).first()
    
    if not patient_user:
        pwd_hash, salt = hash_password("patient123")
        patient_user = User(
            username="patient",
            email="ramesh.sharma@example.com",
            password_hash=pwd_hash,
            salt=salt,
            role="patient",
            full_name="Ramesh Kumar Sharma",
            patient_id=first_patient.id if first_patient else None,
            is_active=True
        )
        db.add(patient_user)
    elif first_patient and not patient_user.patient_id:
        patient_user.patient_id = first_patient.id

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[AUTH INIT] Warning seeding users: {e}")
