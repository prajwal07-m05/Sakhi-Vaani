import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { config } from './config/env'
import { createFileStore } from './services/store'
import { authenticate, securityHeaders } from './middleware/auth'
import { buildApiRouter } from './routes/apiRoutes'
import { buildTelephonyRouter } from '../../calling-services/webhooks/telephonyRouter'

export function createApp(dataFile = config.dataFile) {
  const store = createFileStore(dataFile)
  store.load()
  const app = express()
  app.disable('x-powered-by')
  app.use(securityHeaders)
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) }))
  app.use(express.json({ limit: '200kb' }))
  app.use(express.urlencoded({ extended: false }))
  app.use(authenticate)

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'sakhi-vani-backend', demoMode: config.demoMode, ai: config.geminiApiKey ? 'gemini_configured' : 'rule_based', telephony: config.telephonyProvider }))
  if (config.demoMode) {
    app.post('/api/dev/reset', (_req, res) => { store.reset(); res.json({ ok: true, note: 'Synthetic demo data re-seeded.' }) })
  }
  app.use(buildApiRouter(store.get, store.scheduleSave))
  app.use(buildTelephonyRouter(express.Router(), store.get, store.scheduleSave, config.telephonyWebhookSecret))
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }))
  return { app, store }
}

const isMain = !!process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  const { app } = createApp()
  app.listen(config.port, config.host, () => {
    console.log(`[sakhi-vani] API listening on http://localhost:${config.port}  (demo mode: ${config.demoMode})`)
    console.log('[sakhi-vani] Demo accounts: asha@demo.com / Asha@123  ·  citizen@demo.com / Citizen@123 (synthetic)')
  })
}
