import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure RetinaCare project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database import engine, Base, SessionLocal, UPLOADS_DIR, DEMO_DIR, PROCESSED_DIR
from backend.models import Patient, Screening, User, UserSession
from backend.auth_utils import init_default_users
from backend.api.patients import router as patients_router
from backend.api.screenings import router as screenings_router
from backend.api.health import router as health_router
from backend.api.auth import router as auth_router

# Initialize SQLite tables
Base.metadata.create_all(bind=engine)

# Seed default demo accounts (admin, doctor, patient)
db = SessionLocal()
try:
    init_default_users(db)
finally:
    db.close()

app = FastAPI(
    title="RetinaCare - AI Retinal Screening System",
    description=(
        "Local retinal screening platform designed for Smart India Hackathon (SIH PS 26038). "
        "Provides 100% offline, local-first patient registry, bilateral fundus image ingestion, "
        "OpenCV-powered image quality assurance, PyTorch Grad-CAM explainability, and multi-portal role-based access control."
    ),
    version="1.2.0",
)

# CORS configuration for localhost browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints under /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(patients_router, prefix="/api")
app.include_router(screenings_router, prefix="/api")

# Static files directories
FRONTEND_DIR = PROJECT_ROOT / "frontend"
CSS_DIR = FRONTEND_DIR / "css"
JS_DIR = FRONTEND_DIR / "js"
PAGES_DIR = FRONTEND_DIR / "pages"

# Mount static asset endpoints
if UPLOADS_DIR.exists():
    app.mount("/data/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
if PROCESSED_DIR.exists():
    app.mount("/data/processed", StaticFiles(directory=str(PROCESSED_DIR)), name="processed")
if DEMO_DIR.exists():
    app.mount("/data/demo", StaticFiles(directory=str(DEMO_DIR)), name="demo")
if CSS_DIR.exists():
    app.mount("/css", StaticFiles(directory=str(CSS_DIR)), name="css")
if JS_DIR.exists():
    app.mount("/js", StaticFiles(directory=str(JS_DIR)), name="js")
if PAGES_DIR.exists():
    app.mount("/pages", StaticFiles(directory=str(PAGES_DIR)), name="pages")

# Direct friendly routes for login portals
@app.get("/login", include_in_schema=False)
@app.get("/login/", include_in_schema=False)
async def serve_login_hub():
    path = PAGES_DIR / "login.html"
    if path.exists():
        return FileResponse(str(path))
    return FileResponse(str(FRONTEND_DIR / "index.html"))

@app.get("/login/admin", include_in_schema=False)
async def serve_admin_login():
    path = PAGES_DIR / "login-admin.html"
    return FileResponse(str(path)) if path.exists() else FileResponse(str(PAGES_DIR / "login.html"))

@app.get("/login/doctor", include_in_schema=False)
async def serve_doctor_login():
    path = PAGES_DIR / "login-doctor.html"
    return FileResponse(str(path)) if path.exists() else FileResponse(str(PAGES_DIR / "login.html"))

@app.get("/login/patient", include_in_schema=False)
async def serve_patient_login():
    path = PAGES_DIR / "login-patient.html"
    return FileResponse(str(path)) if path.exists() else FileResponse(str(PAGES_DIR / "login.html"))

@app.get("/admin", include_in_schema=False)
async def serve_admin_console():
    path = PAGES_DIR / "admin.html"
    return FileResponse(str(path)) if path.exists() else FileResponse(str(FRONTEND_DIR / "index.html"))

@app.get("/patient-portal", include_in_schema=False)
async def serve_patient_portal():
    path = PAGES_DIR / "patient_portal.html"
    return FileResponse(str(path)) if path.exists() else FileResponse(str(FRONTEND_DIR / "index.html"))

# Frontend index entrypoint
@app.get("/", include_in_schema=False)
async def serve_index():
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "RetinaCare API is running. Frontend index.html not yet found."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
