import os
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import numpy as np
import cv2
import torch
import torch.nn.functional as F

from backend.database import PROCESSED_DIR
from backend.ai.model import (
    get_loaded_model,
    DR_CLASSES,
    DR_CLASS_SHORT,
    RetinalDRClassifier
)

class GradCAMExplainer:
    """
    Gradient-weighted Class Activation Mapping (Grad-CAM) engine.
    Calculates exact gradients of the target class score with respect to
    the final convolutional layer's feature activations.
    """
    def __init__(self, model: RetinalDRClassifier, device: str = "cpu"):
        self.model = model
        self.device = torch.device(device)
        self.target_layer = model.get_target_layer()
        self.activations: Optional[torch.Tensor] = None
        self.gradients: Optional[torch.Tensor] = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, inp, output):
            self.activations = output
            # Register backward hook on the output tensor directly for reliable gradient capture
            output.register_hook(self._save_gradient)

        self.target_layer.register_forward_hook(forward_hook)

    def _save_gradient(self, grad: torch.Tensor):
        self.gradients = grad

    def preprocess_image(self, img_bgr: np.ndarray, target_size: Tuple[int, int] = (384, 384)) -> Tuple[torch.Tensor, np.ndarray]:
        """
        Preprocesses BGR image for PyTorch model input.
        Returns:
            tensor: shape (1, 3, H, W) normalized
            rgb_resized: shape (H, W, 3) for visualization
        """
        rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        rgb_resized = cv2.resize(rgb, target_size, interpolation=cv2.INTER_AREA)

        # Standard retinal/ImageNet normalization
        img_float = rgb_resized.astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        norm_img = (img_float - mean) / std

        # Convert to CHW tensor
        tensor = torch.from_numpy(norm_img.transpose(2, 0, 1)).unsqueeze(0).to(self.device)
        return tensor, rgb_resized

    def generate_gradcam(
        self,
        img_bgr: np.ndarray,
        target_class: Optional[int] = None
    ) -> Tuple[np.ndarray, int, float, Dict[str, float]]:
        """
        Performs forward pass, backpropagation, and computes Grad-CAM heatmap.
        Returns:
            cam_2d: 2D numpy array [0, 1] at target size
            pred_class: int predicted class
            confidence: float confidence
            class_probs: dict of probabilities across all 5 classes
        """
        self.model.eval()
        self.model.zero_grad()

        input_tensor, _ = self.preprocess_image(img_bgr)
        input_tensor.requires_grad_(True)

        # Forward pass
        logits = self.model(input_tensor)
        probs = F.softmax(logits, dim=1).squeeze(0)

        # Determine predicted class and confidence
        if target_class is None:
            target_class = int(torch.argmax(probs).item())
        confidence = float(probs[target_class].item())

        class_probs = {
            DR_CLASS_SHORT[i]: round(float(probs[i].item()), 4)
            for i in range(len(DR_CLASSES))
        }

        # Backward pass on the target class logit score
        score = logits[0, target_class]
        score.backward(retain_graph=True)

        # Extract captured activations and gradients
        if self.activations is None or self.gradients is None:
            raise RuntimeError("Grad-CAM hooks failed to capture activations or gradients.")

        # Compute channel-wise weights via global average pooling of gradients
        # gradients shape: (1, C, H, W)
        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)

        # Weighted combination of forward activation maps
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
        # Apply ReLU to retain only positive contributions toward target class
        cam = F.relu(cam)

        cam_np = cam.squeeze().cpu().detach().numpy()

        # Min-max normalization
        cam_min, cam_max = float(cam_np.min()), float(cam_np.max())
        if cam_max - cam_min > 1e-8:
            cam_normalized = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_normalized = np.zeros_like(cam_np)

        return cam_normalized, target_class, confidence, class_probs

def explain_and_save_retinal_image(
    image_bytes_or_path: Any,
    identifier: str,
    eye_side: str = "OS"
) -> Dict[str, Any]:
    """
    Comprehensive pipeline:
    1. Loads actual PyTorch retinal DR model
    2. Runs inference and extracts genuine Grad-CAM from model predictions
    3. Generates both the standalone Grad-CAM heatmap and the superimposed overlay
    4. Saves images locally to data/processed/
    5. Returns URLs and prediction statistics for the API
    """
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Read image
    if isinstance(image_bytes_or_path, (str, Path)):
        img_bgr = cv2.imread(str(image_bytes_or_path))
    else:
        np_arr = np.frombuffer(image_bytes_or_path, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise ValueError("Could not decode image for Grad-CAM explanation.")

    orig_h, orig_w = img_bgr.shape[:2]

    # 2. Load model and explainer
    model = get_loaded_model(device="cpu")
    explainer = GradCAMExplainer(model, device="cpu")

    # 3. Generate genuine Grad-CAM from actual prediction
    cam_2d, pred_class, confidence, class_probs = explainer.generate_gradcam(img_bgr)

    # 4. Resize Grad-CAM to match original image dimensions
    cam_resized = cv2.resize(cam_2d, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
    cam_uint8 = np.uint8(255 * cam_resized)

    # 5. Generate Colormapped Heatmap
    heatmap_bgr = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)

    # Detect circular FOV mask so heatmap does not bleed into outer camera border
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
    mask = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    heatmap_masked = cv2.bitwise_and(heatmap_bgr, heatmap_bgr, mask=mask)

    # 6. Generate Superimposed Overlay
    overlay_bgr = cv2.addWeighted(img_bgr, 0.58, heatmap_masked, 0.42, 0)

    # 7. Save files locally in data/processed/
    clean_id = str(identifier).replace("/", "_").replace("\\", "_")
    heatmap_filename = f"{clean_id}_{eye_side}_gradcam_heatmap.jpg"
    overlay_filename = f"{clean_id}_{eye_side}_gradcam_overlay.jpg"

    heatmap_disk_path = PROCESSED_DIR / heatmap_filename
    overlay_disk_path = PROCESSED_DIR / overlay_filename

    cv2.imwrite(str(heatmap_disk_path), heatmap_masked, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    cv2.imwrite(str(overlay_disk_path), overlay_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 95])

    return {
        "predicted_class_id": int(pred_class),
        "predicted_class_name": DR_CLASSES[pred_class],
        "predicted_class_short": DR_CLASS_SHORT[pred_class],
        "confidence": float(round(confidence, 4)),
        "confidence_percent": float(round(confidence * 100, 2)),
        "class_probabilities": class_probs,
        "heatmap_filename": heatmap_filename,
        "heatmap_path": str(heatmap_disk_path),
        "heatmap_url": f"/data/processed/{heatmap_filename}",
        "overlay_filename": overlay_filename,
        "overlay_path": str(overlay_disk_path),
        "overlay_url": f"/data/processed/{overlay_filename}",
        "gradcam_generated": True
    }
