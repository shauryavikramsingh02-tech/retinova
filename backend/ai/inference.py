"""
backend/ai/inference.py
=======================
End-to-end retinal fundus image inference pipeline.

Responsibilities
----------------
1. Preprocess a raw fundus photograph (bytes or file path) into the normalised
   tensor format expected by RetinalDRNet.
2. Load the model via model_loader.load_dr_model() — which raises
   ModelUnavailableError if dr_model.pth is absent.
3. Run a genuine forward pass to obtain un-normalised logits.
4. Convert logits to softmax probabilities.
5. Extract the predicted class index, long-form label, short label, raw
   confidence, and per-class probability breakdown.
6. Generate a clinical referral recommendation based on predicted severity.
7. Return a structured InferenceResult dataclass, or an InferenceUnavailableResult
   if the model weights are missing.

No values are hard-coded.  Every number in the output is computed directly from
the model's own forward pass on the submitted image.

Public API
----------
  run_inference(image_source, device="cpu") -> dict
      Accepts bytes or str/Path.  Returns a result dict (see _build_result_dict).

  preprocess_fundus_image(img_bgr, target_size=(384,384)) -> torch.Tensor
      Exposed for use by gradcam.py so preprocessing is consistent.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Tuple

import cv2
import numpy as np
import torch
import torch.nn.functional as F

from backend.ai.classifier import (
    DR_CLASSES,
    DR_CLASS_SHORT,
    NUM_CLASSES,
    REFERRAL_THRESHOLD_CLASS,
)
from backend.ai.model_loader import ModelUnavailableError, load_dr_model

logger = logging.getLogger("retinacare.ai.inference")

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

# ImageNet normalisation statistics — same as used during model training
_IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# Input resolution (must match training resolution)
INPUT_SIZE: Tuple[int, int] = (384, 384)   # (width, height)


# ──────────────────────────────────────────────────────────────────────────────
# Preprocessing
# ──────────────────────────────────────────────────────────────────────────────

def preprocess_fundus_image(
    img_bgr: np.ndarray,
    target_size: Tuple[int, int] = INPUT_SIZE,
) -> torch.Tensor:
    """
    Convert an OpenCV BGR image to a normalised PyTorch input tensor.

    Steps:
      1. BGR -> RGB colour space conversion
      2. Resize to target_size using area interpolation (avoids aliasing)
      3. Scale pixel values from [0, 255] to [0.0, 1.0]
      4. Subtract ImageNet channel mean and divide by std
      5. Transpose from HWC to CHW layout
      6. Add batch dimension: (1, C, H, W)

    Args:
        img_bgr:     OpenCV BGR ndarray, uint8, any resolution.
        target_size: (width, height) tuple.  Defaults to (384, 384).

    Returns:
        torch.Tensor of shape (1, 3, H, W), dtype float32.
    """
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    rgb_resized = cv2.resize(rgb, target_size, interpolation=cv2.INTER_AREA)

    img_f32 = rgb_resized.astype(np.float32) / 255.0
    img_norm = (img_f32 - _IMAGENET_MEAN) / _IMAGENET_STD

    # HWC -> CHW, add batch dimension
    tensor = torch.from_numpy(img_norm.transpose(2, 0, 1)).unsqueeze(0)
    return tensor   # float32 CPU tensor


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _load_image_bgr(image_source: Any) -> np.ndarray:
    """
    Decode a fundus image from bytes or a file path into an OpenCV BGR array.

    Args:
        image_source: bytes, str, or Path.

    Returns:
        BGR ndarray.

    Raises:
        ValueError: If the image cannot be decoded.
    """
    if isinstance(image_source, (str, Path)):
        img = cv2.imread(str(image_source), cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(f"Could not open image file: {image_source}")
        return img

    if isinstance(image_source, (bytes, bytearray)):
        arr = np.frombuffer(image_source, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(
                "Could not decode image bytes.  Ensure the file is a valid "
                "JPEG, PNG, or BMP fundus photograph."
            )
        return img

    raise TypeError(
        f"image_source must be bytes, str, or Path; got {type(image_source)}"
    )


def _build_referral_recommendation(predicted_class_id: int, confidence: float) -> str:
    """
    Generate a concise, evidence-based clinical referral recommendation.
    This text is based on predicted DR severity only — it is NOT medical advice.
    """
    severity_map = {
        0: (
            "No DR detected.  Continue annual diabetic eye screening.  "
            "Maintain HbA1c and blood pressure targets."
        ),
        1: (
            "Mild NPDR detected.  Optimise glycaemic and blood pressure control.  "
            "Repeat fundus photography in 12 months."
        ),
        2: (
            "Moderate NPDR detected.  Ophthalmology referral recommended within 3 months.  "
            "Urgent optimisation of systemic risk factors."
        ),
        3: (
            "Severe NPDR detected.  Urgent ophthalmology referral required within 4 weeks.  "
            "Risk of progression to proliferative disease is high."
        ),
        4: (
            "Proliferative DR detected.  URGENT ophthalmology referral — risk of severe "
            "vision loss.  Same-week specialist review strongly advised."
        ),
    }
    base = severity_map.get(predicted_class_id, "Consult an ophthalmologist.")
    conf_note = (
        f"  [Model confidence: {confidence * 100:.1f}% — "
        + ("high confidence result." if confidence >= 0.70
           else "moderate confidence — clinical correlation advised.")
        + "]"
    )
    return base + conf_note


# ──────────────────────────────────────────────────────────────────────────────
# Main inference function
# ──────────────────────────────────────────────────────────────────────────────

def run_inference(
    image_source: Any,
    device: str = "cpu",
) -> dict:
    """
    Run the full DR classification pipeline on a single fundus image.

    Behaviour when model is unavailable
    -------------------------------------
    If models/dr_model.pth does not exist, this function returns a structured
    "model_unavailable" dict instead of raising an exception.  This allows the
    API to return HTTP 200 with a clear status rather than HTTP 500, so the
    frontend can surface a helpful message to the operator.

    Args:
        image_source: Raw bytes, file path (str or Path) of the fundus image.
        device:       "cpu" or "cuda".  Defaults to "cpu".

    Returns:
        dict with the following keys:

        On success (model present and inference ran):
            status              "ok"
            predicted_class_id  int   (0–4)
            predicted_class     str   long label, e.g. "Moderate NPDR (Class 2)"
            predicted_class_short str short label, e.g. "Moderate NPDR"
            confidence          float softmax probability of top class (0–1)
            confidence_percent  float confidence * 100
            class_probabilities dict  {short_label: probability} for all 5 classes
            referral_recommendation str  clinical recommendation string
            requires_referral   bool  True if severity >= REFERRAL_THRESHOLD_CLASS

        On model unavailable (dr_model.pth not found):
            status              "model_unavailable"
            message             str   human-readable explanation
            weights_path        str   expected path for the weights file

        On image decode error:
            status              "image_error"
            message             str   description of the decoding failure

        On unexpected inference error:
            status              "inference_error"
            message             str   description
    """
    # ── 1. Load model (raises ModelUnavailableError if weights absent) ─────
    try:
        model = load_dr_model(device=device)
    except ModelUnavailableError as exc:
        logger.warning("Inference skipped — model unavailable: %s", exc)
        from backend.ai.model_loader import MODEL_WEIGHTS_PATH
        return {
            "status": "model_unavailable",
            "message": str(exc),
            "weights_path": str(MODEL_WEIGHTS_PATH),
        }

    # ── 2. Decode image ────────────────────────────────────────────────────
    try:
        img_bgr = _load_image_bgr(image_source)
    except (ValueError, TypeError) as exc:
        logger.error("Image decode error: %s", exc)
        return {
            "status": "image_error",
            "message": str(exc),
        }

    # ── 3. Preprocess ──────────────────────────────────────────────────────
    try:
        input_tensor = preprocess_fundus_image(img_bgr, target_size=INPUT_SIZE)
        input_tensor = input_tensor.to(torch.device(device))
    except Exception as exc:
        logger.error("Preprocessing failed: %s", exc)
        return {
            "status": "inference_error",
            "message": f"Image preprocessing failed: {exc}",
        }

    # ── 4. Forward pass (no gradient computation needed for plain inference) ─
    try:
        with torch.no_grad():
            logits = model(input_tensor)          # (1, NUM_CLASSES)
            probs  = F.softmax(logits, dim=1)     # (1, NUM_CLASSES)

        probs_np    = probs.squeeze(0).cpu().numpy()   # (NUM_CLASSES,)
        pred_idx    = int(np.argmax(probs_np))
        confidence  = float(probs_np[pred_idx])

        class_probabilities = {
            DR_CLASS_SHORT[i]: round(float(probs_np[i]), 6)
            for i in range(NUM_CLASSES)
        }

    except Exception as exc:
        logger.exception("Forward pass failed: %s", exc)
        return {
            "status": "inference_error",
            "message": f"Model forward pass failed: {exc}",
        }

    # ── 5. Build result ────────────────────────────────────────────────────
    requires_referral = pred_idx >= REFERRAL_THRESHOLD_CLASS

    result = {
        "status": "ok",
        "predicted_class_id":    pred_idx,
        "predicted_class":       DR_CLASSES[pred_idx],
        "predicted_class_short": DR_CLASS_SHORT[pred_idx],
        "confidence":            round(confidence, 6),
        "confidence_percent":    round(confidence * 100, 3),
        "class_probabilities":   class_probabilities,
        "referral_recommendation": _build_referral_recommendation(pred_idx, confidence),
        "requires_referral":     requires_referral,
    }

    logger.info(
        "Inference complete | predicted=%s | confidence=%.2f%%",
        DR_CLASS_SHORT[pred_idx],
        confidence * 100,
    )

    return result
