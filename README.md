# retinova

> **RetinaCare AI (Retinova)**: A production-grade, full-stack Clinical AI Retinal Screening & Telemedicine web application designed to assist clinicians, ophthalmologists, and primary healthcare centers in performing bilateral (both eyes) fundus photography screening for Diabetic Retinopathy (DR), Diabetic Macular Edema (DME), and Glaucoma risk.

---

## 🌟 Key Features

### 1. Multi-Stage Clinical AI Diagnostic Wizard
- **Patient Demographic & Glycemic Intake**: Records clinical vitals, diabetes type, duration, latest HbA1c (%), insulin therapy, and visual acuity symptoms.
- **Bilateral Fundus Acquisition & Quality Check**: Side-by-side cards for OD (Right Eye) and OS (Left Eye) with instant synthetic fundus generation (Normal, Mild NPDR, Severe PDR) on HTML5 canvas and real-time optical quality verification (illumination, contrast, sharpness, FOV).
- **Interactive Multi-Stage AI Inference**: 4 sequential pipeline stages (CLAHE enhancement, vessel isolation, lesion detection, and bilateral symmetry calculation) with scanning laser animations and live diagnostic stream logs.
- **Bilateral Diagnostic Dashboard**: Individual eye ICDR DR stage (0-4), confidence score, DME risk level with foveal involvement, Optic Disc Cup-to-Disc Ratio (CDR) for glaucoma suspicion, and inter-ocular asymmetry index (0-100).
- **Interactive Retinal Visualizer**: Pan, zoom (up to 400%), center reticle crosshair, True Color, Green-Channel (vessel contrast), CLAHE enhancement, and Grad-CAM AI lesion activation heatmap overlays.

### 2. Telemedicine Specialist Directory
- Database of verified vitreoretinal surgeons and tertiary eye institutes across major Indian medical hubs (Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune).
- Real-time **Haversine Distance Calculator** measuring distance in km from clinic origin or GPS.
- One-click specialist referral appointment booking.

### 3. Population Health Reports & Audit Archive
- High-level clinical KPIs: Total Screenings, High Risk / PDR Cases, Average Bilateral Asymmetry Score, Referral Rate.
- Clinical severity breakdown badges and physical report archive table with 1-click **"Print Full PDF"** modal featuring patient vitals, diagnostic imagery, and clinician digital signature.

### 4. Admin Portal & RBAC Security
- Dedicated administration console accessible to authorized credentials (`shauryavikramsingh02@gmail.com`).
- 4 Sub-Tabs: All Patient Reports, Specialist Bookings Queue, Pre-register Patient Intake, and Cloud Firestore Security Rules Audit (`/screenings`, `/bookings`, `/users`).

---

## 🛠️ Tech Stack

- **Frontend**: React 19 SPA, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Python FastAPI, OpenCV 5.0, PyTorch 2.14, NumPy, Pydantic, Pillow
- **Database & Auth**: Firebase Auth (Google SSO / Email), Cloud Firestore, LocalStorage offline fallback
- **Design System**: Medical slate surfaces (`bg-slate-50`), deep navy typography (`text-slate-900`), and precision clinical teal accents (`teal-600`/`teal-700`)
- **Typography**: "Plus Jakarta Sans" for clinical UI, "JetBrains Mono" for medical metrics and IDs

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install Python backend dependencies
pip install fastapi uvicorn opencv-python torch numpy pillow pydantic
```

### 2. Run the Platform

#### Start the Python FastAPI Engine:
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API Swagger documentation is accessible at `http://localhost:8000/docs`.

#### Start the React Frontend:
```bash
npm run dev -- --port 3000
```
Open `http://localhost:3000` in your browser.

---

## 🔒 Security & Compliance
- **Regulatory Notice**: CDSCO Class B / FDA 510(k) aligned clinical decision support system.
- **Security Rules**: [`firestore.rules`](./firestore.rules) implements default-deny and role-based access control (RBAC).

---

## 📄 License
UNLICENSED — All rights reserved.
