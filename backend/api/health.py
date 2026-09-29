import os
import sys
from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db, DB_PATH, UPLOADS_DIR, MODELS_DIR
from backend.models import Patient, Screening
from backend.schemas import DashboardStats
from backend.ai.model_loader import get_model_status

router = APIRouter(tags=["System & Dashboard"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """System diagnostic and environment health check."""
    # Test SQLite connection
    db_ok = False
    patient_count = 0
    try:
        patient_count = db.query(Patient).count()
        db_ok = True
    except Exception as e:
        db_err = str(e)

    # Check local torch
    torch_available = False
    torch_version = None
    try:
        import torch
        torch_available = True
        torch_version = torch.__version__
    except Exception:
        pass

    # Check local OpenCV
    cv2_version = None
    try:
        import cv2
        cv2_version = cv2.__version__
    except Exception:
        pass

    # Disk / Uploads check
    uploads_count = len(list(UPLOADS_DIR.glob("*"))) if UPLOADS_DIR.exists() else 0

    return {
        "status": "healthy" if db_ok else "degraded",
        "app_name": "RetinaCare Local Retinal Screening System",
        "sih_problem_statement": "26038",
        "local_mode": True,
        "cloud_independent": True,
        "database": {
            "type": "SQLite",
            "file": str(DB_PATH),
            "accessible": db_ok,
            "patient_records": patient_count
        },
        "computer_vision": {
            "opencv_version": cv2_version,
            "status": "Ready (Quality Gate Active)"
        },
        "ai_framework": {
            "pytorch_installed": torch_available,
            "pytorch_version": torch_version,
            **get_model_status(),
        },
        "storage": {
            "uploads_directory": str(UPLOADS_DIR),
            "stored_images_count": uploads_count
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Summary statistics for the main clinician dashboard."""
    total_patients = db.query(Patient).count()
    total_screenings = db.query(Screening).count()

    today_start = datetime.combine(date.today(), datetime.min.time())
    screenings_today = (
        db.query(Screening)
        .filter(Screening.created_at >= today_start)
        .count()
    )

    passed_count = (
        db.query(Screening)
        .filter(Screening.quality_status.in_(["Passed", "Warning"]))
        .count()
    )
    pass_rate = round((passed_count / total_screenings * 100), 1) if total_screenings > 0 else 100.0

    return DashboardStats(
        total_patients=total_patients,
        total_screenings=total_screenings,
        recent_screenings_today=screenings_today,
        quality_pass_rate=pass_rate,
        system_status="Operational (Local Mode - Zero Cloud Dependency)",
        database_type="SQLite (Local)",
        ai_engine="Local PyTorch (Phase 2 Model Integration Ready)"
    )
