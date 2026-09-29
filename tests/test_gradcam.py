import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.ai.model import get_loaded_model, DR_CLASSES, DR_CLASS_SHORT
from backend.ai.gradcam import GradCAMExplainer, explain_and_save_retinal_image
from backend.database import PROCESSED_DIR

client = TestClient(app)
DEMO_DIR = Path(__file__).resolve().parent.parent / "data" / "demo"

def test_model_loading_and_architecture():
    model = get_loaded_model(device="cpu")
    assert model is not None
    target_layer = model.get_target_layer()
    assert target_layer is not None

    models_dir = Path(__file__).resolve().parent.parent / "models"
    weights_path = models_dir / "retinacare_dr_model.pth"
    assert weights_path.exists(), "Model weights file should be saved in models/"

def test_gradcam_generation_and_local_file_saving():
    od_path = DEMO_DIR / "sample_OD_normal.jpg"
    assert od_path.exists()

    result = explain_and_save_retinal_image(od_path, identifier="TEST_SCR_001", eye_side="OD")

    # 1. Output structure checks
    assert result["gradcam_generated"] is True
    assert "predicted_class_id" in result
    assert 0 <= result["predicted_class_id"] < len(DR_CLASSES)
    assert result["predicted_class_name"] in DR_CLASSES
    assert 0.0 <= result["confidence"] <= 1.0
    assert len(result["class_probabilities"]) == 5

    # 2. Local heatmap file existence check
    heatmap_path = Path(result["heatmap_path"])
    assert heatmap_path.exists(), f"Heatmap file missing at {heatmap_path}"
    assert heatmap_path.stat().st_size > 1000

    # 3. Local overlay file existence check
    overlay_path = Path(result["overlay_path"])
    assert overlay_path.exists(), f"Overlay file missing at {overlay_path}"
    assert overlay_path.stat().st_size > 1000

    # 4. URL checks
    assert result["heatmap_url"].startswith("/data/processed/")
    assert result["overlay_url"].startswith("/data/processed/")

def test_analyze_ai_preview_endpoint():
    od_path = DEMO_DIR / "sample_OD_normal.jpg"
    with open(od_path, "rb") as f:
        resp = client.post("/api/screenings/analyze-ai-preview", files={"image": ("test_preview.jpg", f, "image/jpeg")})

    assert resp.status_code == 200
    data = resp.json()
    assert data["gradcam_generated"] is True
    assert "predicted_class_name" in data
    assert "confidence" in data
    assert "heatmap_url" in data
    assert "overlay_url" in data
