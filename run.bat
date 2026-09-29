@echo off
echo ===================================================
echo   Starting RetinaCare - Local AI Retinal Screening
echo   SIH Problem Statement 26038
echo ===================================================
echo.

cd /d "%~dp0"

echo Ensuring data directories exist...
if not exist "data\uploads" mkdir "data\uploads"
if not exist "data\processed" mkdir "data\processed"
if not exist "data\demo" mkdir "data\demo"
if not exist "models" mkdir "models"
if not exist "reports" mkdir "reports"

echo.
echo Server running at: http://localhost:8000
echo Opening browser in 2 seconds...
start "" "http://localhost:8000"

echo.
echo Press CTRL+C to stop the server.
echo.
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
