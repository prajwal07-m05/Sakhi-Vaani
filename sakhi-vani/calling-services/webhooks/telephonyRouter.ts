import type { Database, Session } from '../../shared-types'
import { createService } from '../../core/service'
import { ServiceError } from '../../core/errors'
import { callSessions } from '../sessions/callSessionStore'
import { formatReply, parseExotelIncoming } from '../providers/exotel'

/**
 * Telephony webhooks. Provider-agnostic: the provider performs STT (or we call the speech adapter)
 * and sends text; we run the SAME call engine used by the in-app simulator and reply with text for TTS.
 * NOT VERIFIED with a live provider. Requests must carry X-Webhook-Secret = TELEPHONY_WEBHOOK_SECRET.
 */
/* Minimal router shape so this module does not depend on a specific express install. */
type Body = Record<string, unknown>
interface Req { body?: Body; header(name: string): string | undefined }
interface Res { status(code: number): Res; json(body: unknown): unknown }
export interface RouterLike {
  use(path: string, handler: (req: Req, res: Res, next: () => void) => unknown): unknown
  post(path: string, handler: (req: Req, res: Res) => unknown): unknown
}

export function buildTelephonyRouter<R extends RouterLike>(r: R, getDb: () => Database, onWrite: () => void, secret: string): R {
  const svc = () => createService(getDb(), { hashPassword: () => '', verifyPassword: () => false })
  r.use('/webhooks/telephony', (req: Req, res: Res, next: () => void) => {
    if (!secret) return res.status(503).json({ error: 'Telephony is not configured (TELEPHONY_WEBHOOK_SECRET missing).' })
    if (req.header('x-webhook-secret') !== secret) return res.status(401).json({ error: 'Invalid webhook secret.' })
    next()
  })

  r.post('/webhooks/telephony/:provider/incoming', (req: Req, res: Res) => {
    const { providerCallId, from } = parseExotelIncoming(req.body ?? {})
    const user = getDb().users.find((u) => u.role === 'citizen' && u.phone && u.phone.replace(/\D/g, '').slice(-10) === from)
    if (!user) return res.json(formatReply({ say: 'This number is not registered with SAKHI VANI. Please register in the app or contact your ASHA worker.', language: 'en', hangup: true }))
    const session: Session = { userId: user.id, role: 'citizen' }
    const call = svc().startCall(session)
    callSessions.set(providerCallId, call.id, user.id)
    onWrite()
    res.json(formatReply({ say: call.transcript[call.transcript.length - 1].text, language: 'en', hangup: false }))
  })

  r.post('/webhooks/telephony/:provider/speech', (req: Req, res: Res) => {
    const { providerCallId, speech } = parseExotelIncoming(req.body ?? {})
    const s = callSessions.get(providerCallId)
    if (!s) return res.status(404).json({ error: 'Unknown call.' })
    try {
      const session: Session = { userId: s.userId, role: 'citizen' }
      const before = (getDb().calls.find((c) => c.id === s.callId)?.transcript.length ?? 0) + 1
      const call = svc().callTurn(session, { callId: s.callId, text: speech })
      const lines = call.transcript.slice(before).filter((t) => t.speaker === 'assistant').map((t) => t.text)
      if (call.state === 'ended') { svc().endCall(session, { callId: s.callId }); callSessions.delete(providerCallId) }
      onWrite()
      res.json(formatReply({ say: lines.join(' '), language: call.language, hangup: call.state === 'ended' }))
    } catch (e) {
      res.status(e instanceof ServiceError ? e.status : 500).json({ error: (e as Error).message })
    }
  })

  r.post('/webhooks/telephony/:provider/status', (req: Req, res: Res) => {
    const { providerCallId } = parseExotelIncoming(req.body ?? {})
    const s = callSessions.get(providerCallId)
    if (s) { try { svc().endCall({ userId: s.userId, role: 'citizen' }, { callId: s.callId }) } catch { /* already ended */ } callSessions.delete(providerCallId); onWrite() }
    callSessions.sweep()
    res.json({ ok: true })
  })
  return r
}
