"""
tests/test_inference.py
========================
Unit tests for the inference pipeline:
  - classifier.py  (architecture smoke test)
  - model_loader.py (unavailable / corrupt weights handling)
  - inference.py    (preprocessing, model_unavailable, image_error paths)

These tests do NOT require dr_model.pth to be present.
They validate the no-fake-prediction contract and the preprocessing pipeline.
"""
from __future__ import annotations

import io
from pathlib import Path
from unittest.mock import patch

import cv2
import numpy as np
import pytest
import torch

DEMO_DIR = Path(__file__).resolve().parent.parent / "data" / "demo"


# ──────────────────────────────────────────────────────────────────────────────
# classifier.py tests
# ──────────────────────────────────────────────────────────────────────────────

class TestRetinalDRNetArchitecture:
    """Verify RetinalDRNet is instantiable and produces correctly shaped outputs."""

    def test_import_and_instantiate(self):
        from backend.ai.classifier import RetinalDRNet, NUM_CLASSES
        model = RetinalDRNet()
        assert isinstance(model, torch.nn.Module)
        total_params = sum(p.numel() for p in model.parameters())
        # Architecture should have a reasonable parameter count (roughly 2–10 M)
        assert 1_000_000 < total_params < 20_000_000, (
            f"Unexpected parameter count: {total_params}"
        )

    def test_forward_pass_shape(self):
        from backend.ai.classifier import RetinalDRNet, NUM_CLASSES
        model = RetinalDRNet()
        model.eval()
        with torch.no_grad():
            dummy = torch.randn(1, 3, 384, 384)
            logits = model(dummy)
        assert logits.shape == (1, NUM_CLASSES), (
            f"Expected (1, {NUM_CLASSES}), got {logits.shape}"
        )

    def test_batch_forward_pass(self):
        from backend.ai.classifier import RetinalDRNet, NUM_CLASSES
        model = RetinalDRNet()
        model.eval()
        with torch.no_grad():
            dummy = torch.randn(4, 3, 384, 384)
            logits = model(dummy)
        assert logits.shape == (4, NUM_CLASSES)

    def test_softmax_probabilities_sum_to_one(self):
        from backend.ai.classifier import RetinalDRNet, NUM_CLASSES
        import torch.nn.functional as F
        model = RetinalDRNet()
        model.eval()
        with torch.no_grad():
            dummy = torch.randn(1, 3, 384, 384)
            logits = model(dummy)
            probs = F.softmax(logits, dim=1)
        total = float(probs.sum().item())
        assert abs(total - 1.0) < 1e-5, f"Probabilities do not sum to 1: {total}"

    def test_target_layer_is_conv2d(self):
        from backend.ai.classifier import RetinalDRNet
        model = RetinalDRNet()
        target = model.get_target_layer()
        assert isinstance(target, torch.nn.Conv2d), (
            f"Expected Conv2d target layer, got {type(target)}"
        )

    def test_class_labels_count(self):
        from backend.ai.classifier import DR_CLASSES, DR_CLASS_SHORT, NUM_CLASSES
        assert len(DR_CLASSES) == NUM_CLASSES == 5
        assert len(DR_CLASS_SHORT) == 5

    def test_class_label_order(self):
        from backend.ai.classifier import DR_CLASS_SHORT
        expected_short = ["No DR", "Mild NPDR", "Moderate NPDR", "Severe NPDR", "Proliferative DR"]
        assert DR_CLASS_SHORT == expected_short


# ──────────────────────────────────────────────────────────────────────────────
# model_loader.py tests
# ──────────────────────────────────────────────────────────────────────────────

