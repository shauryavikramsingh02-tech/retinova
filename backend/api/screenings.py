import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db, UPLOADS_DIR, PROCESSED_DIR
from backend.models import Patient, Screening
from backend.schemas import ScreeningResponse, GradCAMResult
from backend.ai.quality import analyze_image_quality
from backend.ai.gradcam import explain_and_save_retinal_image
from backend.ai.model import DR_CLASSES, DR_CLASS_SHORT

router = APIRouter(prefix="/screenings", tags=["Screenings"])

def generate_next_screening_id(db: Session) -> str:
    """Generate next sequential screening ID, e.g. SCR-2026-0001."""
    current_year = datetime.now(timezone.utc).year
    prefix = f"SCR-{current_year}-"
    last_screening = (
        db.query(Screening)
        .filter(Screening.screening_id.startswith(prefix))
        .order_by(desc(Screening.id))
        .first()
    )
    if last_screening and last_screening.screening_id:
        match = re.search(r"SCR-\d{4}-(\d+)", last_screening.screening_id)
        if match:
            next_num = int(match.group(1)) + 1
            return f"{prefix}{next_num:04d}"
    return f"{prefix}0001"

@router.post("", response_model=ScreeningResponse, status_code=status.HTTP_201_CREATED)
async def create_screening(
    patient_id: str = Form(..., description="Patient database ID or clinical ID (e.g. RC-2026-0001)"),
    clinical_notes: Optional[str] = Form(None),
    visual_acuity_left: Optional[str] = Form(None),
    visual_acuity_right: Optional[str] = Form(None),
    left_eye_image: UploadFile = File(..., description="Left Eye (OS - Oculus Sinister) Fundus Image"),
    right_eye_image: UploadFile = File(..., description="Right Eye (OD - Oculus Dexter) Fundus Image"),
    db: Session = Depends(get_db)
):
    """
    Upload bilateral retinal fundus images (OS and OD) for a registered patient:
    1. Validates patient in local SQLite
    2. Saves both images to local disk storage (data/uploads/)
    3. Runs OpenCV image-quality analysis (sharpness, exposure, contrast, resolution, FOV)
    4. Runs genuine PyTorch Retinal classification & extracts Grad-CAM heatmaps and overlays
    5. Saves Grad-CAM heatmaps and overlays to local disk (data/processed/)
    6. Stores screening record and metrics in SQLite
    """
    # 1. Resolve Patient
    if patient_id.isdigit():
        patient = db.query(Patient).filter(Patient.id == int(patient_id)).first()
    else:
        patient = db.query(Patient).filter(Patient.patient_id == patient_id.strip()).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found. Please register patient first."
        )

    # 2. Read image bytes
    try:
        left_bytes = await left_eye_image.read()
        right_bytes = await right_eye_image.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded image files: {str(e)}"
        )

    if not left_bytes or len(left_bytes) < 100:
        raise HTTPException(status_code=400, detail="Left eye image is empty or corrupt.")
    if not right_bytes or len(right_bytes) < 100:
        raise HTTPException(status_code=400, detail="Right eye image is empty or corrupt.")

    # 3. Generate IDs and target file paths
    screening_id = generate_next_screening_id(db)
    now_utc = datetime.now(timezone.utc)
    timestamp = now_utc.strftime("%Y%m%d_%H%M%S")

    left_ext = Path(left_eye_image.filename or "left.jpg").suffix.lower() or ".jpg"
    right_ext = Path(right_eye_image.filename or "right.jpg").suffix.lower() or ".jpg"
    if left_ext not in [".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"]:
        left_ext = ".jpg"
    if right_ext not in [".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"]:
        right_ext = ".jpg"

    left_filename = f"{screening_id}_OS_{timestamp}{left_ext}"
    right_filename = f"{screening_id}_OD_{timestamp}{right_ext}"

    left_disk_path = UPLOADS_DIR / left_filename
    right_disk_path = UPLOADS_DIR / right_filename

    # Save to local storage
    try:
        with open(left_disk_path, "wb") as f:
            f.write(left_bytes)
        with open(right_disk_path, "wb") as f:
            f.write(right_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image locally: {str(e)}"
        )

    # 4. Perform OpenCV Image-Quality Analysis
    left_quality = analyze_image_quality(left_bytes, filename=left_filename)
    right_quality = analyze_image_quality(right_bytes, filename=right_filename)

    if left_quality["passed"] and right_quality["passed"]:
        if left_quality["issues"] or right_quality["issues"]:
            quality_status = "Warning"
        else:
            quality_status = "Passed"
    else:
        quality_status = "Retake Required"

    # 5. Perform PyTorch Model Inference & Extract Authentic Grad-CAM
    try:
        left_ai = explain_and_save_retinal_image(left_disk_path, screening_id, eye_side="OS")
        right_ai = explain_and_save_retinal_image(right_disk_path, screening_id, eye_side="OD")

        # Tele-ophthalmology worst-eye classification rule
        worst_class_id = max(left_ai["predicted_class_id"], right_ai["predicted_class_id"])
        overall_predicted_class = DR_CLASSES[worst_class_id]
        ai_status = f"Inference Complete ({overall_predicted_class})"
    except Exception as e:
        left_ai = None
        right_ai = None
        overall_predicted_class = "Inference Error"
        ai_status = f"Inference Failed: {str(e)}"

    # 6. Create database record
    screening = Screening(
        screening_id=screening_id,
        patient_id=patient.id,
        screening_date=now_utc,
        clinical_notes=clinical_notes.strip() if clinical_notes else None,
        visual_acuity_left=visual_acuity_left.strip() if visual_acuity_left else None,
        visual_acuity_right=visual_acuity_right.strip() if visual_acuity_right else None,
        left_eye_image_filename=left_filename,
        left_eye_image_path=str(left_disk_path),
        right_eye_image_filename=right_filename,
        right_eye_image_path=str(right_disk_path),
        left_eye_quality=left_quality,
        right_eye_quality=right_quality,
        left_eye_ai=left_ai,
        right_eye_ai=right_ai,
        overall_predicted_class=overall_predicted_class,
        quality_status=quality_status,
        ai_status=ai_status
    )

    db.add(screening)
    db.commit()
    db.refresh(screening)

    return ScreeningResponse(
        id=screening.id,
        screening_id=screening.screening_id,
        patient_id=screening.patient_id,
        screening_date=screening.screening_date,
        clinical_notes=screening.clinical_notes,
        visual_acuity_left=screening.visual_acuity_left,
        visual_acuity_right=screening.visual_acuity_right,
        left_eye_image_filename=screening.left_eye_image_filename,
        left_eye_image_url=f"/data/uploads/{screening.left_eye_image_filename}",
        right_eye_image_filename=screening.right_eye_image_filename,
        right_eye_image_url=f"/data/uploads/{screening.right_eye_image_filename}",
        left_eye_quality=screening.left_eye_quality,
        right_eye_quality=screening.right_eye_quality,
        left_eye_ai=screening.left_eye_ai,
        right_eye_ai=screening.right_eye_ai,
        overall_predicted_class=screening.overall_predicted_class,
        quality_status=screening.quality_status,
        ai_status=screening.ai_status,
        created_at=screening.created_at
    )

