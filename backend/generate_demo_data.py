import cv2
import numpy as np
from pathlib import Path

def create_synthetic_fundus(
    eye_side="OD",
    width=768,
    height=768,
    blur=False,
    dark=False,
    overexposed=False
):
    """
    Synthesize a realistic ocular fundus test image honoring retinal anatomy:
    - Circular FOV aperture
    - Choroidal/retinal orange-red background with radial shading
    - Optic disc (yellowish-cream) positioned nasally based on eye_side
    - Macula (avascular darker center) positioned temporally
    - Vascular arcades (superior and inferior branching vessels)
    """
    img = np.zeros((height, width, 3), dtype=np.uint8)
    center_x, center_y = width // 2, height // 2
    radius = int(min(width, height) * 0.44)

    # 1. Base retinal background color gradient
    y, x = np.ogrid[:height, :width]
    dist_from_center = np.sqrt((x - center_x)**2 + (y - center_y)**2)
    fov_mask = (dist_from_center <= radius).astype(np.uint8)

    # Radial falloff
    radial_norm = np.clip(dist_from_center / radius, 0, 1)

    # Base colors (BGR)
    # Deep retinal red-orange: B ~ 25, G ~ 75, R ~ 195
    base_b = np.clip(30 - (radial_norm * 18), 10, 255).astype(np.uint8)
    base_g = np.clip(85 - (radial_norm * 45), 20, 255).astype(np.uint8)
    base_r = np.clip(205 - (radial_norm * 85), 60, 255).astype(np.uint8)

    img[:, :, 0] = base_b
    img[:, :, 1] = base_g
    img[:, :, 2] = base_r

    # Add subtle choroidal texture
    noise = np.random.normal(0, 4, (height, width)).astype(np.int16)
    for c in range(3):
        channel = img[:, :, c].astype(np.int16) + noise
        img[:, :, c] = np.clip(channel, 0, 255).astype(np.uint8)

    # 2. Optic Disc (Nasal side: left for OD, right for OS)
    disc_offset_x = -int(radius * 0.42) if eye_side == "OD" else int(radius * 0.42)
    disc_x = center_x + disc_offset_x
    disc_y = center_y + int(radius * 0.05)
    disc_radius = int(radius * 0.16)

    # Draw optic disc (cream-yellowish-pink: B: 110, G: 190, R: 245)
    cv2.circle(img, (disc_x, disc_y), disc_radius, (100, 185, 245), -1)
    # Optic cup (central depression)
    cv2.circle(img, (disc_x, disc_y), int(disc_radius * 0.45), (140, 215, 255), -1)

    # 3. Macula / Fovea (Temporal to disc, slightly lower than center)
    macula_offset_x = int(radius * 0.22) if eye_side == "OD" else -int(radius * 0.22)
    macula_x = center_x + macula_offset_x
    macula_y = center_y + int(radius * 0.08)
    macula_radius = int(radius * 0.18)

    # Macula darker pigment (dark reddish-brown)
    macula_overlay = img.copy()
    cv2.circle(macula_overlay, (macula_x, macula_y), macula_radius, (15, 45, 130), -1)
    cv2.circle(macula_overlay, (macula_x, macula_y), int(macula_radius * 0.3), (8, 28, 90), -1) # Fovea centralis
    cv2.addWeighted(macula_overlay, 0.45, img, 0.55, 0, img)

    # 4. Retinal Blood Vessels (Branching arcades from optic disc)
    vessel_color = (15, 30, 115) # Dark crimson BGR

    # Superior & Inferior Temporal Arcades
    curves = [
        # Superior arcade
        [(disc_x, disc_y), (disc_x + int(disc_offset_x * -0.5), disc_y - int(radius * 0.45)),
         (center_x, disc_y - int(radius * 0.55)), (macula_x, disc_y - int(radius * 0.50))],
        # Inferior arcade
        [(disc_x, disc_y), (disc_x + int(disc_offset_x * -0.5), disc_y + int(radius * 0.45)),
         (center_x, disc_y + int(radius * 0.55)), (macula_x, disc_y + int(radius * 0.50))],
        # Nasal branches
        [(disc_x, disc_y), (disc_x + int(disc_offset_x * 0.5), disc_y - int(radius * 0.25)),
         (disc_x + int(disc_offset_x * 0.8), disc_y - int(radius * 0.35))],
        [(disc_x, disc_y), (disc_x + int(disc_offset_x * 0.5), disc_y + int(radius * 0.25)),
         (disc_x + int(disc_offset_x * 0.8), disc_y + int(radius * 0.35))],
    ]

    for curve in curves:
        pts = np.array(curve, np.int32).reshape((-1, 1, 2))
        cv2.polylines(img, [pts], isClosed=False, color=vessel_color, thickness=3, lineType=cv2.LINE_AA)
        # Branches and capillaries
        for i in range(len(curve) - 1):
            mid_x = (curve[i][0] + curve[i+1][0]) // 2
            mid_y = (curve[i][1] + curve[i+1][1]) // 2
            for _ in range(4):
                branch_end = (mid_x + np.random.randint(-45, 45), mid_y + np.random.randint(-55, 55))
                cv2.line(img, (mid_x, mid_y), branch_end, vessel_color, 1, lineType=cv2.LINE_AA)

    # 5. Apply circular FOV mask
    img[fov_mask == 0] = 0

    # 6. Apply condition modifications if requested
    if blur:
        img = cv2.GaussianBlur(img, (31, 31), 10.0)
    elif dark:
        img = (img.astype(np.float32) * 0.18).astype(np.uint8)
    else:
        # Add high-frequency microvascular texture for crisp focused retina
        fine_noise = np.random.normal(0, 10, (height, width)).astype(np.int16)
        for c in range(3):
            ch = img[:, :, c].astype(np.int16) + fine_noise
            img[:, :, c] = np.clip(ch, 0, 255).astype(np.uint8)
        img[fov_mask == 0] = 0

    return img

def generate_all_samples():
    demo_dir = Path(__file__).resolve().parent.parent / "data" / "demo"
    demo_dir.mkdir(parents=True, exist_ok=True)

    samples = {
        "sample_OD_normal.jpg": create_synthetic_fundus("OD", blur=False, dark=False),
        "sample_OS_normal.jpg": create_synthetic_fundus("OS", blur=False, dark=False),
        "sample_OD_blurry.jpg": create_synthetic_fundus("OD", blur=True, dark=False),
        "sample_OS_underexposed.jpg": create_synthetic_fundus("OS", blur=False, dark=True),
    }

    for name, img in samples.items():
        path = demo_dir / name
        cv2.imwrite(str(path), img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        print(f"Generated sample: {path}")

if __name__ == "__main__":
    generate_all_samples()
