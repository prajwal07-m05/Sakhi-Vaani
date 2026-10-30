@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ==============================================
echo   SAKHI VANI - setup (Windows)
echo ==============================================

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js 20 LTS or newer from https://nodejs.org and run setup.bat again.
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found. Reinstall Node.js with npm included.
  exit /b 1
)
for /f "tokens=1 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
echo Node.js major version: %NODE_MAJOR%
if %NODE_MAJOR% LSS 20 (
  echo [ERROR] Node.js 20 or newer is required.
  exit /b 1
)

echo.
echo [1/3] Installing root tools (tests)...
call npm install
if errorlevel 1 goto :fail

echo.
echo [2/3] Installing backend-api dependencies...
call npm --prefix backend-api install
if errorlevel 1 goto :fail

echo.
echo [3/3] Installing mobile-app dependencies...
call npm --prefix mobile-app install
if errorlevel 1 goto :fail

echo.
echo Creating local configuration (existing files are never overwritten)...
if exist "backend-api\.env" (
  echo   backend-api\.env already exists - kept as is.
) else (
  copy /Y ".env.example" "backend-api\.env" >nul
  echo   Created backend-api\.env from .env.example
)
if exist "mobile-app\.env" (
  echo   mobile-app\.env already exists - kept as is.
) else (
  copy /Y "mobile-app\.env.example" "mobile-app\.env" >nul
  echo   Created mobile-app\.env - in-app demo backend by default
)

echo.
echo Setup complete. Next: run start-all.bat
echo Demo logins (synthetic): asha@demo.com / Asha@123   citizen@demo.com / Citizen@123
exit /b 0

:fail
echo.
echo [ERROR] Dependency installation failed. Check your internet connection and try again.
exit /b 1
