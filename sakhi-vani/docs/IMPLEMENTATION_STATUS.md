# Implementation status (honest)

Last updated for the build delivered in `SAKHI_VANI_COMPLETE_PROJECT.zip`.

## Implemented and tested
Automated: `run-tests.bat` → **29 node:test tests passing** (core, eligibility, calling, backend HTTP). Browser E2E: `tests/e2e/demo-flows.e2e.mjs` executed successfully in headless Chromium against the built client (stand-alone demo mode).

| Area | Evidence |
|---|---|
| Startup, language selection, two entry cards | E2E |
| Two demo accounts, login, wrong-password / wrong-role rejection | unit + HTTP + E2E |
| Role-based access (citizen ↛ ASHA endpoints; ASHA limited to assigned area; forged token → 401) | unit + HTTP |
| ASHA dashboard stats from seeded data | unit + E2E |
| Beneficiary search by name / ID / household | unit + HTTP + E2E |
| Beneficiary profile; VHR, ASHA Diary, Maternal record views | E2E |
| Category record selection (pregnant, newborn→HBNC, child→Immunisation, postnatal, elderly) | unit + E2E (HBNC) |
| Voice documentation fallback (labelled demo transcription) → extraction → missing info → edit → approval required → save → follow-up → notification | unit + E2E |
| Hindi and Kannada demo transcript extraction | unit |
| Danger-sign urgent flags (no diagnosis) | unit |
| Missed visit → overdue; visit completion; reschedule notification | unit |
| Notification generation (overdue, record update/EDD, HBNC due, follow-up, new request, status change) | unit + E2E |
| Scheme discovery with reasons; deterministic eligibility (equals/gte/anyOf; unsure handling); one-question-at-a-time flow | unit + E2E |
| Assistance request: consent + confirmation required, ASHA notified, status update, citizen sees status | unit + HTTP + E2E |
| Calling simulator (EN + KN), intent routing, confirmation before request, summary, transcript purge | unit + E2E |
| Privacy: private chats and unshared self-reports never reach ASHA profile | unit |
| Assistant medicine guardrail and emergency guidance | unit |
| Backend starts, seeds JSON store, `/api/health`, login token | executed manually (`tsx src/server.ts`) |
| Mobile client production build and typecheck (standalone `mobile-app/`) | executed |
| Backend typecheck | executed |

## Implemented but not tested
- Windows `.bat` scripts — written with CRLF and safe CMD syntax, **not executed on Windows** in this build.
- Browser speech recognition (real mic) — depends on device/browser; not testable headless. Kannada/Hindi availability varies by device.
- Text-to-speech in the assistant and call simulator — depends on installed device voices.
- Household list, water inspection, document upload/checklist UI, manual record editing, settings/consents UI, citizen registration UI — implemented; covered partly by unit tests of the service, not by E2E.
- Connected mode (mobile client → Express via `VITE_API_URL`) — HTTP adapter and API are both tested separately; the combined UI run was not executed.
- Expo Android shell (`android-app/`) and `build-android.bat` — dependency versions must be aligned with `npx expo install --fix`; **no APK was built**.

## Simulated (clearly labelled in the UI)
- **DEMO CALL SIMULATOR** — real conversation engine and services, no telephone line, no phone number shown.
- **Demo transcription** — a sample transcript inserted when the mic is unavailable (badge: *SIMULATED speech*).
- Demo document "upload" stores only the file name and size.

## Needs external credentials / services
| Feature | What is needed |
|---|---|
| Gemini extraction suggestions (`/api/ai/extract-preview`) | `APP_GEMINI_API_KEY` — adapter written, not verified |
| Sarvam STT/TTS (`voice-services/stt`, `tts`) | `SARVAM_API_KEY`; confirm endpoint/model names — not verified |
| Real telephony (Exotel or other) | Provisioned number, provider flow, HTTPS backend, `TELEPHONY_*` / `EXOTEL_*` — webhook skeleton only |
| APK build | Expo account (EAS) or local JDK 17 + Android SDK |
| Push notifications (FCM) | Firebase project + credentials — not implemented |
| Firebase Auth / Firestore | Firebase project — persistence adapter not implemented (JSON store used) |

## Not yet implemented (next steps)
- Native React Native UI port (current UI is a mobile-first React PWA wrapped by Expo WebView).
- Firestore persistence adapter and Firebase Authentication.
- Push notifications (FCM), lock-screen notification rendering.
- Offline draft queue with background sync and conflict handling (stand-alone mode stores everything locally; connected mode needs network).
- Scheme content verification by the team (all schemes currently `needs_verification`); more Karnataka schemes once verified.
- Native-speaker review of Hindi/Kannada strings; translation of detailed health articles (currently English points + translated summaries).
- Transcript retention job for approved drafts; admin reporting; real document storage with access control.
