import { test } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import type { AddressInfo } from 'node:net'

test('backend HTTP: login, auth required, RBAC, area restriction, end-to-end request', async () => {
  const { createApp } = await import('../backend-api/src/server')
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-'))
  const { app } = createApp(path.join(dir, 'db.json'))
  const server = app.listen(0)
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const j = async (method: string, p: string, body?: unknown, token?: string) => {
    const r = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
    return { status: r.status, json: (await r.json()) as Record<string, any> }
  }
  try {
    assert.equal((await j('GET', '/api/health')).json.ok, true)
    assert.equal((await j('GET', '/api/asha/dashboard')).status, 401)
    const asha = await j('POST', '/api/auth/login', { email: 'asha@demo.com', password: 'Asha@123', role: 'asha' })
    const cit = await j('POST', '/api/auth/login', { email: 'citizen@demo.com', password: 'Citizen@123', role: 'citizen' })
    assert.ok(asha.json.token && cit.json.token)
    assert.equal(asha.json.user.passwordHash, undefined)
    assert.equal((await j('GET', '/api/asha/dashboard', undefined, asha.json.token)).json.stats.beneficiaries, 48)
    assert.equal((await j('GET', '/api/asha/dashboard', undefined, cit.json.token)).status, 403)
    assert.equal((await j('GET', '/api/asha/beneficiaries/SYN-901', undefined, asha.json.token)).status, 403)
    assert.equal((await j('GET', '/api/asha/beneficiaries/SYN-001', undefined, 'forged.token.value')).status, 401)
    const q = encodeURIComponent(JSON.stringify({ q: 'SYN-001' }))
    assert.equal((await j('GET', `/api/asha/beneficiaries?input=${q}`, undefined, asha.json.token)).json[0].name, 'Lakshmi')
    const req = await j('POST', '/api/requests', { category: 'Documents', description: 'help', contactMethod: 'phone_call', consentToShare: true, confirmed: true }, cit.json.token)
    assert.equal(req.status, 200)
    const upd = await j('POST', `/api/asha/requests/${req.json.id}/status`, { status: 'IN_PROGRESS' }, asha.json.token)
    assert.equal(upd.json.status, 'IN_PROGRESS')
    assert.equal((await j('GET', '/api/requests', undefined, cit.json.token)).json[0].status, 'IN_PROGRESS')
    assert.equal((await j('POST', '/webhooks/telephony/exotel/incoming', {})).status, 503)
  } finally {
    server.close()
  }
})
