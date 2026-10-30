@echo off
setlocal
cd /d "%~dp0backend-api"
if not exist "node_modules" (
  echo [ERROR] Backend dependencies are missing. Run setup.bat first.
  exit /b 1
)
echo Starting SAKHI VANI backend API on http://localhost:4000 ...
call npm run dev
