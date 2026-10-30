# Voice-based ASHA documentation

## Workflow (implemented)
1. ASHA opens a beneficiary → **Speak About Today's Visit**.
2. Chooses Kannada / Hindi / English and taps the mic → browser speech recognition (`voice-services/adapters/browserSpeech.ts`) streams the transcript. If unavailable or blocked, the app explains why and offers typing or **Use demo transcription** (badge: *SIMULATED speech*).
3. The transcript is editable; `sttMode` (`browser_speech | demo_simulated | typed | provider`) is stored with the draft.
4. **Process transcript** → `processTranscript` runs the ASHA Documentation Agent and stores a **draft** (status `pending_review`). Records are untouched.
5. Review screen shows: original transcript, fields grouped by record (VHR / ASHA Diary / category record), confidence, provenance, the exact evidence sentence, and a **confirm** flag for uncertain values (unticked by default).
6. **Additional information required** lists gaps (next visit date missing / needs confirmation, ANC details, BP not provided, EDD unknown). Fill manually or **Speak again**.
7. The ASHA ticks the confirmation statement → **Approve and save** → `approveDraft({confirmed:true})` writes fields (marked *voice, reviewed*), adds an ASHA Diary entry, completes today's visit, schedules the follow-up, creates a task and notifications. Danger signs create an urgent task + urgent alert (not a diagnosis).
8. **Discard** marks the draft discarded; nothing is saved.

## Extraction rules
- Never invents values: measurements (BP, weight) only when a number is spoken, and always flagged to confirm who measured.
- "Next week" → suggested date + needs confirmation; explicit date / "tomorrow" / "in N days" → confirmed.
- Symptoms are recorded as *reported*, observations labelled *not a diagnosis*.
- Hindi and Kannada keyword support covers the demo vocabulary (months, pregnancy, check-up, discomfort, follow-up, next week). Broader coverage needs an STT+NLU provider (Gemini adapter on the backend validates output against the transcript).

## Privacy
Transcripts are kept with the draft for review/audit. Add a retention job (e.g. delete transcripts of approved drafts after N days) before production.
