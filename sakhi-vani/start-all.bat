@echo off
setlocal
cd /d "%~dp0"
if not exist "backend-api\node_modules" (
  echo [ERROR] Run setup.bat first.
  exit /b 1
)
echo Opening backend and mobile client in separate windows...
start "SAKHI VANI - Backend API" cmd /k ""%~dp0start-backend.bat""
rem The mobile window is pointed at the local backend for this session only.
start "SAKHI VANI - Mobile client" cmd /k "set VITE_API_URL=http://localhost:4000&& cd /d ""%~dp0mobile-app"" && npm run dev"
echo.
echo Backend:  http://localhost:4000/api/health
echo App:      http://localhost:5173
echo Close the two windows to stop.