@router.get("", response_model=List[Dict[str, Any]])
def list_screenings(
    patient_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Retrieve list of screenings with patient summary, quality status, and AI predictions."""
    query = db.query(Screening).join(Patient, Screening.patient_id == Patient.id)

    if patient_id:
        if patient_id.isdigit():
            query = query.filter(Screening.patient_id == int(patient_id))
        else:
            query = query.filter(Patient.patient_id == patient_id.strip())

    screenings = query.order_by(desc(Screening.created_at)).offset(offset).limit(limit).all()

    results = []
    for s in screenings:
        p = s.patient
        results.append({
            "id": s.id,
            "screening_id": s.screening_id,
            "patient_id": s.patient_id,
            "patient_code": p.patient_id if p else "N/A",
            "patient_name": p.full_name if p else "Unknown",
            "patient_age": p.age if p else None,
            "patient_gender": p.gender if p else None,
            "screening_date": s.screening_date,
            "clinical_notes": s.clinical_notes,
            "visual_acuity_left": s.visual_acuity_left,
            "visual_acuity_right": s.visual_acuity_right,
            "left_eye_image_filename": s.left_eye_image_filename,
            "left_eye_image_url": f"/data/uploads/{s.left_eye_image_filename}" if s.left_eye_image_filename else None,
            "right_eye_image_filename": s.right_eye_image_filename,
            "right_eye_image_url": f"/data/uploads/{s.right_eye_image_filename}" if s.right_eye_image_filename else None,
            "left_eye_quality": s.left_eye_quality,
            "right_eye_quality": s.right_eye_quality,
            "left_eye_ai": s.left_eye_ai,
            "right_eye_ai": s.right_eye_ai,
            "overall_predicted_class": s.overall_predicted_class,
            "quality_status": s.quality_status,
            "ai_status": s.ai_status,
            "created_at": s.created_at
        })
    return results

@router.get("/{identifier}", response_model=Dict[str, Any])
def get_screening_detail(identifier: str, db: Session = Depends(get_db)):
    """Fetch complete screening detail including OpenCV quality reports and Grad-CAM explainability maps."""
    if identifier.isdigit():
        screening = db.query(Screening).filter(Screening.id == int(identifier)).first()
    else:
        screening = db.query(Screening).filter(Screening.screening_id == identifier).first()

    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening '{identifier}' not found"
        )

    p = screening.patient
    return {
        "id": screening.id,
        "screening_id": screening.screening_id,
        "patient": {
            "id": p.id if p else None,
            "patient_id": p.patient_id if p else "N/A",
            "full_name": p.full_name if p else "Unknown",
            "age": p.age if p else None,
            "gender": p.gender if p else None,
            "contact_phone": p.contact_phone if p else None,
            "contact_email": p.contact_email if p else None,
            "diabetes_type": p.diabetes_type if p else "None",
            "diabetes_duration_years": p.diabetes_duration_years if p else None,
            "hypertension": p.hypertension if p else False,
            "medical_history": p.medical_history if p else None,
        },
        "screening_date": screening.screening_date,
        "clinical_notes": screening.clinical_notes,
        "visual_acuity_left": screening.visual_acuity_left,
        "visual_acuity_right": screening.visual_acuity_right,
        "left_eye_image_filename": screening.left_eye_image_filename,
        "left_eye_image_url": f"/data/uploads/{screening.left_eye_image_filename}" if screening.left_eye_image_filename else None,
        "right_eye_image_filename": screening.right_eye_image_filename,
        "right_eye_image_url": f"/data/uploads/{screening.right_eye_image_filename}" if screening.right_eye_image_filename else None,
        "left_eye_quality": screening.left_eye_quality,
        "right_eye_quality": screening.right_eye_quality,
        "left_eye_ai": screening.left_eye_ai,
        "right_eye_ai": screening.right_eye_ai,
        "overall_predicted_class": screening.overall_predicted_class,
        "quality_status": screening.quality_status,
        "ai_status": screening.ai_status,
        "created_at": screening.created_at
    }

@router.post("/{identifier}/run-ai", response_model=Dict[str, Any])
def run_ai_for_screening(identifier: str, db: Session = Depends(get_db)):
    """Run or re-run PyTorch model inference & Grad-CAM generation for an existing screening session."""
    if identifier.isdigit():
        screening = db.query(Screening).filter(Screening.id == int(identifier)).first()
    else:
        screening = db.query(Screening).filter(Screening.screening_id == identifier).first()

    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    if not screening.left_eye_image_path or not os.path.exists(screening.left_eye_image_path):
        raise HTTPException(status_code=400, detail="Left eye image file missing on local disk")
    if not screening.right_eye_image_path or not os.path.exists(screening.right_eye_image_path):
        raise HTTPException(status_code=400, detail="Right eye image file missing on local disk")

    try:
        left_ai = explain_and_save_retinal_image(screening.left_eye_image_path, screening.screening_id, eye_side="OS")
        right_ai = explain_and_save_retinal_image(screening.right_eye_image_path, screening.screening_id, eye_side="OD")

        worst_class_id = max(left_ai["predicted_class_id"], right_ai["predicted_class_id"])
        overall_predicted_class = DR_CLASSES[worst_class_id]

        screening.left_eye_ai = left_ai
        screening.right_eye_ai = right_ai
        screening.overall_predicted_class = overall_predicted_class
        screening.ai_status = f"Inference Complete ({overall_predicted_class})"
        screening.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(screening)

        return {
            "success": True,
            "screening_id": screening.screening_id,
            "overall_predicted_class": overall_predicted_class,
            "left_eye_ai": left_ai,
            "right_eye_ai": right_ai
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grad-CAM inference failed: {str(e)}")

@router.post("/analyze-ai-preview", response_model=GradCAMResult)
async def analyze_ai_preview(image: UploadFile = File(...)):
    """
    Live standalone endpoint:
    Runs PyTorch model inference and extracts authentic Grad-CAM heatmap and overlay
    for any single uploaded fundus photograph.
    """
    try:
        content = await image.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {str(e)}")

    if not content:
        raise HTTPException(status_code=400, detail="Image file is empty")

    preview_id = f"preview_{uuid.uuid4().hex[:8]}"
    try:
        result = explain_and_save_retinal_image(content, preview_id, eye_side="preview")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grad-CAM analysis failed: {str(e)}")

@router.post("/analyze-quality-preview")
async def analyze_quality_preview(image: UploadFile = File(...)):
    """Standalone live quality check endpoint for real-time frontend pre-upload preview."""
    try:
        content = await image.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {str(e)}")

    if not content:
        raise HTTPException(status_code=400, detail="Image is empty")

    quality = analyze_image_quality(content, filename=image.filename or "preview.jpg")
    return quality
