# SIGHT-EXAM AI -- PowerShell Unified Server Launcher
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  SIGHT-EXAM AI -- Full System Launch (All Services)" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Starting all 3 core services:" -ForegroundColor Yellow
Write-Host "    [1] Express Backend API    -> http://localhost:5000"
Write-Host "    [2] Whisper Voice Server   -> ws://localhost:8765/ws/voice"
Write-Host "    [3] React Vite Frontend    -> http://localhost:5173"
Write-Host ""

$rootDir = $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }

# Step 1: Check and free busy ports
Write-Host "[1/4] Checking existing port status (5000, 5173, 8765)..." -ForegroundColor Yellow
$ports = @(5000, 5173, 8765)
$busy = @()
foreach ($p in $ports) {
    if (Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue) { $busy += $p }
}
if ($busy.Count -gt 0) {
    $busyList = $busy -join ', '
    Write-Host "[INFO] Found existing process(es) on port(s): $busyList. Freeing ports..." -ForegroundColor Magenta
    foreach ($p in $busy) {
        $pids = (Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue) | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
    }
    Start-Sleep -Seconds 1
    Write-Host "[OK] Ports cleared." -ForegroundColor Green
} else {
    Write-Host "[OK] Ports 5000, 5173, 8765 are available." -ForegroundColor Green
}

# Step 2: Launch Backend
Write-Host ""
Write-Host "[2/4] Starting Express Backend API (Port 5000)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$rootDir\server`" && npm run dev"

# Step 3: Launch Whisper
Write-Host ""
Write-Host "[3/4] Starting Whisper Voice Server (Port 8765)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$rootDir\whisper_server`" && call start_server.bat"

# Step 4: Launch Frontend
Write-Host ""
Write-Host "[4/4] Starting React Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$rootDir`" && npm run dev"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] ALL SERVICES ARE STARTING IN SEPARATE WINDOWS!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Web Portal:         http://localhost:5173"
Write-Host "  REST API:           http://localhost:5000/api/health"
Write-Host "  Whisper WebSocket:  ws://localhost:8765/ws/voice"
Write-Host ""
Write-Host "  Demo Credentials:"
Write-Host "    - Admin:   admin@sightexamai.in / admin123"
Write-Host "    - Student: aryan@example.com    / student123"
Write-Host ""
Write-Host "  To stop all services at once, run: .\stop_servers.ps1"
Write-Host "================================================================"
