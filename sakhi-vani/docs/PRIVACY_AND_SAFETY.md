# Privacy and safety

## Implemented controls
- **Role-based access + server-side authorisation** in `core/service.ts`: citizens cannot call ASHA methods; ASHA workers only see beneficiaries in their assigned areas; denied attempts are audit-logged.
- **Secure authentication:** scrypt password hashing with per-user salt; HMAC-SHA256 signed, expiring bearer tokens; login rate limiting; security headers; `JWT_SECRET` required in production. (The stand-alone browser demo uses a labelled demo hash because there is no server.)
- **Consent-based sharing:** records sharing, self-report sharing, notifications and call transcript retention are separate, changeable consents. Self-reports are private unless the citizen both ticks "share" and has consent on.
- **Private conversation separation:** assistant and maternal conversations (`privateMessages`) are never returned by any ASHA endpoint (covered by tests).
- **Minimal data:** gender optional, mobile optional, no Aadhaar; request descriptions capped; call summaries hold minimal fields.
- **Retention:** call transcripts are purged at call end by default.
- **Audit logs** for logins, views, writes, consent changes, denied access.
- **Restricted documents:** only status + file name are stored in the demo; citizens can only mark their own documents as uploaded; nothing is labelled "officially verified".
- **Lock-screen safety:** notifications carry a `sensitive` flag; sensitive titles avoid clinical details.
- **Secrets** stay on the backend (`.env`, git-ignored). The client never holds API keys.

## Healthcare responsibility
- No diagnosis, prescription or dose changes. Medicine questions get general safety information and are referred to a clinician/pharmacist.
- Danger-sign keywords trigger **urgent guidance** (call 108 / 112, go to the nearest facility) without further questioning.
- Eligibility uses fixed, versioned rules; results say "potentially eligible / more information required / criteria not currently met" — never "approved".
- Scheme content is marked *needs verification* with source URLs until a team member verifies it.
- Clinical thresholds are not invented; there is no risk scoring beyond flagging MCP-card danger signs for professional assessment.

## Limitations (stated to users)
Confidentiality is not absolute: information may be shared where law or safeguarding duties require. The demo uses synthetic data only. A production deployment needs a DPIA, encryption at rest, HTTPS everywhere, data-retention jobs, and review against India's DPDP Act 2023 and NHM/ABDM guidelines.
