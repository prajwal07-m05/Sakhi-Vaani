@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ==============================================
echo   SAKHI VANI - environment check
echo ==============================================
set PROBLEMS=0

call :check node "Node.js - required, 20+" required
call :check npm "npm - required" required
call :check git "Git - needed to push to GitHub" optional
call :check java "Java JDK 17 - only for local Android builds" optional
call :check adb "Android adb - only for local Android builds" optional

if defined ANDROID_HOME (echo [OK]   ANDROID_HOME=%ANDROID_HOME%) else (echo [INFO] ANDROID_HOME not set - only needed for local Android builds)

echo.
echo Project configuration:
if exist "backend-api\.env" (echo [OK]   backend-api\.env) else (echo [WARN] backend-api\.env missing - run setup.bat & set PROBLEMS=1)
if exist "backend-api\node_modules" (echo [OK]   backend-api dependencies installed) else (echo [WARN] backend-api dependencies missing - run setup.bat & set PROBLEMS=1)
if exist "mobile-app\node_modules" (echo [OK]   mobile-app dependencies installed) else (echo [WARN] mobile-app dependencies missing - run setup.bat & set PROBLEMS=1)
if exist "node_modules" (echo [OK]   root test tools installed) else (echo [WARN] root test tools missing - run setup.bat & set PROBLEMS=1)
if exist "android-app\.env" (echo [OK]   android-app\.env) else (echo [INFO] android-app\.env missing - needed only for the Expo Android shell)

findstr /B /C:"APP_GEMINI_API_KEY=" "backend-api\.env" 2>nul | findstr /R "APP_GEMINI_API_KEY=..*" >nul && (echo [OK]   Gemini key configured) || (echo [INFO] Gemini not configured - rule-based extraction will be used)
findstr /R "TELEPHONY_WEBHOOK_SECRET=..*" "backend-api\.env" >nul 2>nul && (echo [OK]   Telephony webhook secret set) || (echo [INFO] Telephony not configured - use the DEMO CALL SIMULATOR)

echo.
if "%PROBLEMS%"=="0" (echo Environment looks ready.) else (echo Some items need attention - see WARN lines above.)
exit /b 0

:check
where %1 >nul 2>nul
if errorlevel 1 (
  if "%3"=="required" (echo [FAIL] %~2 not found & set PROBLEMS=1) else (echo [INFO] %~2 not found)
) else (
  for /f "delims=" %%v in ('%1 --version 2^>^&1') do (echo [OK]   %~2: %%v & goto :eof)
)
goto :eof
