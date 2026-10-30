@echo off
setlocal
cd /d "%~dp0"
if /I "%~1"=="expo" goto :expo

cd /d "%~dp0mobile-app"
if not exist "node_modules" (
  echo [ERROR] Mobile app dependencies are missing. Run setup.bat first.
  exit /b 1
)
echo Starting the SAKHI VANI mobile client on http://localhost:5173
echo  - Open it on your Android phone at http://YOUR-PC-IP:5173 (same Wi-Fi), then "Add to Home screen".
echo  - To run inside the Expo Android shell instead:  start-mobile.bat expo
call npm run dev
exit /b %errorlevel%

:expo
cd /d "%~dp0android-app"
if not exist "node_modules" (
  echo Installing Expo shell dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)
if not exist ".env" (
  echo [INFO] android-app\.env not found. Copy android-app\.env.example to android-app\.env and set EXPO_PUBLIC_WEB_URL.
)
call npx expo start
