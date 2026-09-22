@echo off
setlocal

echo ================================================================
echo   STOPPING SIGHT-EXAM AI SERVICES (Ports 5000, 5173, 8765)
echo ================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(5000, 5173, 8765); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $pids) { Write-Host ('[STOPPING] Terminating PID ' + $procId + ' on port ' + $p); Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } } else { Write-Host ('[OK] Port ' + $p + ' is free.') } }"

echo.
echo ================================================================
echo  [SUCCESS] ALL SERVICES STOPPED.
echo ================================================================
echo.
pause