class TestModelLoader:
    """Verify model_loader correctly enforces the no-fake-prediction contract."""

    def setup_method(self):
        """Reset singleton before each test."""
        from backend.ai.model_loader import unload_model
        unload_model()

    def test_model_unavailable_error_when_weights_absent(self, tmp_path):
        """load_dr_model() must raise ModelUnavailableError when dr_model.pth is missing."""
        from backend.ai.model_loader import load_dr_model, ModelUnavailableError, unload_model
        unload_model()
        # Patch MODEL_WEIGHTS_PATH to a guaranteed non-existent file
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", tmp_path / "nonexistent.pth"):
            with pytest.raises(ModelUnavailableError) as exc_info:
                load_dr_model(device="cpu")
        assert "dr_model.pth" in str(exc_info.value) or "not found" in str(exc_info.value).lower()

    def test_get_model_status_when_weights_absent(self, tmp_path):
        """get_model_status() must report weights_found=False and NOT raise."""
        from backend.ai.model_loader import get_model_status
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", tmp_path / "nonexistent.pth"):
            status = get_model_status()
        assert status["weights_found"] is False
        assert status["model_loaded"] is False
        assert "unavailable" in status["status"].lower()

    def test_load_valid_weights(self, tmp_path):
        """load_dr_model() must succeed when a valid state_dict is present."""
        from backend.ai.classifier import RetinalDRNet
        from backend.ai.model_loader import load_dr_model, unload_model

        # Create a temporary weights file with correct architecture
        model = RetinalDRNet()
        weights_path = tmp_path / "dr_model.pth"
        torch.save(model.state_dict(), weights_path)

        unload_model()
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", weights_path):
            loaded = load_dr_model(device="cpu")

        assert isinstance(loaded, RetinalDRNet)
        assert not loaded.training  # must be in eval() mode

    def test_load_checkpoint_wrapper_format(self, tmp_path):
        """load_dr_model() must accept checkpoints with 'model_state_dict' wrapper."""
        from backend.ai.classifier import RetinalDRNet
        from backend.ai.model_loader import load_dr_model, unload_model

        model = RetinalDRNet()
        weights_path = tmp_path / "dr_model.pth"
        # Save in checkpoint wrapper format (common when saving with optimizer)
        torch.save({"epoch": 10, "model_state_dict": model.state_dict()}, weights_path)

        unload_model()
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", weights_path):
            loaded = load_dr_model(device="cpu")

        assert isinstance(loaded, RetinalDRNet)

    def test_singleton_returns_same_instance(self, tmp_path):
        """load_dr_model() must return the same object on repeated calls."""
        from backend.ai.classifier import RetinalDRNet
        from backend.ai.model_loader import load_dr_model, unload_model

        model = RetinalDRNet()
        weights_path = tmp_path / "dr_model.pth"
        torch.save(model.state_dict(), weights_path)

        unload_model()
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", weights_path):
            m1 = load_dr_model(device="cpu")
            m2 = load_dr_model(device="cpu")
        assert m1 is m2

    def test_architecture_mismatch_raises(self, tmp_path):
        """load_dr_model() must raise if the checkpoint has incompatible keys."""
        from backend.ai.model_loader import load_dr_model, unload_model

        # A minimal bad state_dict (completely wrong keys)
        bad_state = {"wrong_key": torch.zeros(1)}
        weights_path = tmp_path / "dr_model.pth"
        torch.save(bad_state, weights_path)

        unload_model()
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", weights_path):
            with pytest.raises(RuntimeError):
                load_dr_model(device="cpu")


# ──────────────────────────────────────────────────────────────────────────────
# inference.py tests
# ──────────────────────────────────────────────────────────────────────────────

class TestPreprocessing:
    """Verify the image preprocessing pipeline produces well-formed tensors."""

    def test_output_shape(self):
        from backend.ai.inference import preprocess_fundus_image
        img_bgr = np.zeros((512, 512, 3), dtype=np.uint8)
        tensor = preprocess_fundus_image(img_bgr)
        assert tensor.shape == (1, 3, 384, 384)

    def test_output_dtype_is_float32(self):
        from backend.ai.inference import preprocess_fundus_image
        img_bgr = np.zeros((512, 512, 3), dtype=np.uint8)
        tensor = preprocess_fundus_image(img_bgr)
        assert tensor.dtype == torch.float32

    def test_normalised_range_from_real_image(self):
        """Normalised tensor values should be in a reasonable range (not raw 0-255)."""
        from backend.ai.inference import preprocess_fundus_image
        img_path = DEMO_DIR / "sample_OD_normal.jpg"
        img_bgr = cv2.imread(str(img_path))
        assert img_bgr is not None, "Demo image missing"
        tensor = preprocess_fundus_image(img_bgr)
        # After ImageNet normalisation, most values lie in roughly [-3, 3]
        assert tensor.min().item() > -5.0
        assert tensor.max().item() < 5.0
        # And clearly NOT raw pixel scale [0, 255]
        assert tensor.max().item() < 10.0

    def test_custom_target_size(self):
        from backend.ai.inference import preprocess_fundus_image
        img_bgr = np.zeros((300, 300, 3), dtype=np.uint8)
        tensor = preprocess_fundus_image(img_bgr, target_size=(224, 224))
        assert tensor.shape == (1, 3, 224, 224)


