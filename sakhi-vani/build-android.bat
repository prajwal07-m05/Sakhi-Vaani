@echo off
setlocal EnableExtensions
cd /d "%~dp0android-app"
echo ==============================================
echo   SAKHI VANI - Android build
echo ==============================================
where node >nul 2>nul || (echo [ERROR] Node.js is required. & exit /b 1)
if not exist ".env" (
  echo [ERROR] android-app\.env is missing.
  echo         Copy android-app\.env.example to android-app\.env and set EXPO_PUBLIC_WEB_URL
  echo         to the HTTPS address where the mobile client is hosted.
  exit /b 1
)
if not exist "node_modules" (
  echo Installing Expo shell dependencies...
  call npm install || exit /b 1
)
echo Aligning Expo package versions...
call npx expo install --fix

if /I "%~1"=="local" goto :local

echo.
echo Cloud build with EAS (requires a free Expo account - EXTERNAL SERVICE).
echo If you are not logged in, run:  npx eas-cli login
call npx eas-cli build -p android --profile preview
if errorlevel 1 (
  echo [ERROR] EAS build did not complete. Check that you are logged in to Expo and try again.
  exit /b 1
)
exit /b 0

:local
echo.
echo Local build (requires Java JDK 17 and the Android SDK with ANDROID_HOME set).
where java >nul 2>nul || (echo [ERROR] Java JDK 17 not found. & exit /b 1)
if not defined ANDROID_HOME (echo [ERROR] ANDROID_HOME is not set. Install Android Studio / SDK first. & exit /b 1)
call npx expo prebuild -p android || exit /b 1
cd android
call gradlew.bat assembleRelease || exit /b 1
echo APK output: android-app\android\app\build\outputs\apk\release\
