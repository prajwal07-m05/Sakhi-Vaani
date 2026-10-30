import crypto from 'node:crypto'

/** Password hashing with scrypt + per-user random salt. */
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(pw, salt, 32).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const test = crypto.scryptSync(pw, salt, 32)
  const expected = Buffer.from(hash, 'hex')
  return expected.length === test.length && crypto.timingSafeEqual(expected, test)
}
