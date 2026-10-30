# SAKHI VANI calling assistant

## What works now
- **DEMO CALL SIMULATOR** (citizen app → *Call SAKHI VANI*), clearly labelled, no phone number shown.
- Engine: `calling-services/simulator/callEngine.ts` — states `language → listening → eligibility → confirm_request → ended`.
- Intents: scheme enquiry, health information (short source-backed summary + disclaimer), ASHA assistance, appointment lookup, emergency guidance (108/112), end call.
- Eligibility uses the shared deterministic engine (max 7 questions per call; "not sure" is accepted and never re-asked).
- An ASHA request is created **only after an explicit "yes"**; the ASHA dashboard is notified.
- Call summary stores minimal data (language, intents, schemes + status, request id, duration). The transcript is **purged at call end** unless the citizen enables *Keep call transcripts*.
- Languages: English, Hindi, Kannada prompts. Speech input uses browser recognition where available; replies are spoken only if the device has a voice for that language (the UI says so otherwise).

## Real telephony (not configured, not tested)
Requirements: provisioned number, provider account (e.g. Exotel), HTTPS-exposed backend, provider flow forwarding caller speech (provider STT) or audio (then `voice-services/stt`), TTS of the returned text, and secrets in `backend-api/.env`:
```
TELEPHONY_PROVIDER=exotel
TELEPHONY_WEBHOOK_SECRET=<random>
EXOTEL_SID= EXOTEL_API_KEY= EXOTEL_API_TOKEN= EXOTEL_SUBDOMAIN= EXOTEL_CALLER_ID=
```
Webhooks (`calling-services/webhooks/telephonyRouter.ts`), all requiring header `X-Webhook-Secret`:
- `POST /webhooks/telephony/:provider/incoming` `{CallSid, From}` — maps caller number to a registered citizen, starts a session.
- `POST /webhooks/telephony/:provider/speech` `{CallSid, SpeechResult}` — one conversation turn → `{text, language, hangup}`.
- `POST /webhooks/telephony/:provider/status` `{CallSid}` — ends session, writes summary, applies retention.

`calling-services/providers/exotel.ts` is a skeleton: confirm Exotel's current applet/streaming contract and adapt `parseExotelIncoming` / `formatReply`. Add call-recording consent prompts before enabling any recording.
