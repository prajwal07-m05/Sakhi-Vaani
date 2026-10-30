# calling-services
- `simulator/callEngine.ts` — provider-agnostic conversation engine (used by the in-app DEMO CALL SIMULATOR and webhooks).
- `webhooks/telephonyRouter.ts` — `/webhooks/telephony/:provider/{incoming,speech,status}` (requires `X-Webhook-Secret`).
- `sessions/callSessionStore.ts` — provider call id → SAKHI VANI call id, with sweep.
- `providers/exotel.ts` — Exotel skeleton (not configured/tested). See `docs/CALLING_ASSISTANT.md`.
