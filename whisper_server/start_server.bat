@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8

echo ==================================================
echo  Whisper Voice Server - SIH 4.0 Project
echo ==================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

echo [1/4] Setting up virtual environment...
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo [2/4] Installing packages...
call venv\Scripts\activate
pip install -r requirements.txt -q

echo.
echo [3/4] Checking Whisper model...
python download_model.py

echo.
echo [4/4] Starting Whisper Server on port 8765...
echo.
echo  Server ready! Keep this window open.
echo  Frontend will auto-connect to ws://localhost:8765/ws/voice
echo  Press Ctrl+C to stop
echo.
python main.py
pause
