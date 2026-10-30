import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import type { Role, Session } from '../../../shared-types'
import { config } from '../config/env'

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url')

/** Compact HMAC-SHA256 signed token (JWT-compatible structure). */
export function signToken(userId: string, role: Role): string {
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64(JSON.stringify({ sub: userId, role, exp: Math.floor(Date.now() / 1000) + config.tokenTtlHours * 3600 }))
  const sig = crypto.createHmac('sha256', config.jwtSecret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${sig}`
}

export function verifyToken(token: string): Session | null {
  const [h, p, s] = token.split('.')
  if (!h || !p || !s) return null
  const expected = crypto.createHmac('sha256', config.jwtSecret).update(`${h}.${p}`).digest('base64url')
  if (expected.length !== s.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s))) return null
  try {
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString()) as { sub: string; role: Role; exp: number }
    if (claims.exp < Date.now() / 1000) return null
    return { userId: claims.sub, role: claims.role }
  } catch {
    return null
  }
}

export interface AuthedRequest extends Request {
  session?: Session | null
}

export function authenticate(req: AuthedRequest, _res: Response, next: NextFunction) {
  const h = req.header('authorization') ?? ''
  req.session = h.startsWith('Bearer ') ? verifyToken(h.slice(7)) : null
  next()
}

/** Very small in-memory rate limiter for login/registration. */
const hits = new Map<string, { n: number; reset: number }>()
export function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`
    const now = Date.now()
    const e = hits.get(key)
    if (!e || e.reset < now) hits.set(key, { n: 1, reset: now + windowMs })
    else if (++e.n > max) return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' })
    next()
  }
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cache-Control', 'no-store')
  next()
}
