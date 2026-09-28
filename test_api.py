import urllib.request
import json
import numpy as np
import cv2
import base64

def test_endpoint(url, method='GET', data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        data_bytes = json.dumps(data).encode('utf-8')
    else:
        data_bytes = None
    with urllib.request.urlopen(req, data=data_bytes) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("--- 1. Health Check ---")
health = test_endpoint('http://localhost:8000/api/health')
print("Status:", health['status'], "| Engine:", health['inference_engine'])

print("\n--- 2. Indian Specialists Directory & Haversine Distance ---")
# Reference: New Delhi (AIIMS)
doctors = test_endpoint('http://localhost:8000/api/doctors?lat=28.5672&lng=77.2100')
print(f"Loaded {len(doctors)} specialists.")
for d in doctors[:3]:
    print(f"- {d['name']} ({d['hospital']}, {d['city']}): {d['distance_km']} km away | Fee: INR {d['consultation_fee']}")

print("\n--- 3. Testing Retinal Image Analysis Endpoint ---")
# Create a test synthetic fundus circle with simulated microaneurysms
img = np.zeros((512, 512, 3), dtype=np.uint8)
cv2.circle(img, (256, 256), 230, (20, 60, 180), -1) # Retina background
cv2.circle(img, (160, 256), 35, (180, 240, 255), -1) # Optic disc
cv2.circle(img, (320, 256), 25, (10, 30, 90), -1) # Macula

_, buffer = cv2.imencode('.jpg', img)
b64_img = 'data:image/jpeg;base64,' + base64.b64encode(buffer).decode('utf-8')

analysis = test_endpoint('http://localhost:8000/api/analyze-retina', method='POST', data={
    'image_base64': b64_img,
    'eye': 'OD',
    'preset': 'moderate'
})
print("Eye:", analysis['eye'])
print("ICDR Grade:", analysis['dr_grade'], f"(Stage {analysis['dr_stage']})")
print("Confidence:", analysis['confidence'], "%")
print("DME Risk:", analysis['dme_risk'], "| Foveal:", analysis['foveal_involvement'])
print("Optic Cup-to-Disc Ratio (CDR):", analysis['cdr_ratio'], f"({analysis['glaucoma_risk']})")
print("Quality Score:", analysis['quality']['overall_score'], "% (Passed:", analysis['quality']['is_adequate'], ")")
print("Lesions detected:", len(analysis['lesions_detected']))

print("\n--- 4. Booking & Referral Triage ---")
booking = test_endpoint('http://localhost:8000/api/bookings', method='POST', data={
    'patient_name': 'Kavita Sundaram',
    'patient_phone': '+91 98401 22334',
    'patient_age': 54,
    'doctor_id': doctors[0]['id'],
    'doctor_name': doctors[0]['name'],
    'hospital': doctors[0]['hospital'],
    'preferred_date': '2026-10-04',
    'preferred_time': '11:30 AM',
    'triage_level': 'URGENT',
    'dr_stage_summary': 'Moderate NPDR with macular lipid exudates',
    'notes': 'OCT scan and vitrectomy consultation referral'
})
print("Booking created:", booking['booking_id'], "| Status:", booking['booking']['status'])

print("\n=== ALL INTEGRATION CHECKS PASSED ===")
