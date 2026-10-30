# Database design

Implemented as a typed document store (`shared-types/index.ts` → `Database`), persisted to `backend-api/data/db.json` (or browser localStorage in demo mode). Each top-level array maps 1:1 to a Firestore collection for the planned Firestore adapter.

| Requested model | Collection / type | Notes |
|---|---|---|
| User | `users` | role `asha`/`citizen`, scrypt hash, language, `synthetic` flag |
| ASHAWorkerProfile | `ashaProfiles` | workerId, village, `assignedAreaIds` (authorisation scope) |
| CitizenProfile | `citizenProfiles` | linked `beneficiaryId`, age, optional gender, village/state |
| Household | `households` | areaId, address, head |
| Beneficiary | `beneficiaries` | `category` drives record types; `linkedUserId` links the citizen account; `assignedAshaUserId`; `motherBeneficiaryId` for newborns |
| PregnancyProfile | `records` type `VHR` + `MATERNAL` | pregnancy status/stage/EDD fields |
| VillageHealthRegister | `records` type `VHR` | |
| AshaDiary | `diary` | one entry per visit; source `manual` / `voice_reviewed` / `visit_completion` |
| MaternalHealthRecord | `records` type `MATERNAL` | |
| ChildHealthRecord / ImmunisationRecord | `records` type `IMMUNISATION` | |
| HBNCVisitRecord | `records` type `HBNC` | |
| PostnatalVisitRecord | `records` type `POSTNATAL` | |
| ElderlyHealthRecord | `records` type `ELDERLY` | |
| (voice) | `drafts` | DocumentationDraft — transcript + extraction, `pending_review/approved/discarded` |
| Visit | `visits` | `scheduled/completed/cancelled`; *overdue* is derived (scheduled & date < today) |
| FollowUpTask | `tasks` | priority, origin (voice_documentation, urgent_flag, manual…) |
| DocumentChecklist | `documents` | `missing/received/needs_verification/uploaded` — never "officially verified" |
| WaterInspection | `water` | |
| HealthcareScheme | `database/demo-data/schemes.ts` (static, versioned in git) | source URL, last reviewed, verification status, central vs Karnataka |
| EligibilityRule | `database/demo-data/schemes.ts` | equals / gte / lte / anyOf criteria |
| EligibilityAssessment | `assessments` | answers + per-scheme results + channel (app/call/asha) |
| AssistanceRequest | `requests` | status history, created via app/call/eligibility |
| Notification | `notifications` | de-duplicated by `key`, priority, link, `sensitive` |
| CallSession / CallSummary | `calls` / `callSummaries` | transcript purged at end unless retention consent |
| ConsentRecord | `consents` | share_records_with_asha, share_self_reports_with_asha, notifications, call_transcript_retention |
| AuditLog | `audit` | every write, login and denied access |
| (private) | `privateMessages`, `selfReports` | private conversations are never returned by ASHA endpoints |

## Record field model
Record fields are defined once in `database/schemas/recordSchemas.ts` (label, type, `nature`: admin / reported / measurement / verified / observation, `required`, `onlyFor`). Stored values are `FieldValue { value, source, updatedAt, updatedBy, viaVoiceReview? }`.

## Seed data (`database/seed/seed.ts`)
Generated relative to the current date: 2 users, 2 areas, 25 households + 1 outside-area household, 48 beneficiaries in Demo Village (+1 outside), detailed records for Lakshmi (pregnant), Kavya (postnatal), Baby of Kavya (newborn), Ravi (child), Basavaraj and Gowramma (elderly), Shanthi (pregnant), Anil (child); 10 visits (5 today, 1 overdue), 2 tasks, 7 document items. All `synthetic: true`.
