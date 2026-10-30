import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(here, '../..')

/** Minimal .env loader (no extra dependency). Existing process env always wins. */
function loadDotEnv() {
  for (const file of [path.join(backendRoot, '.env'), path.resolve(backendRoot, '../.env')]) {
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m || process.env[m[1]] !== undefined) continue
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
    }
  }
}
loadDotEnv()

const isProd = process.env.NODE_ENV === 'production'
let jwtSecret = process.env.JWT_SECRET ?? ''
if (!jwtSecret) {
  if (isProd) throw new Error('JWT_SECRET must be set in production.')
  jwtSecret = crypto.randomBytes(32).toString('hex')
  console.warn('[sakhi-vani] JWT_SECRET not set — using a random development secret (sessions reset on restart).')
}

export const config = {
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  host: process.env.API_HOST ?? '0.0.0.0',
  jwtSecret,
  tokenTtlHours: Number(process.env.TOKEN_TTL_HOURS ?? 12),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((s) => s.trim()).filter(Boolean),
  dataFile: process.env.DATA_FILE ?? path.join(backendRoot, 'data', 'db.json'),
  demoMode: (process.env.DEMO_MODE ?? 'true') === 'true',
  geminiApiKey: process.env.APP_GEMINI_API_KEY ?? '',
  geminiModel: process.env.APP_GEMINI_MODEL ?? 'gemini-1.5-flash',
  telephonyProvider: process.env.TELEPHONY_PROVIDER ?? 'none',
  telephonyWebhookSecret: process.env.TELEPHONY_WEBHOOK_SECRET ?? '',
}
