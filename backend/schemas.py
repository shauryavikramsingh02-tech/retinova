from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# --- Quality Metrics Schemas ---
class QualityMetric(BaseModel):
    sharpness_score: float = Field(..., description="Laplacian variance score")
    sharpness_status: str = Field(..., description="Sharp, Acceptable, or Blurry")
    brightness_mean: float = Field(..., description="Mean intensity within retinal region")
    brightness_status: str = Field(..., description="Normal, Underexposed, or Overexposed")
    contrast_score: float = Field(..., description="RMS standard deviation of contrast")
    contrast_status: str = Field(..., description="Good, Moderate, or Low")
    resolution_width: int
    resolution_height: int
    resolution_status: str = Field(..., description="Adequate or Low Resolution")
    retinal_mask_coverage: float = Field(..., description="Percentage of detected circular fundus aperture")
    fov_detected: bool
    passed: bool
    issues: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

# --- Patient Schemas ---
class PatientBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    age: int = Field(..., ge=0, le=130)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    diabetes_type: Optional[str] = "None"
    diabetes_duration_years: Optional[float] = None
    hypertension: Optional[bool] = False
    medical_history: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    diabetes_type: Optional[str] = None
    diabetes_duration_years: Optional[float] = None
    hypertension: Optional[bool] = None
    medical_history: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    patient_id: str
    created_at: datetime
    updated_at: datetime
    screening_count: int = 0

    model_config = ConfigDict(from_attributes=True)

# --- Grad-CAM & AI Inference Schemas ---
class GradCAMResult(BaseModel):
    predicted_class_id: int
    predicted_class_name: str
    predicted_class_short: str
    confidence: float
    confidence_percent: float
    class_probabilities: Dict[str, float]
    heatmap_filename: str
    heatmap_path: str
    heatmap_url: str
    overlay_filename: str
    overlay_path: str
    overlay_url: str
    gradcam_generated: bool

# --- Screening Schemas ---
class ScreeningBase(BaseModel):
    clinical_notes: Optional[str] = None
    visual_acuity_left: Optional[str] = None
    visual_acuity_right: Optional[str] = None

class ScreeningResponse(BaseModel):
    id: int
    screening_id: str
    patient_id: int
    screening_date: datetime
    clinical_notes: Optional[str] = None
    visual_acuity_left: Optional[str] = None
    visual_acuity_right: Optional[str] = None
    left_eye_image_filename: Optional[str] = None
    left_eye_image_url: Optional[str] = None
    right_eye_image_filename: Optional[str] = None
    right_eye_image_url: Optional[str] = None
    left_eye_quality: Optional[Dict[str, Any]] = None
    right_eye_quality: Optional[Dict[str, Any]] = None
    left_eye_ai: Optional[Dict[str, Any]] = None
    right_eye_ai: Optional[Dict[str, Any]] = None
    overall_predicted_class: Optional[str] = None
    quality_status: str
    ai_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PatientDetailResponse(PatientResponse):
    screenings: List[ScreeningResponse] = []

class DashboardStats(BaseModel):
    total_patients: int
    total_screenings: int
    recent_screenings_today: int
    quality_pass_rate: float
    system_status: str = "Operational (Local Mode)"
    database_type: str = "SQLite (Local)"
    ai_engine: str = "Local PyTorch Engine (Ready for Model Weights)"


# --- Authentication & User Schemas ---
class LoginRequest(BaseModel):
    username: str = Field(..., description="Username, email, or patient ID")
    password: str = Field(..., min_length=1)
    portal: Optional[str] = Field(None, description="Expected portal: admin, doctor, or patient")

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: str
    role: str
    patient_id: Optional[int] = None
    patient_code: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    token: str
    user: UserResponse
    redirect_url: str
    message: str = "Login successful"

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: str = Field(..., pattern="^(admin|doctor|patient)$")
    patient_id: Optional[int] = None

class PatientSelfRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    age: int = Field(..., ge=0, le=130)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    diabetes_type: Optional[str] = "None"
    diabetes_duration_years: Optional[float] = None
    hypertension: Optional[bool] = False
    medical_history: Optional[str] = None
    username: Optional[str] = None
    password: str = Field(..., min_length=6)
