# voice-services
- `adapters/types.ts` — STT/TTS adapter contracts and BCP-47 codes (en-IN, hi-IN, kn-IN).
- `adapters/browserSpeech.ts` — Web Speech API (real recognition where the browser supports it) + speechSynthesis TTS. Reports limitations honestly.
- `stt/sarvamStt.ts`, `tts/sarvamTts.ts` — server-side Sarvam AI adapters (need `SARVAM_API_KEY`; not verified).
The labelled demo transcript fallback lives in `ai-services/agents/documentationAgent.ts` (`DEMO_TRANSCRIPTS`).
