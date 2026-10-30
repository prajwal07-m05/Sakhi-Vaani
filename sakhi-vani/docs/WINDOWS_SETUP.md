# Windows 11 setup

## 1. Install prerequisites
1. **Node.js 20 LTS or newer** — https://nodejs.org (tick "Add to PATH"). Check: `node -v`, `npm -v`.
2. **Git** (to push to GitHub) — https://git-scm.com.
3. Optional, only for local APK builds: **Android Studio** (SDK + platform-tools) and **Java JDK 17**; set `ANDROID_HOME`.

## 2. Unzip
Extract `SAKHI_VANI_COMPLETE_PROJECT.zip` to a short path, e.g. `C:\dev\sakhi-vani`.

## 3. Run the scripts (Command Prompt or double-click)
| Script | What it does |
|---|---|
| `setup.bat` | Checks Node/npm, installs root, backend and mobile dependencies, creates `backend-api\.env` and `mobile-app\.env` from the examples **only if they do not exist** |
| `check-environment.bat` | Reports Node, npm, Git, Java, adb, ANDROID_HOME, installed dependencies and configuration |
| `start-backend.bat` | Starts the API at http://localhost:4000 (`/api/health`) |
| `start-mobile.bat` | Starts the mobile client at http://localhost:5173 (in-app demo backend unless `VITE_API_URL` is set). `start-mobile.bat expo` starts the Expo Android shell |
| `start-all.bat` | Opens backend and mobile client in two windows, with the client connected to the backend |
| `run-tests.bat` | Runs all automated tests |
| `build-android.bat` | Checks prerequisites and builds an APK via EAS cloud (needs a free Expo account — external service). `build-android.bat local` builds locally (needs JDK 17 + Android SDK) |

## 4. Open the app
- PC: http://localhost:5173
- Phone (same Wi-Fi): find your PC IP with `ipconfig` → open `http://<IP>:5173` in Chrome → menu → *Add to Home screen*. Allow Windows Firewall for Node when prompted. If you use the backend from the phone, set `CORS_ORIGINS` to include `http://<IP>:5173` and set `VITE_API_URL=http://<IP>:4000` in `mobile-app\.env`.
- Note: browsers only allow the microphone on `https://` or `localhost`. On a phone over plain `http://<IP>`, voice input may be blocked — use the demo transcription/typing, or host the client over HTTPS.

## 5. Demo logins (synthetic)
`asha@demo.com / Asha@123` and `citizen@demo.com / Citizen@123`.

## Troubleshooting
- *"Run setup.bat first"* — dependencies are missing; run `setup.bat`.
- Port in use — close other dev servers or change `API_PORT` in `backend-api\.env`.
- Reset demo data — backend: delete `backend-api\data\db.json` and restart (or `POST /api/dev/reset`); stand-alone mode: Settings → *Reset demo data*.
- Building an APK requires either an Expo account (EAS) or a local Android SDK; this has **not** been executed in this build.
