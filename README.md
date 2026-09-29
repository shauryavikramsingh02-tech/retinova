# RetinaCare - Local AI Retinal Screening System
### Smart India Hackathon (SIH) | Problem Statement 26038

RetinaCare is a **100% local, offline-first tele-ophthalmology screening platform** designed for rural and point-of-care retinal examinations. It eliminates all cloud dependencies, stores data securely in a local SQLite database, performs real-time computer vision image quality assurance via OpenCV, and is prepared for local PyTorch deep learning inference and Grad-CAM explainability.

---

## Key Features & Foundation Capabilities

1. **Local-First Architecture**:
   - Zero dependence on cloud APIs or external AI studios.
   - Runs directly on your Windows laptop on `http://localhost:8000`.
   - Primary database is **SQLite** (`data/retinacare.db`), auto-initialized upon startup.

2. **Patient Registry & Demographics**:
   - Systematic patient registration with clinical identifiers (e.g., `RC-2026-0001`).
   - Detailed diabetic profile tracking (Diabetes Type, Duration in years, Systemic Hypertension, and Ocular/Medical History).
   - Fast, keyword-based search by patient name, phone, or ID.

3. **Bilateral Fundus Photography Ingestion**:
   - Drag-and-drop or file upload for both **Left Eye (OS - Oculus Sinister)** and **Right Eye (OD - Oculus Dexter)**.
   - Client-side live preview and resolution check.
   - Dedicated **"Load Demo Fundus Images"** button for immediate, 1-click evaluation using anatomically accurate synthetic fundus images.
   - Automated local filesystem storage in `data/uploads/`.

4. **Rigorous OpenCV Image-Quality Gate**:
   - **Sharpness / Blur Detection**: Laplacian variance on segmented retinal tissue to catch motion blur and optical diopter defocus.
   - **Illumination & Glare Analysis**: Mean luminance in the green channel (optimal for retinal vasculature) with saturation glare detection.
   - **Contrast Evaluation**: Standard deviation analysis of retinal tissue to verify lesion visibility.
   - **Retinal FOV Segmentation**: Automatic morphological segmentation of the circular fundus camera aperture.
   - **Actionable Technician Feedback**: Clear guidance on how to adjust diopter focus, flash intensity, or patient positioning.

5. **Medical Integrity**:
   - **No fabricated predictions, accuracy, or false metrics.**
   - Screenings clearly indicate that images satisfy the optical quality gate, and the system is ready for Phase 2 local model weights.

---

## Directory Structure

```
RetinaCare/
    backend/
        main.py                  # FastAPI application entrypoint & static route mounting
        database.py              # SQLite engine, sessionmaker, and directory anchors
        models.py                # SQLAlchemy ORM models (Patients, Screenings)
        schemas.py               # Pydantic v2 data validation schemas
        generate_demo_data.py    # Synthetic fundus generator for testing
        api/
            __init__.py
            patients.py          # Patient CRUD & search endpoints
            screenings.py        # Bilateral image upload, quality gate & screening endpoints
            health.py            # Local health diagnostics and dashboard metrics
        ai/
            __init__.py
            quality.py           # OpenCV computer vision quality analyzer
    frontend/
        index.html               # Main Clinician Dashboard
        pages/
            patients.html        # Patient Directory & Registration Modal
            new_screening.html   # New Screening & Bilateral Fundus Ingestion
            screenings.html      # Screenings Log & Archive
            screening_detail.html# Comprehensive Inspection Report & OpenCV Quality Metrics
        css/
            styles.css           # Premium ophthalmic design system (Vanilla CSS)
        js/
            api.js               # Unified API client & notification manager
            dashboard.js         # Dashboard statistics & activity feed
            patients.js          # Patient search and registration controller
            new_screening.js     # Screening submission, dropzone & sample loader
            screenings.js        # Screenings archive & filter controller
            screening_detail.js  # Bilateral comparison and quality metrics renderer
    data/
        uploads/                 # Local directory for uploaded fundus images
        processed/               # Directory for processed / normalized images
        demo/                    # Sample synthetic fundus images for immediate testing
    models/                      # Directory reserved for Phase 2 local PyTorch model weights
    reports/                     # Directory reserved for PDF reports (ReportLab)
    tests/
        __init__.py
        test_api.py              # Automated integration tests for all API endpoints
        test_quality.py          # Automated unit tests for OpenCV quality algorithms
    requirements.txt             # Python dependencies
    README.md                    # Project documentation
    run.bat                      # Windows 1-click execution script
    setup.bat                    # Windows 1-click dependency & folder setup script
```

---

## Quick Start on Windows

### 1. Automated Setup (One-Click)
Run `setup.bat` by double-clicking it or in PowerShell:
```cmd
.\setup.bat
```
This checks Python 3.10+, installs all required dependencies from `requirements.txt`, and verifies directory structure.

### 2. Run the Application
Run `run.bat` by double-clicking it or executing:
```cmd
.\run.bat
```
The server will start on `http://127.0.0.1:8000` and automatically launch your default browser to the **RetinaCare Dashboard**.

Alternatively, run manually via command prompt:
```cmd
cd RetinaCare
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## Testing the Foundation Pipeline

You can run the full automated test suite anytime:
```cmd
python -m pytest tests/
```

### Manual Walkthrough:
1. Open `http://localhost:8000`.
2. Click **Patient Registry** &rarr; click **Register New Patient**. Fill in patient details (e.g. Ramesh Kumar, 58y, Type 2 Diabetes).
3. Click **Start Screening** (or `+ New Screening` next to the patient).
4. Select the patient from the dropdown.
5. Click **"Load Demo Fundus Images"** to instantly load test samples for both Left (OS) and Right (OD) eyes.
6. Click **"Live Quality Pre-Check"** to see instant OpenCV metrics before submission.
7. Click **"Submit Screening & Run Quality Gate"**.
8. View the **Screening Session Report** with bilateral side-by-side fundus views, Laplacian sharpness scores, exposure evaluation, contrast analysis, and technician recommendations!

---

## Technology Stack

- **Backend**: Python 3.13, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2
- **Database**: SQLite (Local, zero-configuration)
- **Computer Vision**: OpenCV (`cv2`), NumPy, Pillow
- **AI Runtime**: PyTorch (Local inference ready)
- **Reports**: ReportLab
- **Frontend**: Semantic HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+)
