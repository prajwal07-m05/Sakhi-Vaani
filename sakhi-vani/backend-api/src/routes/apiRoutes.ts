import { Router, type Response } from 'express'
import type { Database } from '../../../shared-types'
import { createService, type ServiceMethod } from '../../../core/service'
import { ROUTES } from '../../../core/contract'
import { ServiceError } from '../../../core/errors'
import { recordTypesFor } from '../../../database/schemas/recordSchemas'
import { hashPassword, verifyPassword } from '../config/security'
import { signToken, rateLimit, type AuthedRequest } from '../middleware/auth'
import { geminiSuggestFields } from '../services/geminiAdapter'

/**
 * Registers every REST route from the shared contract. Authorisation is enforced inside the
 * domain service on every call (role + assigned-area + ownership checks), not in the UI.
 */
export function buildApiRouter(getDb: () => Database, onWrite: () => void) {
  const router = Router()
  const svc = () => createService(getDb(), { hashPassword, verifyPassword })
  const fail = (res: Response, e: unknown) => {
    if (e instanceof ServiceError) return res.status(e.status).json({ error: e.message })
    console.error(e)
    return res.status(500).json({ error: 'Internal server error' })
  }

  for (const [name, r] of Object.entries(ROUTES) as Array<[ServiceMethod, (typeof ROUTES)[ServiceMethod]]>) {
    const handlers = r.public ? [rateLimit(20, 60_000)] : []
    const verb = r.method.toLowerCase() as 'get' | 'post' | 'patch'
    router[verb](r.path, ...handlers, (req: AuthedRequest, res: Response) => {
      try {
        if (!r.public && !req.session) return res.status(401).json({ error: 'Please log in to continue.' })
        let input: Record<string, unknown> = {}
        if (req.method === 'GET') input = typeof req.query.input === 'string' ? JSON.parse(req.query.input) : { ...req.query }
        else input = (req.body ?? {}) as Record<string, unknown>
        input = { ...input, ...req.params }
        const fn = svc()[name] as (s: unknown, i: unknown) => unknown
        const out = fn(r.public ? null : req.session, input) as Record<string, unknown>
        onWrite()
        if (name === 'login') {
          const user = out.user as { id: string; role: 'asha' | 'citizen' }
          return res.json({ ...out, token: signToken(user.id, user.role) })
        }
        return res.json(out ?? null)
      } catch (e) {
        return fail(res, e)
      }
    })
  }

  // Optional AI enhancement preview (Gemini). Returns suggestions only; never saves.
  router.post('/api/ai/extract-preview', async (req: AuthedRequest, res) => {
    try {
      if (req.session?.role !== 'asha') return res.status(403).json({ error: 'ASHA workers only.' })
      const { beneficiaryId, transcript } = req.body as { beneficiaryId: string; transcript: string }
      const profile = svc().getBeneficiaryProfile(req.session, { id: beneficiaryId })
      const fields = await geminiSuggestFields(String(transcript ?? ''), recordTypesFor(profile.beneficiary.category))
      res.json({ fields, engine: 'gemini_validated' })
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status) return res.status(status).json({ error: (e as Error).message })
      fail(res, e)
    }
  })

  return router
}
