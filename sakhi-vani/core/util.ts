/** Date + id helpers shared by every layer. Dates are local calendar dates (YYYY-MM-DD). */
export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return isoDate(dt)
}

export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number)
  const [y2, m2, d2] = to.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

let counter = 0
export function newId(prefix: string): string {
  counter = (counter + 1) % 1e6
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase()
}

export function formatDate(date?: string): string {
  if (!date) return '—'
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return date
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Next calendar date on which the day-of-month equals `day` (inclusive of today). */
export function nextDayOfMonth(today: string, day: number): string {
  const [y, m, d] = today.split('-').map(Number)
  if (d <= day) return isoDate(new Date(y, m - 1, day))
  return isoDate(new Date(y, m, day))
}
