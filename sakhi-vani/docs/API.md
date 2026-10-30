# REST API

Base URL: `http://localhost:4000`. JSON in/out. Authenticated routes need `Authorization: Bearer <token>` from login.
`GET` inputs are sent as `?input=<url-encoded JSON>`; path params are filled from the input. Errors: `{ "error": "message" }` with 400/401/403/404/429/500.
The single source of truth is `core/contract.ts`.

## Public
| Method | Path | Body |
|---|---|---|
| GET | `/api/health` | — |
| POST | `/api/auth/login` | `{ email, password, role }` → `{ user, token }` |
| POST | `/api/auth/register/asha` | `{ name, workerId, village, phone, email, password }` |
| POST | `/api/auth/register/citizen` | `{ name, age, gender?, village, phone?, email, password, pregnant?, consentAccepted, shareWithAsha, notifications }` |
| POST | `/api/dev/reset` | demo mode only — re-seeds synthetic data |

## Common (any logged-in user)
| GET `/api/me` · PATCH `/api/me/language` `{language}` |
|---|
| GET `/api/notifications` · POST `/api/notifications/:id/read` · POST `/api/notifications/read-all` |
| GET `/api/documents` `{beneficiaryId?}` · PATCH `/api/documents/:documentId` `{status, fileName?, fileSize?}` (citizen: `uploaded` only) |
| GET `/api/requests` · GET `/api/schemes` · POST `/api/eligibility/next-question` `{answers, schemeIds?}` · POST `/api/eligibility/assess` `{answers, schemeIds?}` |
| POST `/api/assistant/messages` `{text, channel, lang}` · GET `/api/assistant/messages` `{channel}` · POST `/api/assistant/messages/clear` |
| GET `/api/audit` |

## ASHA worker only (and only for beneficiaries in assigned areas)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/asha/dashboard` | stats, today's/overdue visits, tasks, new requests |
| GET | `/api/asha/beneficiaries` | `{q}` name / ID / household / mobile |
| GET | `/api/asha/households` | |
| GET | `/api/asha/beneficiaries/:id` | profile, records, diary, visits, tasks, documents, missing info, consent |
| PATCH | `/api/asha/beneficiaries/:beneficiaryId/records/:type` | `{values}` manual edit |
| POST | `/api/asha/beneficiaries/:beneficiaryId/diary` | `{fields}` |
| POST | `/api/asha/beneficiaries/:beneficiaryId/voice-drafts` | `{transcript, language, sttMode}` → draft (NOT saved to records) |
| POST | `/api/asha/voice-drafts/:draftId/approve` | `{confirmed: true, fields:[{recordType,key,value}]}` |
| POST | `/api/asha/voice-drafts/:draftId/discard` | |
| GET/POST | `/api/asha/visits` | list / create `{beneficiaryId, date, purpose}` |
| POST | `/api/asha/visits/:visitId/complete` | `{notes, nextVisitDate?}` |
| POST | `/api/asha/visits/:visitId/reschedule` | `{newDate, reason?}` |
| GET/POST | `/api/asha/tasks` · POST `/api/asha/tasks/:taskId/complete` | |
| GET/POST | `/api/asha/water-inspections` | |
| POST | `/api/asha/documents` | `{beneficiaryId, name, purpose}` |
| POST | `/api/asha/requests/:requestId/status` | `{status, note?}` → notifies citizen |
| POST | `/api/ai/extract-preview` | optional Gemini suggestions (501 if not configured) |

## Citizen only
| Method | Path | Notes |
|---|---|---|
| GET | `/api/citizen/overview` | own profile, records (with provenance), visits, documents, requests, consents, timeline |
| PATCH | `/api/citizen/consents/:type` | `{granted}` |
| POST | `/api/citizen/self-reports` | `{text, share}` (shared only if consent on) |
| GET | `/api/eligibility/prefill` | answers derived from profile |
| POST | `/api/requests` | `{category, description, contactMethod, consentToShare: true, confirmed: true, relatedSchemeId?}` |
| POST | `/api/calls` · POST `/api/calls/:callId/turns` `{text}` · POST `/api/calls/:callId/end` · GET `/api/calls/summaries` | simulator / call sessions |

## Telephony webhooks (require `X-Webhook-Secret`)
`POST /webhooks/telephony/:provider/incoming` `{CallSid, From}` · `/speech` `{CallSid, SpeechResult}` · `/status` `{CallSid}` → `{ text, language, hangup }`. Returns 503 until `TELEPHONY_WEBHOOK_SECRET` is set.
