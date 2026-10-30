/** Maps a provider's call identifier (e.g. Exotel CallSid) to a SAKHI VANI call session id. */
const map = new Map<string, { callId: string; userId: string; createdAt: number }>()
export const callSessions = {
  set(providerCallId: string, callId: string, userId: string) { map.set(providerCallId, { callId, userId, createdAt: Date.now() }) },
  get(providerCallId: string) { return map.get(providerCallId) },
  delete(providerCallId: string) { map.delete(providerCallId) },
  /** Drop sessions older than 2 hours (retention control). */
  sweep() { const cutoff = Date.now() - 2 * 3600_000; for (const [k, v] of map) if (v.createdAt < cutoff) map.delete(k) },
}
