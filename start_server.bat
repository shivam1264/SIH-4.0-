@echo off
setlocal

echo ================================================================
echo   SIGHT-EXAM AI -- Full System Launch (All Services)
echo ================================================================
echo.
echo   Starting all 3 core services:
echo     [1] Express Backend API    -^> http://localhost:5000
echo     [2] Whisper Voice Server   -^> ws://localhost:8765/ws/voice
echo     [3] React Vite Frontend    -^> http://localhost:5173
echo.
echo ================================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/4] Checking existing port status (5000, 5173, 8765)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(5000, 5173, 8765); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $pids) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } } }"

echo [OK] Ports verified.
echo.
echo [2/4] Starting Express Backend API (Port 5000)...
start "SIGHT-EXAM AI - Backend API [Port 5000]" cmd /k "cd /d "%ROOT_DIR%server" && npm run dev"

echo.
echo [3/4] Starting Whisper Voice Server (Port 8765)...
start "SIGHT-EXAM AI - Whisper Server [Port 8765]" cmd /k "cd /d "%ROOT_DIR%whisper_server" && call start_server.bat"

echo.
echo [4/4] Starting React Frontend (Port 5173)...
start "SIGHT-EXAM AI - Frontend [Port 5173]" cmd /k "cd /d "%ROOT_DIR%" && npm run dev"

echo.
echo ================================================================
echo  [SUCCESS] ALL SERVICES ARE STARTING IN SEPARATE WINDOWS!
echo ================================================================
echo.
echo   Web Portal:         http://localhost:5173
echo   REST API:           http://localhost:5000/api/health
echo   Whisper WebSocket:  ws://localhost:8765/ws/voice
echo.
echo   Demo Credentials:
echo      - Admin:   admin@sightexamai.in / admin123
echo      - Student: aryan@example.com    / student123
echo.
echo   To stop all services at once, run: .\stop_servers.bat
echo ================================================================
echo.
pause
