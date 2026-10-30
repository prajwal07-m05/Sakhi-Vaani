# SAKHI VANI

**Every Voice Matters. Every Community Deserves Care.**

SAKHI VANI is a multilingual (Kannada / Hindi / English), voice-first community healthcare assistance platform that connects **ASHA workers** and **citizens** through one application with two experiences:

1. **ASHA SAHAYAK** — the ASHA worker dashboard: beneficiaries, household visits, health records, voice documentation, follow-ups, documents, water inspection and citizen requests.
2. **CITIZEN & SAKHI CARE** — the citizen dashboard: personal health profile, health information assistant, government scheme discovery, conversational eligibility check, the SAKHI VANI calling assistant (demo simulator), maternal / child / elderly support, reminders and ASHA assistance requests.

Both experiences share one domain service and one backend, with **server-side authorisation**, consent-based sharing and audit logging.

> **All seeded data is synthetic demo data.** No real patients, no Aadhaar numbers, no real phone numbers.

---

## Demo login credentials (exactly two accounts)

| Role | Name | Username | Password | Notes |
|---|---|---|---|---|
| ASHA Worker | Meera (ASHA-DEMO-001), Demo Village, Karnataka | `asha@demo.com` | `Asha@123` | Assigned area includes Lakshmi |
| Citizen | Lakshmi, 25, Beneficiary **SYN-001**, Household **H-012**, 7 months pregnant (synthetic) | `citizen@demo.com` | `Citizen@123` | Same record Meera sees |

The login screen has a **"Use demo account"** button that fills these in.

---

## Features

