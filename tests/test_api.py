"""
API integration tests using a dedicated in-memory SQLite database.
Completely isolated from the production retinacare.db.
"""
import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

DEMO_DIR = Path(__file__).resolve().parent.parent / "data" / "demo"


def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"]["type"] == "SQLite"
    assert data["local_mode"] is True


def test_dashboard_stats(client):
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_patients" in data
    assert "total_screenings" in data


def test_patient_registration_and_list(client):
    # 1. Register Patient
    payload = {
        "full_name": "Ramesh Kumar Sharma",
        "age": 58,
        "gender": "Male",
        "contact_phone": "+91-9876543210",
        "contact_email": "ramesh.sharma@example.com",
        "diabetes_type": "Type 2",
        "diabetes_duration_years": 8.5,
        "hypertension": True,
        "medical_history": "Diagnosed with Type 2 diabetes in 2018. Occasional blurry vision."
    }
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 201
    created_patient = response.json()
    assert created_patient["full_name"] == payload["full_name"]
    assert "patient_id" in created_patient
    assert created_patient["patient_id"].startswith("RC-")

    patient_db_id = created_patient["id"]
    patient_code = created_patient["patient_id"]

    # 2. List Patients
    list_resp = client.get("/api/patients")
    assert list_resp.status_code == 200
    patients = list_resp.json()
    assert any(p["id"] == patient_db_id for p in patients)

    # 3. Search Patient
    search_resp = client.get("/api/patients?q=Ramesh")
    assert search_resp.status_code == 200
    search_results = search_resp.json()
    assert len(search_results) >= 1
    assert search_results[0]["full_name"] == "Ramesh Kumar Sharma"

    # 4. Get Patient Detail
    detail_resp = client.get(f"/api/patients/{patient_code}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["patient_id"] == patient_code
    assert "screenings" in detail


def test_screening_creation_with_fundus_upload(client):
    # 1. First ensure a patient exists
    payload = {
        "full_name": "Sunita Devi Patel",
        "age": 52,
        "gender": "Female",
        "contact_phone": "+91-9123456780",
        "diabetes_type": "Type 2",
        "diabetes_duration_years": 5.0,
        "hypertension": False,
        "medical_history": "Annual diabetic retinopathy review."
    }
    p_resp = client.post("/api/patients", json=payload)
    assert p_resp.status_code == 201
    patient = p_resp.json()
    patient_id = patient["patient_id"]

    # 2. Upload bilateral fundus images
    od_path = DEMO_DIR / "sample_OD_normal.jpg"
    os_path = DEMO_DIR / "sample_OS_normal.jpg"

    with open(od_path, "rb") as f_od, open(os_path, "rb") as f_os:
        files = {
            "right_eye_image": ("sample_OD_normal.jpg", f_od, "image/jpeg"),
            "left_eye_image": ("sample_OS_normal.jpg", f_os, "image/jpeg")
        }
        data = {
            "patient_id": patient_id,
            "clinical_notes": "Routine dilated fundus exam. Clear media bilateral.",
            "visual_acuity_left": "6/9",
            "visual_acuity_right": "6/6"
        }
        response = client.post("/api/screenings", data=data, files=files)

    assert response.status_code == 201
    screening = response.json()
    assert screening["screening_id"].startswith("SCR-")
    assert screening["quality_status"] in ["Passed", "Warning"]
    assert screening["left_eye_quality"]["passed"] is True
    assert screening["right_eye_quality"]["passed"] is True
    assert "Inference Complete" in screening["ai_status"]
    assert screening["left_eye_ai"]["gradcam_generated"] is True
    assert screening["right_eye_ai"]["gradcam_generated"] is True
    assert "heatmap_url" in screening["left_eye_ai"]
    assert "overlay_url" in screening["left_eye_ai"]

    screening_id = screening["screening_id"]

    # 3. Verify screening is listed
    list_resp = client.get("/api/screenings")
    assert list_resp.status_code == 200
    screenings = list_resp.json()
    assert any(s["screening_id"] == screening_id for s in screenings)

    # 4. Get Screening Detail
    detail_resp = client.get(f"/api/screenings/{screening_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["screening_id"] == screening_id
    assert detail["patient"]["patient_id"] == patient_id
    assert detail["left_eye_quality"]["sharpness_status"] in ["Sharp", "Acceptable"]
    assert detail["right_eye_quality"]["sharpness_status"] in ["Sharp", "Acceptable"]


def test_quality_preview_endpoint(client):
    od_path = DEMO_DIR / "sample_OD_normal.jpg"
    with open(od_path, "rb") as f:
        files = {"image": ("test_preview.jpg", f, "image/jpeg")}
        resp = client.post("/api/screenings/analyze-quality-preview", files=files)

    assert resp.status_code == 200
    res = resp.json()
    assert res["passed"] is True
    assert "sharpness_score" in res
    assert "contrast_score" in res
