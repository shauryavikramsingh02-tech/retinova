import pytest
from pathlib import Path
from backend.ai.quality import analyze_image_quality

DEMO_DIR = Path(__file__).resolve().parent.parent / "data" / "demo"

def test_normal_fundus_quality():
    normal_img_path = DEMO_DIR / "sample_OD_normal.jpg"
    assert normal_img_path.exists(), "Sample normal image missing"
    
    result = analyze_image_quality(normal_img_path.read_bytes(), "sample_OD_normal.jpg")
    assert result["passed"] is True
    assert result["resolution_status"] == "Adequate"
    assert result["sharpness_status"] in ["Sharp", "Acceptable"]
    assert result["brightness_status"] == "Normal"
    assert result["retinal_mask_coverage"] > 30.0

def test_blurry_fundus_detection():
    blurry_img_path = DEMO_DIR / "sample_OD_blurry.jpg"
    assert blurry_img_path.exists(), "Sample blurry image missing"

    result = analyze_image_quality(blurry_img_path.read_bytes(), "sample_OD_blurry.jpg")
    assert result["passed"] is False
    assert result["sharpness_status"] == "Blurry"
    assert any("blur" in issue.lower() for issue in result["issues"])

def test_underexposed_fundus_detection():
    dark_img_path = DEMO_DIR / "sample_OS_underexposed.jpg"
    assert dark_img_path.exists(), "Sample dark image missing"

    result = analyze_image_quality(dark_img_path.read_bytes(), "sample_OS_underexposed.jpg")
    assert result["passed"] is False
    assert result["brightness_status"] == "Underexposed"
    assert any("underexposed" in issue.lower() or "dark" in issue.lower() for issue in result["issues"])

def test_corrupted_image_handling():
    corrupted_bytes = b"NOT_A_VALID_IMAGE_BYTES"
    result = analyze_image_quality(corrupted_bytes, "corrupt.jpg")
    assert result["passed"] is False
    assert result["resolution_status"] == "Unreadable Format"
