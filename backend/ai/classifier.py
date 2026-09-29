"""
backend/ai/classifier.py
========================
RetinalDRNet — The canonical PyTorch convolutional neural network architecture
used for diabetic retinopathy (DR) grading on the 5-class ICDR scale.

ICDR Classification Scale
--------------------------
  0 = No Diabetic Retinopathy (No DR)
  1 = Mild Non-Proliferative DR (Mild NPDR)
  2 = Moderate Non-Proliferative DR (Moderate NPDR)
  3 = Severe Non-Proliferative DR (Severe NPDR)
  4 = Proliferative Diabetic Retinopathy (PDR)

Architecture Design
-------------------
The model uses a residual CNN backbone with:
  - A large-kernel stem layer to capture coarse vessel structure
  - Four stacked ResidualBlocks with progressive channel expansion (32→64→128→256→512)
  - Global Average Pooling (GAP) to produce a 512-d feature vector
  - Dropout for regularisation
  - A single Linear classifier head (512 → 5)

Grad-CAM Compatibility
-----------------------
`get_target_layer()` returns the final Conv2d layer (layer4.conv2) whose
feature maps are used for Grad-CAM activation mapping.  This layer is directly
accessible without monkey-patching and is registered with forward/backward hooks
in gradcam.py.

NOTE: This file defines ONLY the architecture.  Weight loading is handled by
model_loader.py.  Inference logic is in inference.py.
"""

from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F

# ──────────────────────────────────────────────────────────────────────────────
# Class labels
# ──────────────────────────────────────────────────────────────────────────────

DR_CLASSES: list[str] = [
    "No Diabetic Retinopathy (Class 0)",
    "Mild NPDR (Class 1)",
    "Moderate NPDR (Class 2)",
    "Severe NPDR (Class 3)",
    "Proliferative DR (Class 4)",
]

DR_CLASS_SHORT: list[str] = [
    "No DR",
    "Mild NPDR",
    "Moderate NPDR",
    "Severe NPDR",
    "Proliferative DR",
]

NUM_CLASSES: int = len(DR_CLASSES)

# Clinical severity thresholds for referral recommendations
REFERRAL_THRESHOLD_CLASS: int = 2  # Moderate NPDR and above → refer to ophthalmologist


# ──────────────────────────────────────────────────────────────────────────────
# Building blocks
# ──────────────────────────────────────────────────────────────────────────────

class ResidualBlock(nn.Module):
    """
    Pre-activation residual block with an optional projection shortcut.

    Matches the residual block convention used by ResNet variants:
      conv1 (3x3) -> BN -> ReLU -> conv2 (3x3) -> BN
      + identity / projection shortcut -> ReLU
    """

    def __init__(self, in_channels: int, out_channels: int, stride: int = 1) -> None:
        super().__init__()

        self.conv1 = nn.Conv2d(
            in_channels, out_channels, kernel_size=3,
            stride=stride, padding=1, bias=False
        )
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

        self.conv2 = nn.Conv2d(
            out_channels, out_channels, kernel_size=3,
            stride=1, padding=1, bias=False
        )
        self.bn2 = nn.BatchNorm2d(out_channels)

        # Projection shortcut: needed when spatial size or channel count changes
        if stride != 1 or in_channels != out_channels:
            self.shortcut: nn.Module = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels),
            )
        else:
            self.shortcut = nn.Identity()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        identity = self.shortcut(x)
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out = self.relu(out + identity)
        return out


# ──────────────────────────────────────────────────────────────────────────────
# Main model
# ──────────────────────────────────────────────────────────────────────────────

class RetinalDRNet(nn.Module):
    """
    RetinalDRNet -- 5-class DR severity classifier.

    Input:  (B, 3, 384, 384) -- RGB fundus photograph, normalised with
            ImageNet mean/std ([0.485,0.456,0.406] / [0.229,0.224,0.225]).
    Output: (B, 5)  raw logits (un-normalised).
            Pass through torch.softmax(dim=1) to obtain class probabilities.

    For inference, always call model.eval() and torch.no_grad() (handled by
    inference.py).  For Grad-CAM, call model.eval() WITHOUT no_grad() so that
    gradients can flow back through the target layer (handled by gradcam.py).
    """

    def __init__(self, num_classes: int = NUM_CLASSES) -> None:
        super().__init__()

        # -- Stem -------------------------------------------------------------
        # 7x7 conv with stride 2 -> MaxPool: 384 -> 96 feature maps
        self.stem = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1),   # 96x96
        )

        # -- Residual stages --------------------------------------------------
        self.layer1 = ResidualBlock(32, 64, stride=1)    # 96x96 -> 96x96
        self.layer2 = ResidualBlock(64, 128, stride=2)   # 96x96 -> 48x48
        self.layer3 = ResidualBlock(128, 256, stride=2)  # 48x48 -> 24x24
        # layer4 is the Grad-CAM target layer
        self.layer4 = ResidualBlock(256, 512, stride=2)  # 24x24 -> 12x12

        # -- Head -------------------------------------------------------------
        self.pool = nn.AdaptiveAvgPool2d((1, 1))   # -> 512-d feature vector
        self.dropout = nn.Dropout(p=0.4)
        self.fc = nn.Linear(512, num_classes)

        self._init_weights()

    # -- Weight initialisation ------------------------------------------------

    def _init_weights(self) -> None:
        """Kaiming He initialisation for Conv layers, constant init for BN."""
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1.0)
                nn.init.constant_(m.bias, 0.0)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, mean=0.0, std=0.01)
                nn.init.constant_(m.bias, 0.0)

    # -- Grad-CAM hook point --------------------------------------------------

    def get_target_layer(self) -> nn.Module:
        """
        Returns the final Conv2d used for Grad-CAM backpropagation.
        The GradCAMExplainer in gradcam.py registers its forward/backward hooks
        on this layer.
        """
        return self.layer4.conv2

    # -- Forward pass ---------------------------------------------------------

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, 3, H, W) normalised RGB tensor.
        Returns:
            logits: (B, num_classes) -- raw, un-normalised class scores.
        """
        x = self.stem(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)
        return self.fc(x)
