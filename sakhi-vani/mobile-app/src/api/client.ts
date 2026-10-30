import type { Database, Role, Session } from '../../../shared-types'
import { createService, type PublicUser, type SakhiService } from '../../../core/service'
import { ROUTES, pathParams } from '../../../core/contract'
import { buildSeed } from '../../../database/seed/seed'
import { demoHashPassword, demoVerifyPassword } from '../../../core/demoHash'
import { ServiceError } from '../../../core/errors'

type Svc = SakhiService
export type Method = keyof Svc
export type Input<K extends Method> = Parameters<Svc[K]>[1]
export type Output<K extends Method> = ReturnType<Svc[K]>

export interface ApiClient {
  mode: 'local-demo' | 'http'
  call<K extends Method>(method: K, input?: Input<K>): Promise<Output<K>>
  login(email: string, password: string, role: Role): Promise<PublicUser>
  logout(): void
  session(): Session | null
  resetDemo?(): void
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const DB_KEY = 'sakhi-vani:db:v1'
const SESSION_KEY = 'sakhi-vani:session:v1'
const TOKEN_KEY = 'sakhi-vani:token:v1'

/**
 * Local demo adapter: runs the SAME domain service as the backend, in the browser, persisted to
 * localStorage. Used automatically when VITE_API_URL is not set, so the demo works without a server.
 * Both demo accounts share this store, so ASHA ↔ citizen flows work in one browser.
 */
function createLocalClient(): ApiClient {
  let db: Database
  const load = () => {
    try {
      const raw = localStorage.getItem(DB_KEY)
      if (raw) {
        db = JSON.parse(raw)
        return
      }
    } catch { /* corrupt → reseed */ }
    db = buildSeed(new Date(), demoHashPassword)
    save()
  }
  const save = () => localStorage.setItem(DB_KEY, JSON.stringify(db))
  load()
  let svc = createService(db!, { hashPassword: demoHashPassword, verifyPassword: demoVerifyPassword })
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY) { load(); svc = createService(db, { hashPassword: demoHashPassword, verifyPassword: demoVerifyPassword }) }
  })
  const session = (): Session | null => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') } catch { return null }
  }
  return {
    mode: 'local-demo',
    async call(method, input) {
      await new Promise((r) => setTimeout(r, 120))
      try {
        const fn = svc[method] as (s: Session | null, i: unknown) => unknown
        const out = fn(session(), input ?? {})
        save()
        return JSON.parse(JSON.stringify(out ?? null))
      } catch (e) {
        if (e instanceof ServiceError) throw new ApiError(e.status, e.message)
        throw e
      }
    },
    async login(email, password, role) {
      const { user } = (await this.call('login', { email, password, role })) as unknown as { user: PublicUser }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, role: user.role }))
      return user
    },
    logout() { localStorage.removeItem(SESSION_KEY) },
    session,
    resetDemo() {
      localStorage.removeItem(DB_KEY)
      localStorage.removeItem(SESSION_KEY)
      load()
      svc = createService(db, { hashPassword: demoHashPassword, verifyPassword: demoVerifyPassword })
    },
  }
}

/** HTTP adapter for the Express backend (backend-api). Enabled with VITE_API_URL. */
function createHttpClient(base: string): ApiClient {
  const session = (): Session | null => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') } catch { return null }
  }
  async function call(method: Method, input: Record<string, unknown> = {}) {
    const route = ROUTES[method]
    let path = route.path
    const rest: Record<string, unknown> = { ...input }
    for (const p of pathParams(route.path)) { path = path.replace(`:${p}`, encodeURIComponent(String(rest[p] ?? ''))); delete rest[p] }
    let url = base.replace(/\/$/, '') + path
    const init: RequestInit = { method: route.method, headers: { 'Content-Type': 'application/json' } }
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) (init.headers as Record<string, string>).Authorization = `Bearer ${token}`
    if (route.method === 'GET') {
      const qs = Object.keys(rest).length ? `?input=${encodeURIComponent(JSON.stringify(rest))}` : ''
      url += qs
    } else init.body = JSON.stringify(rest)
    const res = await fetch(url, init)
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new ApiError(res.status, json.error ?? `Request failed (${res.status})`)
    return json
  }
  return {
    mode: 'http',
    call: ((method: Method, input?: Record<string, unknown>) => call(method, input)) as ApiClient['call'],
    async login(email, password, role) {
      const { user, token } = (await call('login', { email, password, role })) as { user: PublicUser; token: string }
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, role: user.role }))
      return user
    },
    logout() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(SESSION_KEY) },
    session,
  }
}

const apiUrl = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL
export const api: ApiClient = apiUrl ? createHttpClient(apiUrl) : createLocalClient()
