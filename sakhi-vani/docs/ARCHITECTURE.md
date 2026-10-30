# Architecture

```
 ┌──────────────────────────── mobile-app (React, PWA) ────────────────────────────┐
 │  Splash/Language → Role entry → Login                                            │
 │  ASHA Sahayak screens            Citizen & Sakhi Care screens   Call simulator   │
 │            │  api/client.ts  (same typed methods for both adapters)              │
 │            ├── HTTP adapter  ──── REST (core/contract.ts) ────┐                  │
 │            └── Local demo adapter (runs core in-browser)      │                  │
 └────────────────────────────────────────────────────────────── │ ─────────────────┘
                                                                  ▼
 ┌──────────────────────── backend-api (Express) ───────────────────────────────────┐
 │ securityHeaders → CORS → JSON → authenticate (HMAC token) → routes from contract │
 │ /api/*  ──► core/service.ts  (authorisation + business rules, deterministic)     │
 │ /webhooks/telephony/* ──► calling-services (same call engine)                    │
 │ /api/ai/extract-preview ──► Gemini adapter (optional, validated)                 │
 │ persistence: JSON file store (swap for Firestore adapter)                        │
 └──────────────────────────────────────────────────────────────────────────────────┘
```

## Components (the "agents" that actually exist)

| Component | Location | Deterministic? | Role |
|---|---|---|---|
| Voice Processing Agent | `voice-services/adapters/browserSpeech.ts`, `voice-services/stt|tts` | n/a | Captures speech (browser STT) or provider STT; TTS for replies |
| Orchestrator | `ai-services/orchestrator/orchestrator.ts` | yes (keyword NLU) | Intent identification and routing |
| Conversation Agent | orchestrator + `calling-services/simulator/callEngine.ts` | yes | Understands citizen questions in app/call |
| ASHA Documentation Agent | `ai-services/agents/documentationAgent.ts` | yes (rule-based) | Extracts and maps visit details, lists missing info, flags danger signs |
| Beneficiary Record Service | `core/service.ts` (records, diary, drafts) | yes | Stores records only after human approval |
| Healthcare Information Agent | orchestrator + `ai-services/retrieval` | yes | General information with sources; medicine-safety guardrails |
| Maternal Support Agent | orchestrator (maternal channel) | yes | Maternal education, private channel |
| Scheme Discovery Agent | `core/service.ts#listSchemes` | yes | Relevance with reasons |
| Eligibility Engine | `ai-services/eligibility/engine.ts` | **yes — rules only** | Criteria met / not met / unknown; next question |
| Calling Assistant | `calling-services/simulator/callEngine.ts` | yes | Language → intent → eligibility → confirmation → request → summary |
| Follow-up Service | `core/service.ts` (visits, tasks) | yes | Scheduling, overdue detection, reminders |
| Notification Service | `core/service.ts#refreshNotifications` | yes | Rule-based alerts, de-duplicated by key |
| Evidence Retrieval Service | `ai-services/retrieval/evidenceRetrieval.ts` | yes | Keyword retrieval over source-backed knowledge |

**Where AI may help (optional):** Gemini can propose additional extracted fields. Its output is validated (allowed fields only, evidence must be an exact substring of the transcript) and is only a suggestion for human review. AI never changes eligibility rules, saves records, or grants permissions.

**Agent activity shown in the UI is real:** the review screen lists the components that actually ran for that draft; `askAssistant` returns `agentsInvoked` computed during routing.

## Key design decisions
- **One domain service, two runtimes.** `core/service.ts` is framework-free, so the identical logic runs in Express and (for the offline demo) in the browser. Tests exercise it directly and via HTTP.
- **Authorisation inside the service**, not the UI: every method checks role, ownership and assigned area (`getBen`), and logs denied access.
- **Human-in-the-loop documentation:** `processTranscript` creates a *draft*; only `approveDraft` with `confirmed: true` writes records.
- **Provenance on every field** so reported, measured and professionally verified information are never confused.
- **Provider adapters** for speech, AI, telephony and persistence so mock/demo implementations can be swapped for real ones.
