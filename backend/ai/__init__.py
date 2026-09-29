"""
RetinaCare AI & Computer Vision Package
========================================
Public surface exposed to the rest of the backend.

Module responsibilities
-----------------------
  quality.py       -- OpenCV retinal image quality assessment (FOV, blur, exposure, contrast)
  classifier.py    -- RetinalDRNet architecture definition + DR class labels
  model_loader.py  -- Safe weights loading from models/dr_model.pth; singleton cache
  inference.py     -- End-to-end inference pipeline (preprocessing + forward pass + results)
  gradcam.py       -- Grad-CAM explainability (authentic gradient backprop, heatmap, overlay)
  model.py         -- Legacy RetinalDRClassifier kept for backward compatibility
"""

# ── Quality Assessment ─────────────────────────────────────────────────────────
from backend.ai.quality import analyze_image_quality

# ── Architecture & Labels ──────────────────────────────────────────────────────
from backend.ai.classifier import (
    RetinalDRNet,
    DR_CLASSES,
    DR_CLASS_SHORT,
    NUM_CLASSES,
    REFERRAL_THRESHOLD_CLASS,
)

# ── Model Loading ──────────────────────────────────────────────────────────────
from backend.ai.model_loader import (
    load_dr_model,
    get_model_status,
    unload_model,
    ModelUnavailableError,
    MODEL_WEIGHTS_PATH,
)

# ── Inference ──────────────────────────────────────────────────────────────────
from backend.ai.inference import run_inference, preprocess_fundus_image

# ── Grad-CAM Explainability ────────────────────────────────────────────────────
from backend.ai.gradcam import GradCAMExplainer, explain_and_save_retinal_image

# ── Legacy compatibility (model.py still used by existing gradcam.py hooks) ────
from backend.ai.model import (
    get_loaded_model,
    RetinalDRClassifier,
)

__all__ = [
    # Quality
    "analyze_image_quality",
    # Architecture
    "RetinalDRNet",
    "DR_CLASSES",
    "DR_CLASS_SHORT",
    "NUM_CLASSES",
    "REFERRAL_THRESHOLD_CLASS",
    # Loader
    "load_dr_model",
    "get_model_status",
    "unload_model",
    "ModelUnavailableError",
    "MODEL_WEIGHTS_PATH",
    # Inference
    "run_inference",
    "preprocess_fundus_image",
    # Grad-CAM
    "GradCAMExplainer",
    "explain_and_save_retinal_image",
    # Legacy
    "get_loaded_model",
    "RetinalDRClassifier",
]
