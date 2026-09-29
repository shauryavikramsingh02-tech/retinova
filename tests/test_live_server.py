import sys
from pathlib import Path
import httpx

base = "http://127.0.0.1:8000"
client = httpx.Client(base_url=base, timeout=25.0)

def run_e2e_verification():
    print("==================================================")
    print(" RetinaCare Foundation + Grad-CAM - Live E2E Verification")
    print("==================================================")

    # 1. Health check
    print("\n[1/8] Testing /api/health...")
    resp = client.get("/api/health")
    assert resp.status_code == 200
    health = resp.json()
    print(f"      Status: {health['status']}, DB: {health['database']['type']}, PyTorch: {health['ai_framework']['pytorch_installed']}")

    # 2. Register Patient
    print("\n[2/8] Testing Patient Registration...")
    new_patient_data = {
        "full_name": "Meera Krishnan",
        "age": 62,
        "gender": "Female",
        "contact_phone": "+91-9876549999",
        "contact_email": "meera.krishnan@example.com",
        "diabetes_type": "Type 2",
        "diabetes_duration_years": 11.0,
        "hypertension": True,
        "medical_history": "Longstanding T2D, complaining of intermittent blurred vision in left eye."
    }
    resp = client.post("/api/patients", json=new_patient_data)
    assert resp.status_code == 201, f"Failed patient reg: {resp.text}"
    patient = resp.json()
    patient_id = patient["patient_id"]
    print(f"      Registered: {patient_id} - {patient['full_name']}")

    # 3. Live AI & Grad-CAM Standalone Preview
    print("\n[3/8] Testing Standalone PyTorch Grad-CAM Preview...")
    demo_dir = Path(__file__).resolve().parent.parent / "data" / "demo"
    demo_od = demo_dir / "sample_OD_normal.jpg"
    demo_os = demo_dir / "sample_OS_normal.jpg"

    with open(demo_od, "rb") as f:
        resp = client.post("/api/screenings/analyze-ai-preview", files={"image": ("sample_OD_normal.jpg", f, "image/jpeg")})
    assert resp.status_code == 200, f"Preview failed: {resp.text}"
    preview_ai = resp.json()
    assert preview_ai["gradcam_generated"] is True
    print(f"      Preview: Predicted={preview_ai['predicted_class_name']}, Confidence={preview_ai['confidence_percent']}%")
    print(f"      Heatmap URL: {preview_ai['heatmap_url']}")
    print(f"      Overlay URL: {preview_ai['overlay_url']}")

    # 4. Bilateral Screening Ingestion & Automatic Grad-CAM Execution
    print("\n[4/8] Testing Bilateral Screening Ingestion & Grad-CAM (OS and OD)...")
    with open(demo_os, "rb") as f_os, open(demo_od, "rb") as f_od:
        files = {
            "left_eye_image": ("sample_OS_normal.jpg", f_os, "image/jpeg"),
            "right_eye_image": ("sample_OD_normal.jpg", f_od, "image/jpeg")
        }
        data = {
            "patient_id": patient_id,
            "clinical_notes": "Bilateral dilated examination with full Grad-CAM explainability.",
            "visual_acuity_left": "6/9",
            "visual_acuity_right": "6/6"
        }
        resp = client.post("/api/screenings", data=data, files=files)
    assert resp.status_code == 201, f"Screening upload failed: {resp.text}"
    screening = resp.json()
    screening_id = screening["screening_id"]
    print(f"      Created Screening: {screening_id}")
    print(f"      Overall Predicted Class: {screening['overall_predicted_class']}")
    print(f"      OS Prediction: {screening['left_eye_ai']['predicted_class_name']} ({screening['left_eye_ai']['confidence_percent']}%)")
    print(f"      OD Prediction: {screening['right_eye_ai']['predicted_class_name']} ({screening['right_eye_ai']['confidence_percent']}%)")
    print(f"      OS Heatmap URL: {screening['left_eye_ai']['heatmap_url']}")
    print(f"      OS Overlay URL: {screening['left_eye_ai']['overlay_url']}")

    # 5. Verify Local Files & HTTP Access for Generated Grad-CAM Images
    print("\n[5/8] Verifying Local Grad-CAM Image Serving over HTTP...")
    os_heatmap_url = screening["left_eye_ai"]["heatmap_url"]
    os_overlay_url = screening["left_eye_ai"]["overlay_url"]

    resp_heat = client.get(os_heatmap_url)
    assert resp_heat.status_code == 200, f"Heatmap 404: {os_heatmap_url}"
    assert len(resp_heat.content) > 1000

    resp_over = client.get(os_overlay_url)
    assert resp_over.status_code == 200, f"Overlay 404: {os_overlay_url}"
    assert len(resp_over.content) > 1000
    print(f"      Heatmap ({len(resp_heat.content)} bytes) & Overlay ({len(resp_over.content)} bytes) verified accessible!")

    # 6. Test Re-running AI and Grad-CAM
    print("\n[6/8] Testing /api/screenings/{id}/run-ai endpoint...")
    resp_rerun = client.post(f"/api/screenings/{screening_id}/run-ai")
    assert resp_rerun.status_code == 200
    rerun_data = resp_rerun.json()
    assert rerun_data["success"] is True
    print(f"      Re-run Successful: {rerun_data['overall_predicted_class']}")

    # 7. Retrieve Screening Detail
    print("\n[7/8] Testing Screening Detail...")
    resp = client.get(f"/api/screenings/{screening_id}")
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["screening_id"] == screening_id
    assert detail["overall_predicted_class"] is not None
    assert detail["left_eye_ai"]["gradcam_generated"] is True
    assert detail["right_eye_ai"]["gradcam_generated"] is True
    print(f"      Detail confirmed: Patient {detail['patient']['full_name']}, Stage: {detail['overall_predicted_class']}")

    # 8. Frontend HTML Routes
    print("\n[8/8] Testing Frontend HTML Routes...")
    for route in ["/", "/pages/patients.html", "/pages/new_screening.html", "/pages/screenings.html", f"/pages/screening_detail.html?id={screening_id}"]:
        resp = client.get(route)
        assert resp.status_code == 200, f"Route {route} failed: {resp.status_code}"
    print("      All Frontend HTML pages returned HTTP 200 OK.")

    print("\n==================================================")
    print(" ALL 8 GRAD-CAM & FOUNDATION TESTS PASSED LIVE!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_verification()
