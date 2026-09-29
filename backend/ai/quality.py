import logging
from typing import Dict, Any, Tuple
import numpy as np
import cv2

logger = logging.getLogger("retinacare.ai.quality")

def extract_retinal_mask(img_bgr: np.ndarray) -> Tuple[np.ndarray, float]:
    """
    Isolate the circular retinal Field of View (FOV) from the black background
    commonly produced by fundus cameras.
    Returns:
        mask: binary uint8 mask (255 inside retina, 0 background)
        coverage_percent: percentage of total pixels occupied by retina
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # Fundus images have a dark border (intensity < 15-20)
    # Apply Otsu or simple thresholding with morphological closing
    _, thresh = cv2.threshold(gray, 20, 255, cv2.THRESH_BINARY)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    mask = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    # Find the largest contour which represents the retinal aperture
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        clean_mask = np.zeros_like(mask)
        cv2.drawContours(clean_mask, [largest_contour], -1, 255, thickness=-1)
        retinal_pixels = np.count_nonzero(clean_mask)
        coverage_percent = round((retinal_pixels / (h * w)) * 100, 2)
        # If the contour occupies at least 20% of image, consider valid FOV
        if coverage_percent >= 20.0:
            return clean_mask, coverage_percent

    # Fallback to full image if no clear circular border is segmented
    full_mask = np.ones_like(gray, dtype=np.uint8) * 255
    return full_mask, 100.0


def analyze_image_quality(image_bytes: bytes, filename: str = "") -> Dict[str, Any]:
    """
    Rigorous OpenCV computer-vision quality assessment for retinal fundus photography.
    Evaluates:
      1. Resolution & dimensional suitability
      2. Retinal FOV detection
      3. Sharpness / Blur detection (variance of Laplacian on retinal tissue)
      4. Illumination / Brightness / Saturation
      5. Contrast & dynamic range
    """
    # Decode bytes to OpenCV BGR
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return {
            "passed": False,
            "sharpness_score": 0.0,
            "sharpness_status": "Invalid",
            "brightness_mean": 0.0,
            "brightness_status": "Invalid",
            "contrast_score": 0.0,
            "contrast_status": "Invalid",
            "resolution_width": 0,
            "resolution_height": 0,
            "resolution_status": "Unreadable Format",
            "retinal_mask_coverage": 0.0,
            "fov_detected": False,
            "issues": ["Could not decode image file. Unsupported format or corrupted file."],
            "recommendations": ["Upload a standard fundus image (JPEG, PNG, or TIFF)."]
        }

    h, w, _ = img_bgr.shape
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    green_channel = img_bgr[:, :, 1] # Retinal vessels show maximum contrast in green channel

    # 1. Retinal FOV Segmentation
    mask, coverage_percent = extract_retinal_mask(img_bgr)
    fov_detected = coverage_percent < 98.0 and coverage_percent >= 20.0
    retina_indices = np.where(mask > 0)

    # 2. Resolution check
    is_adequate_res = (w >= 512 and h >= 512)
    resolution_status = "Adequate" if is_adequate_res else "Low Resolution"

    # 3. Sharpness calculation (Laplacian variance)
    # We compute the Laplacian variance specifically within the retinal region
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    if len(retina_indices[0]) > 0:
        laplacian_retina = laplacian[retina_indices]
        sharpness_score = round(float(np.var(laplacian_retina)), 2)
    else:
        sharpness_score = round(float(laplacian.var()), 2)

    if sharpness_score >= 85.0:
        sharpness_status = "Sharp"
    elif sharpness_score >= 40.0:
        sharpness_status = "Acceptable"
    else:
        sharpness_status = "Blurry"

    # 4. Brightness / Illumination calculation (Green channel luminance in FOV)
    if len(retina_indices[0]) > 0:
        mean_brightness = round(float(np.mean(green_channel[retina_indices])), 2)
        # Check overexposed / glare percentage
        saturated_pixels = np.count_nonzero(green_channel[retina_indices] >= 248)
        saturation_pct = round((saturated_pixels / len(retina_indices[0])) * 100, 2)
    else:
        mean_brightness = round(float(np.mean(green_channel)), 2)
        saturated_pixels = np.count_nonzero(green_channel >= 248)
        saturation_pct = round((saturated_pixels / (h * w)) * 100, 2)

    if mean_brightness < 32.0:
        brightness_status = "Underexposed"
    elif mean_brightness > 200.0 or saturation_pct > 12.0:
        brightness_status = "Overexposed"
    else:
        brightness_status = "Normal"

    # 5. Contrast Calculation (Standard Deviation within retinal area)
    if len(retina_indices[0]) > 0:
        contrast_score = round(float(np.std(green_channel[retina_indices])), 2)
    else:
        contrast_score = round(float(np.std(green_channel)), 2)

    if contrast_score >= 38.0:
        contrast_status = "Good"
    elif contrast_score >= 18.0:
        contrast_status = "Moderate"
    else:
        contrast_status = "Low"

    # Compile Issues and Actionable Clinical Technician Recommendations
    issues = []
    recommendations = []

    if not is_adequate_res:
        issues.append(f"Image resolution ({w}x{h}) is below the recommended minimum of 512x512 pixels.")
        recommendations.append("Ensure fundus camera export resolution is set to at least 1024x1024.")

    if sharpness_status == "Blurry":
        issues.append(f"Motion blur or optical defocus detected (Sharpness Score: {sharpness_score:.1f}, below 40.0).")
        recommendations.append("Stabilize patient chin-rest and refocus the optical diopter dial before retaking.")

    if brightness_status == "Underexposed":
        issues.append(f"Image is underexposed / dark (Mean luminance: {mean_brightness:.1f}). Vascular details may be obscured.")
        recommendations.append("Increase camera flash illumination level or verify patient pupil dilation.")
    elif brightness_status == "Overexposed":
        issues.append(f"Image is overexposed or contains flash glare (Mean luminance: {mean_brightness:.1f}, Saturated: {saturation_pct}%).")
        recommendations.append("Reduce camera illumination intensity and ensure center alignment to avoid corneal reflections.")

    if contrast_status == "Low":
        issues.append(f"Low tissue contrast detected (Contrast Score: {contrast_score:.1f}). Retinal lesions may not be discernible.")
        recommendations.append("Check fundus camera optical lens for dust or smudge and verify adequate pupil alignment.")

    # Quality Gate Decision
    # Passed if not blurry, not severely under/overexposed, and adequate resolution
    passed = (sharpness_status != "Blurry" and brightness_status == "Normal" and is_adequate_res)

    if passed and not issues:
        recommendations.append("Image satisfies diagnostic quality gate requirements for AI screening.")

    return {
        "passed": bool(passed),
        "sharpness_score": float(sharpness_score),
        "sharpness_status": str(sharpness_status),
        "brightness_mean": float(mean_brightness),
        "brightness_status": str(brightness_status),
        "contrast_score": float(contrast_score),
        "contrast_status": str(contrast_status),
        "resolution_width": int(w),
        "resolution_height": int(h),
        "resolution_status": str(resolution_status),
        "retinal_mask_coverage": float(coverage_percent),
        "fov_detected": bool(fov_detected),
        "issues": list(issues),
        "recommendations": list(recommendations)
    }