**ASHA Sahayak**
- Dashboard: households, beneficiaries, today's / completed / pending / overdue visits, records needing updates, missing documents, high-priority follow-ups, new assistance requests, pending voice drafts.
- Beneficiary search by name, beneficiary ID, household ID or mobile (only within the worker's assigned area — enforced server-side).
- Beneficiary profile with household, consent status, missing information, follow-ups, documents, previous ASHA notes, visit history.
- **Category-specific records** chosen automatically:
  - Pregnant woman → Village Health Register + ASHA Diary + Maternal Health Record
  - Newborn → VHR + ASHA Diary + HBNC Home Visit Record
  - Child under two → VHR + ASHA Diary + Immunisation Record
  - Postnatal mother → VHR + ASHA Diary + Postnatal Home Visit Record
  - Elderly → VHR + ASHA Diary + Elderly Care Record
- Every field carries **provenance**: reported by beneficiary / self-reported / ASHA-recorded / measurement / from facility record, plus "voice, reviewed".
- **Speak About Today's Visit** — voice documentation: speech → transcript → extraction → mapped fields → missing information → edit → explicit approval → save → follow-up + notification. Nothing is saved before approval.
- Visit management: today / upcoming / overdue / completed, complete (writes ASHA Diary), reschedule, new visits, follow-up tasks. Missed visits automatically show as overdue.
- Document checklist (received / pending verification / missing / demo upload), water inspection, assistance requests with status updates, personal audit log.

**Citizen & Sakhi Care**
- Large-tile, multilingual home with voice entry point and emergency line.
- My Health Profile: records with provenance, "what you share and with whom", self-reports (private unless shared + consented), documents, timeline.
- **Government Health Schemes Available for You** with reasons, central vs Karnataka badge, source, last-reviewed and verification status.
- **Conversational eligibility check** — one question at a time; deterministic rules; criteria satisfied / not satisfied / unknown; missing information; documents; application process; official link; ASHA help.
- **Call SAKHI VANI** — DEMO CALL SIMULATOR in English / Hindi / Kannada using the same engine and services a phone line would use.
- Health Information Assistant and private maternal conversation (source-backed, never prescribes; urgent guidance for danger signs).
- Pregnancy & motherhood, child health (UIP schedule reference), elderly care, appointments & reminders, ASHA assistance requests with status tracking, notifications with pop-up alerts.

---

## Technology stack

| Layer | Implementation in this repository |
|---|---|
| Mobile client | React 19 + TypeScript + Vite + Tailwind CSS v4, mobile-first, installable PWA (`mobile-app/`) |
| Android packaging | Expo (React Native) WebView shell with microphone permission (`android-app/`) — see *Deviation* below |
| Backend | Node.js + TypeScript + Express REST API (`backend-api/`) |
| Domain logic | Shared, framework-free TypeScript service (`core/service.ts`) used by the backend **and** by the client's offline demo adapter |
| Persistence | JSON-file store on the backend (`backend-api/data/db.json`); browser localStorage in demo mode. Firestore adapter planned (same contract) |
| Auth | scrypt password hashing + HMAC-signed bearer tokens; role and area checks in the service |
| AI | Rule-based NLU/extraction (works offline); optional **Gemini** adapter on the backend with strict output validation |
| Speech | Browser Web Speech API (real, where supported); Sarvam AI STT/TTS adapters (backend, need key); labelled demo transcript fallback |
| Calling | Provider-agnostic call engine; in-app DEMO CALL SIMULATOR; Exotel webhook skeleton |

**Deviation from the brief (honest note):** the brief suggested a React Native/Expo UI. To deliver a fully working, testable MVP in the time available, the UI is a mobile-first React app that runs in the browser, installs to the Android home screen as a PWA, and is packaged for Android through the Expo WebView shell in `android-app/`. A native React Native UI port is listed in `docs/IMPLEMENTATION_STATUS.md`.

---

## Folder structure

```
sakhi-vani/
├── mobile-app/          React mobile-first client (src/App.tsx, screens/, components/, api/, i18n.ts)
├── android-app/         Expo WebView shell for Android APK builds
├── backend-api/         Express API (src/server.ts, routes/, middleware/, services/, config/)
├── core/                Shared domain service, REST contract, utilities, errors
├── ai-services/         orchestrator/, agents/ (documentation), eligibility/ (rule engine), retrieval/, prompts/
├── voice-services/      adapters/ (browser speech), stt/ + tts/ (Sarvam adapters)
├── calling-services/    simulator/ (call engine), webhooks/, sessions/, providers/ (Exotel skeleton)
├── database/            schemas/ (record field definitions), seed/ (synthetic seed), demo-data/ (schemes, rules, knowledge)
├── shared-types/        TypeScript types for every entity
├── tests/               node:test suites (core, eligibility, calling, backend HTTP)
├── scripts/             package-zip.ps1, package_zip.py
├── docs/                Architecture, API, database, Windows setup, demo guide, privacy, status…
├── *.bat                Windows scripts
├── .env.example
└── package.json
```

---

## Installation (Windows 11)

Prerequisite: **Node.js 20 LTS or newer** (includes npm). Git for GitHub.

```bat
cd sakhi-vani
setup.bat            :: installs dependencies, creates backend-api\.env and mobile-app\.env (never overwrites)
check-environment.bat
start-all.bat        :: opens backend (http://localhost:4000) + app (http://localhost:5173)
run-tests.bat
```

Full step-by-step guide: [`docs/WINDOWS_SETUP.md`](docs/WINDOWS_SETUP.md).

### Two ways to run the app
- **Connected mode** (`start-all.bat`): the app talks to the Express backend (`VITE_API_URL=http://localhost:4000`).
- **Stand-alone demo mode** (`start-mobile.bat`, or leave `VITE_API_URL` empty): the same domain service runs inside the app with browser storage — no server needed. Both demo accounts share the store, so ASHA ↔ citizen flows work in one browser (log out and log in as the other user).

### On an Android phone
Run `start-all.bat`, connect the phone to the same Wi-Fi, open `http://<your-PC-IP>:5173` in Chrome and use **Add to Home screen**. For an APK, see `build-android.bat` and `docs/WINDOWS_SETUP.md`.

---

## Environment setup

Copy `.env.example` → `backend-api/.env` (setup.bat does this). Important keys:

| Key | Purpose |
|---|---|
| `JWT_SECRET` | Token signing secret (required in production) |
| `CORS_ORIGINS` | Allowed client origins |
| `DEMO_MODE` | Enables `/api/dev/reset` |
| `APP_GEMINI_API_KEY`, `APP_GEMINI_MODEL` | Optional Gemini extraction suggestions (backend only) |
| `SARVAM_API_KEY` | Optional Sarvam STT/TTS |
| `TELEPHONY_PROVIDER`, `TELEPHONY_WEBHOOK_SECRET`, `EXOTEL_*` | Real telephony (when a number is provisioned) |

`mobile-app/.env`: `VITE_API_URL` (empty = in-app demo backend). Never put API keys in the mobile app.

---

## Running the three demo flows

See [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md) for click-by-click scripts.

- **Flow A — ASHA:** ASHA Worker → demo login → search `SYN-001` → Lakshmi → *Open Beneficiary Records* (VHR, ASHA Diary, Maternal) → *Speak About Today's Visit* → mic or **Use demo transcription** → *Process transcript* → review/edit, fill missing info → tick confirmation → *Approve and save* → follow-up + notification.
- **Flow B — Citizen schemes:** Citizen → demo login → profile → Schemes → pick a scheme → *Check my eligibility* → answer one question at a time → results with criteria, missing info, documents, application steps → *Request ASHA help* → confirm → log in as Meera → request appears → update status → log back in as Lakshmi → updated status.
- **Flow C — Calling assistant:** Citizen → *Call SAKHI VANI* → choose language → *Start simulated call* → "I am pregnant. Are there any government schemes for me?" → answer questions → hear result + missing info → "Yes" to ASHA help → "That is all" → call summary → Meera sees the new request.

---

## Configuring AI and speech
- **Rule-based** extraction and intent routing work offline and are what the tests cover.
- **Gemini:** set `APP_GEMINI_API_KEY` in `backend-api/.env`. `POST /api/ai/extract-preview` returns validated suggestions (evidence must be an exact transcript substring). Suggestions are never saved automatically.
- **Speech:** the app uses the browser's speech recognition when available (Chrome on Android/desktop). Kannada/Hindi support depends on the device. If unavailable the app says so and offers typing or a clearly-labelled **simulated** demo transcript. Sarvam adapters are in `voice-services/stt` and `voice-services/tts` (unverified; need a key).

## Configuring real telephony
See [`docs/CALLING_ASSISTANT.md`](docs/CALLING_ASSISTANT.md). In short: provision a number with a provider (e.g. Exotel), set `TELEPHONY_PROVIDER`, `TELEPHONY_WEBHOOK_SECRET` and provider credentials, expose the backend over HTTPS, and point the provider's flow at `/webhooks/telephony/<provider>/incoming|speech|status`. **This has not been configured or tested in this build.**

## Using the demo simulator without credentials
Open **Call SAKHI VANI** in the citizen app. It is labelled **DEMO CALL SIMULATOR**, shows no phone number, and runs the real conversation engine, eligibility rules and assistance-request service.

---

## Push to GitHub

```bat
cd sakhi-vani
git init
git add .
git commit -m "SAKHI VANI MVP"
git branch -M main
git remote add origin https://github.com/<your-org>/sakhi-vani.git
git push -u origin main
git checkout -b develop && git push -u origin develop
```
`.gitignore` already excludes `node_modules`, builds, `.env` files, local data and ZIPs. Team workflow: [`docs/TEAM_WORKFLOW.md`](docs/TEAM_WORKFLOW.md).

## Documentation
[Architecture](docs/ARCHITECTURE.md) · [API](docs/API.md) · [Database](docs/DATABASE.md) · [Windows setup](docs/WINDOWS_SETUP.md) · [Team workflow](docs/TEAM_WORKFLOW.md) · [Demo guide](docs/DEMO_GUIDE.md) · [Calling assistant](docs/CALLING_ASSISTANT.md) · [Voice documentation](docs/VOICE_DOCUMENTATION.md) · [Privacy & safety](docs/PRIVACY_AND_SAFETY.md) · [Implementation status](docs/IMPLEMENTATION_STATUS.md)

## Healthcare responsibility
SAKHI VANI gives general, source-backed information. It does **not** diagnose, prescribe, change doses or replace qualified professionals, and it never claims a scheme application is approved. Scheme content is marked *needs verification* until checked against official sources.
