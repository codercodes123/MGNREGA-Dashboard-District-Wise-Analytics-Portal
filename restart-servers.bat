@echo off
echo ========================================
echo  MGNREGA Dashboard - Server Restart
echo ========================================
echo.

REM Kill any running node processes
echo Stopping existing servers...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo   ^>^> Stopped existing Node.js processes
) else (
    echo   ^>^> No existing Node.js processes found
)
timeout /t 2 /nobreak >nul
echo.

REM Start Backend Server
echo Starting Backend Server...
cd /d "%~dp0server"
start "MGNREGA Backend" cmd /k "npm run dev"
echo   ^>^> Backend server starting on port 5000
timeout /t 3 /nobreak >nul
echo.

REM Start Frontend Client
echo Starting Frontend Client...
cd /d "%~dp0client"
start "MGNREGA Frontend" cmd /k "npm run dev"
echo   ^>^> Frontend client starting on port 5173
timeout /t 2 /nobreak >nul
echo.

echo ========================================
echo  Servers Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to open browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo Note: Keep both server windows open
echo Press Ctrl+C in server windows to stop
echo.
pause
