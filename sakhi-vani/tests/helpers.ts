import { buildSeed } from '../database/seed/seed'
import { createService } from '../core/service'
import { demoHashPassword, demoVerifyPassword } from '../core/demoHash'

export const ASHA = { userId: 'USR-ASHA-001', role: 'asha' as const }
export const CITIZEN = { userId: 'USR-CIT-001', role: 'citizen' as const }

export function fresh(now = new Date(), clock: Date = now) {
  const db = buildSeed(now, demoHashPassword)
  const svc = createService(db, { hashPassword: demoHashPassword, verifyPassword: demoVerifyPassword, now: () => clock })
  return { db, svc }
}

export const LAKSHMI_TRANSCRIPT = 'Today I visited Lakshmi. She is seven months pregnant. She attended her previous antenatal check-up. She reported some discomfort and needs a follow-up visit next week.'
