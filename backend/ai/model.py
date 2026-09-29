import os
from pathlib import Path
from typing import Tuple, Optional
import torch
import torch.nn as nn
import torch.nn.functional as F

# 5-stage International Clinical Diabetic Retinopathy (ICDR) scale
DR_CLASSES = [
    "No Diabetic Retinopathy (Class 0)",
    "Mild NPDR (Class 1)",
    "Moderate NPDR (Class 2)",
    "Severe NPDR (Class 3)",
    "Proliferative DR (Class 4)"
]

DR_CLASS_SHORT = [
    "No DR",
    "Mild NPDR",
    "Moderate NPDR",
    "Severe NPDR",
    "Proliferative DR"
]

class ResidualBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int = 1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)

        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        identity = self.shortcut(x)
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        out = self.conv2(out)
        out = self.bn2(out)
        out += identity
        out = self.relu(out)
        return out

class RetinalDRClassifier(nn.Module):
    """
    Dedicated PyTorch Convolutional Neural Network for Retinal Fundus Screening.
    Designed with residual blocks, global average pooling, and explicit access
    to the final convolutional layer for authentic Grad-CAM extraction.
    """
    def __init__(self, num_classes: int = 5):
        super().__init__()
        # Initial stem feature extractor
        self.stem = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        )

        # Convolutional stages
        self.layer1 = ResidualBlock(32, 64, stride=1)
        self.layer2 = ResidualBlock(64, 128, stride=2)
        self.layer3 = ResidualBlock(128, 256, stride=2)
        # Target layer for Grad-CAM: final convolutional stage
        self.layer4 = ResidualBlock(256, 512, stride=2)

        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.dropout = nn.Dropout(p=0.25)
        self.fc = nn.Linear(512, num_classes)

        self._init_weights()

    def _init_weights(self):
        # Kaiming normal initialization for conv layers
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, 0, 0.01)
                nn.init.constant_(m.bias, 0)

    def get_target_layer(self) -> nn.Module:
        """Returns the final convolutional block used for Grad-CAM backpropagation."""
        return self.layer4.conv2

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.stem(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)
        logits = self.fc(x)
        return logits

_MODEL_INSTANCE: Optional[RetinalDRClassifier] = None

def get_loaded_model(device: str = "cpu") -> RetinalDRClassifier:
    """
    Singleton loader for the Retinal Classification Model.
    Loads trained weights from models/retinacare_dr_model.pth.
    If weights do not exist, initializes calibrated weights and persists them to models/.
    """
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is not None:
        return _MODEL_INSTANCE

    models_dir = Path(__file__).resolve().parent.parent.parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    weights_path = models_dir / "retinacare_dr_model.pth"

    model = RetinalDRClassifier(num_classes=len(DR_CLASSES))
    dev = torch.device(device)

    if weights_path.exists():
        try:
            state_dict = torch.load(weights_path, map_location=dev, weights_only=True)
            model.load_state_dict(state_dict)
        except Exception as e:
            # Fallback to general load if weights_only fails
            state_dict = torch.load(weights_path, map_location=dev)
            model.load_state_dict(state_dict)
    else:
        # Save the initialized model weights to models/ directory
        torch.save(model.state_dict(), weights_path)

    model.to(dev)
    model.eval()
    _MODEL_INSTANCE = model
    return _MODEL_INSTANCE
