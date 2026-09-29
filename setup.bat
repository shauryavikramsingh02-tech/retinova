@echo off
echo ===================================================
echo   RetinaCare - Setup Script (Smart India Hackathon)
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python 3.10+ and re-run.
    pause
    exit /b %errorlevel%
)

echo [2/3] Installing dependencies from requirements.txt...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b %errorlevel%
)

echo [3/3] Creating directory structure...
if not exist "data\uploads" mkdir "data\uploads"
if not exist "data\processed" mkdir "data\processed"
if not exist "data\demo" mkdir "data\demo"
if not exist "models" mkdir "models"
if not exist "reports" mkdir "reports"

echo.
echo ===================================================
echo   Setup completed successfully!
echo   Run 'run.bat' to start the RetinaCare server.
echo ===================================================
pause
