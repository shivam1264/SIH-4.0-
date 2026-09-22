# SIGHT-EXAM AI -- PowerShell Unified Server Stopper
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  STOPPING SIGHT-EXAM AI SERVICES (Ports 5000, 5173, 8765)" -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$ports = @(5000, 5173, 8765)
foreach ($p in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -gt 0) {
                Write-Host "[STOPPING] Terminating process PID $procId on port $p" -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "[OK] Port $p is already free." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] ALL SERVICES STOPPED." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
