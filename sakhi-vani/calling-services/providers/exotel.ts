/**
 * Exotel provider adapter — SKELETON, NOT CONFIGURED OR TESTED.
 * A real deployment needs: an Exotel account + virtual number, an app/flow that forwards the caller's
 * speech (or recorded audio for STT) to /webhooks/telephony/exotel/*, and credentials in .env:
 * EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_SUBDOMAIN, EXOTEL_CALLER_ID.
 * Exotel's exact applet/streaming contract must be confirmed against current Exotel documentation.
 */
export interface ProviderReply {
  say: string
  language: 'en' | 'hi' | 'kn'
  hangup: boolean
}

export function parseExotelIncoming(body: Record<string, unknown>) {
  return {
    providerCallId: String(body.CallSid ?? body.callSid ?? ''),
    from: String(body.From ?? body.CallFrom ?? '').replace(/\D/g, '').slice(-10),
    speech: String(body.SpeechResult ?? body.speech ?? body.digits ?? ''),
  }
}

/** Generic JSON reply; adapt to the provider's response format (e.g. text for a TTS applet). */
export function formatReply(r: ProviderReply) {
  return { text: r.say, language: r.language, hangup: r.hangup }
}

export function isConfigured() {
  return !!(process.env.EXOTEL_SID && process.env.EXOTEL_API_KEY && process.env.EXOTEL_API_TOKEN)
}
