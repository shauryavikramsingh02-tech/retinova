"""
backend/ai/model_loader.py
==========================
Responsible for safely loading model weights from  models/dr_model.pth  into
the RetinalDRNet architecture defined in classifier.py.

Strict rules enforced here
---------------------------
1. If  models/dr_model.pth  does NOT exist, this module does NOT guess,
   initialise random weights, or generate any prediction.  It raises
   ModelUnavailableError so callers can surface a clear "model unavailable"
   response to the user instead of a fabricated result.

2. Weight loading uses  weights_only=True  (PyTorch >= 2.0) to prevent
   arbitrary code execution from untrusted checkpoint files.

3. The loaded model is cached as a process-level singleton (one load per
   server start) using a threading.Lock to prevent race conditions under
   concurrent HTTP requests.

4. If the checkpoint contains a top-level "model_state_dict" key (common when
   saving with optimizer state), only that sub-dict is extracted.  Otherwise
   the entire checkpoint is treated as a raw state_dict.

Public API
----------
  load_dr_model(device="cpu") -> RetinalDRNet
      Returns a ready, eval-mode model.  Raises ModelUnavailableError if the
      weights file is missing.

  get_model_status() -> dict
      Returns a status dict suitable for the /api/health endpoint without
      actually loading the model.

  unload_model()
      Clears the singleton cache (used in tests).
"""

from __future__ import annotations

import logging
import threading
from pathlib import Path
from typing import Optional

import torch

from backend.ai.classifier import RetinalDRNet, NUM_CLASSES

logger = logging.getLogger("retinacare.ai.model_loader")

# Canonical path where the real trained weights must be placed
_MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MODEL_WEIGHTS_PATH: Path = _MODELS_DIR / "dr_model.pth"

# ──────────────────────────────────────────────────────────────────────────────
# Custom exception
# ──────────────────────────────────────────────────────────────────────────────

class ModelUnavailableError(RuntimeError):
    """
    Raised when  models/dr_model.pth  does not exist.

    This is a deliberate design constraint: no weights file means no
    predictions.  The API surfaces this as HTTP 503 with a clear message
    instructing the operator to place the trained weights at the expected path.
    """
    pass


# ──────────────────────────────────────────────────────────────────────────────
# Singleton cache
# ──────────────────────────────────────────────────────────────────────────────

_lock = threading.Lock()
_cached_model: Optional[RetinalDRNet] = None
_cached_device: Optional[str] = None


def load_dr_model(device: str = "cpu") -> RetinalDRNet:
    """
    Load and return the RetinalDRNet model with trained weights from
    models/dr_model.pth.

    The model is cached after first load so subsequent calls are instant.
    Thread-safe via a module-level lock.

    Args:
        device: "cpu" or "cuda" (defaults to CPU for local laptop use).

    Returns:
        RetinalDRNet instance in eval() mode on the requested device.

    Raises:
        ModelUnavailableError: If models/dr_model.pth is not present.
        RuntimeError:          If the checkpoint is corrupt or architecture
                               mismatch prevents loading.
    """
    global _cached_model, _cached_device

    # Fast path: already loaded on the same device
    if _cached_model is not None and _cached_device == device:
        return _cached_model

    with _lock:
        # Double-checked locking
        if _cached_model is not None and _cached_device == device:
            return _cached_model

        if not MODEL_WEIGHTS_PATH.exists():
            raise ModelUnavailableError(
                f"Trained model weights not found at: {MODEL_WEIGHTS_PATH}\n"
                "To enable AI inference, place your trained 'dr_model.pth' file in the "
                "'models/' directory.  See README.md for instructions on obtaining or "
                "training the model."
            )

        logger.info("Loading DR model weights from: %s", MODEL_WEIGHTS_PATH)

        dev = torch.device(device)
        model = RetinalDRNet(num_classes=NUM_CLASSES)

        try:
            checkpoint = torch.load(
                MODEL_WEIGHTS_PATH,
                map_location=dev,
                weights_only=True,     # Safe loading — prevents arbitrary code execution
            )
        except TypeError:
            # PyTorch < 2.0 does not support weights_only
            checkpoint = torch.load(MODEL_WEIGHTS_PATH, map_location=dev)

        # Accept both raw state_dicts and checkpoint dicts that wrap "model_state_dict"
        if isinstance(checkpoint, dict):
            if "model_state_dict" in checkpoint:
                state_dict = checkpoint["model_state_dict"]
                logger.info(
                    "Loaded checkpoint wrapper — extracting 'model_state_dict'. "
                    "Epoch: %s", checkpoint.get("epoch", "unknown")
                )
            elif "state_dict" in checkpoint:
                state_dict = checkpoint["state_dict"]
            else:
                state_dict = checkpoint   # Assume it IS the state_dict
        else:
            raise RuntimeError(
                f"Unexpected checkpoint type: {type(checkpoint)}.  "
                "Expected a dict (state_dict or checkpoint wrapper)."
            )

        # Strip DataParallel 'module.' prefix if present
        cleaned: dict = {}
        for k, v in state_dict.items():
            cleaned[k.replace("module.", "", 1)] = v

        missing, unexpected = model.load_state_dict(cleaned, strict=True)

        if missing:
            logger.warning("Missing keys in state_dict: %s", missing)
        if unexpected:
            logger.warning("Unexpected keys in state_dict: %s", unexpected)

        if missing or unexpected:
            raise RuntimeError(
                f"Architecture mismatch when loading dr_model.pth.\n"
                f"  Missing keys:    {missing}\n"
                f"  Unexpected keys: {unexpected}\n"
                "Ensure dr_model.pth was saved from a RetinalDRNet with the same "
                "architecture defined in backend/ai/classifier.py."
            )

        model.to(dev)
        model.eval()

        _cached_model = model
        _cached_device = device

        logger.info(
            "DR model loaded successfully on device='%s' | "
            "Parameters: %s M",
            device,
            round(sum(p.numel() for p in model.parameters()) / 1_000_000, 2),
        )

        return _cached_model


def get_model_status() -> dict:
    """
    Return a status dictionary for the health endpoint — does NOT attempt to
    load the model; just checks whether the weights file exists on disk.

    Returns:
        dict with keys:
            weights_path (str)   — absolute path checked
            weights_found (bool) — True if dr_model.pth exists
            model_loaded (bool)  — True if the singleton is already in memory
            status (str)         — human-readable label
    """
    found = MODEL_WEIGHTS_PATH.exists()
    loaded = _cached_model is not None
    if loaded:
        status_label = "Loaded and ready"
    elif found:
        status_label = "Weights present — will load on first inference request"
    else:
        status_label = (
            f"Model unavailable — place trained 'dr_model.pth' in {_MODELS_DIR}"
        )

    return {
        "weights_path": str(MODEL_WEIGHTS_PATH),
        "weights_found": found,
        "model_loaded": loaded,
        "status": status_label,
    }


def unload_model() -> None:
    """
    Clear the singleton cache.  Intended for use in tests that need a clean
    state, or when reloading after weights are replaced on disk.
    """
    global _cached_model, _cached_device
    with _lock:
        _cached_model = None
        _cached_device = None
    logger.info("DR model singleton cleared from cache.")