class TestRunInference:
    """Verify run_inference() returns model_unavailable status, not a crash."""

    def setup_method(self):
        from backend.ai.model_loader import unload_model
        unload_model()

    def test_returns_model_unavailable_when_weights_absent(self, tmp_path):
        from backend.ai.inference import run_inference
        img_path = DEMO_DIR / "sample_OD_normal.jpg"
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", tmp_path / "nonexistent.pth"):
            result = run_inference(img_path.read_bytes())
        assert result["status"] == "model_unavailable"
        assert "weights_path" in result
        assert "message" in result

    def test_no_fake_prediction_in_unavailable_result(self, tmp_path):
        """When model is absent, there must be NO predicted_class or confidence key."""
        from backend.ai.inference import run_inference
        img_path = DEMO_DIR / "sample_OD_normal.jpg"
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", tmp_path / "nonexistent.pth"):
            result = run_inference(img_path.read_bytes())
        assert "predicted_class" not in result
        assert "confidence" not in result
        assert "class_probabilities" not in result

    def test_image_decode_error_returns_structured_response(self, tmp_path):
        """Corrupted bytes after model is loaded must return image_error, not crash."""
        from backend.ai.classifier import RetinalDRNet
        from backend.ai.inference import run_inference
        from backend.ai.model_loader import unload_model

        model = RetinalDRNet()
        weights_path = tmp_path / "dr_model.pth"
        torch.save(model.state_dict(), weights_path)

        unload_model()
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", weights_path):
            result = run_inference(b"NOT_A_REAL_IMAGE")
        assert result["status"] == "image_error"
        assert "message" in result

    def test_successful_inference_structure(self, tmp_path):
        """End-to-end inference on a real image with valid (random-init) weights."""
        from backend.ai.classifier import RetinalDRNet, NUM_CLASSES
        from backend.ai.inference import run_inference
        from backend.ai.model_loader import unload_model

        model = RetinalDRNet()
        weights_path = tmp_path / "dr_model.pth"
        torch.save(model.state_dict(), weights_path)

        img_path = DEMO_DIR / "sample_OD_normal.jpg"

        unload_model()
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", weights_path):
            result = run_inference(img_path.read_bytes())

        assert result["status"] == "ok"
        # Predicted class must be a valid ICDR class index
        assert result["predicted_class_id"] in range(NUM_CLASSES)
        # Confidence must be a real probability, not fabricated
        assert 0.0 < result["confidence"] <= 1.0
        # All 5 classes must appear in probabilities
        assert len(result["class_probabilities"]) == NUM_CLASSES
        # Probabilities must sum to 1
        total = sum(result["class_probabilities"].values())
        assert abs(total - 1.0) < 1e-4, f"Probabilities do not sum to 1: {total}"
        # Referral fields must be present
        assert "referral_recommendation" in result
        assert isinstance(result["requires_referral"], bool)

    def test_inference_from_file_path(self, tmp_path):
        """run_inference() must accept a Path object as well as bytes."""
        from backend.ai.classifier import RetinalDRNet
        from backend.ai.inference import run_inference
        from backend.ai.model_loader import unload_model

        model = RetinalDRNet()
        weights_path = tmp_path / "dr_model.pth"
        torch.save(model.state_dict(), weights_path)

        img_path = DEMO_DIR / "sample_OD_normal.jpg"

        unload_model()
        with patch("backend.ai.model_loader.MODEL_WEIGHTS_PATH", weights_path):
            result = run_inference(img_path)   # Path object

        assert result["status"] == "ok"
