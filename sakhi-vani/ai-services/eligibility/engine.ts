import type { Answers, Criterion, CriterionOutcome, EligibilityQuestion, EligibilityRule, SchemeAssessment, SchemeStatus } from '../../shared-types'
import { ELIGIBILITY_QUESTIONS, ELIGIBILITY_RULES } from '../../database/demo-data/schemes'

/**
 * Deterministic eligibility engine. Pure functions only — no AI, no randomness.
 * The same functions are used by the citizen dashboard, the calling assistant and the ASHA dashboard.
 */

export const UNSURE = 'unsure'

function normalise(v: unknown): string {
  return String(v ?? '').trim().toLowerCase()
}

export function evaluateCriterion(c: Criterion, answers: Answers): CriterionOutcome {
  if (c.kind === 'anyOf') {
    const outcomes = c.criteria.map((sub) => evaluateCriterion(sub, answers))
    if (outcomes.includes('met')) return 'met'
    if (outcomes.every((o) => o === 'not_met')) return 'not_met'
    return 'unknown'
  }
  const raw = answers[c.key]
  if (raw === undefined || raw === '' || normalise(raw) === UNSURE) return 'unknown'
  if (c.kind === 'equals') return normalise(raw) === normalise(c.value) ? 'met' : 'not_met'
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return 'unknown'
  if (c.kind === 'gte') return n >= c.value ? 'met' : 'not_met'
  return n <= c.value ? 'met' : 'not_met'
}

function unknownKeys(c: Criterion, answers: Answers): string[] {
  if (c.kind === 'anyOf') {
    if (evaluateCriterion(c, answers) !== 'unknown') return []
    return c.criteria.flatMap((s) => unknownKeys(s, answers))
  }
  return evaluateCriterion(c, answers) === 'unknown' ? [c.key] : []
}

export function assessScheme(rule: EligibilityRule, answers: Answers): SchemeAssessment {
  const criteria = rule.criteria.map((c) => ({ id: c.id, label: c.label, outcome: evaluateCriterion(c, answers) }))
  let status: SchemeStatus = 'potentially_eligible'
  if (criteria.some((c) => c.outcome === 'not_met')) status = 'criteria_not_met'
  else if (criteria.some((c) => c.outcome === 'unknown')) status = 'more_info_required'
  const missingKeys = status === 'criteria_not_met' ? [] : Array.from(new Set(rule.criteria.flatMap((c) => unknownKeys(c, answers))))
  return { schemeId: rule.schemeId, status, criteria, missingKeys }
}

export function assessAll(answers: Answers, schemeIds?: string[], rules: EligibilityRule[] = ELIGIBILITY_RULES): SchemeAssessment[] {
  return rules.filter((r) => !schemeIds || schemeIds.length === 0 || schemeIds.includes(r.schemeId)).map((r) => assessScheme(r, answers))
}

/**
 * Picks the next single question to ask. A question is only asked if it can still change
 * the outcome of at least one scheme that has not already failed. Answers of "unsure" are
 * respected and never re-asked.
 */
export function nextQuestion(answers: Answers, schemeIds?: string[], includeDocumentsQuestion = true): EligibilityQuestion | null {
  const results = assessAll(answers, schemeIds)
  const needed = new Set<string>()
  for (const r of results) {
    if (r.status === 'criteria_not_met') continue
    r.missingKeys.forEach((k) => needed.add(k))
  }
  for (const q of ELIGIBILITY_QUESTIONS) {
    if (q.key === 'hasDocuments') continue
    if (needed.has(q.key) && answers[q.key] === undefined) return q
  }
  if (includeDocumentsQuestion && answers.hasDocuments === undefined) {
    return ELIGIBILITY_QUESTIONS.find((q) => q.key === 'hasDocuments') ?? null
  }
  return null
}

export function questionFor(key: string): EligibilityQuestion | undefined {
  return ELIGIBILITY_QUESTIONS.find((q) => q.key === key)
}

const YES = ['yes', 'y', 'haan', 'ha', 'han', 'हाँ', 'हां', 'जी', 'ಹೌದು', 'howdu', 'houdu', 'ok yes']
const NO = ['no', 'n', 'nahi', 'nahin', 'नहीं', 'ना', 'illa', 'ಇಲ್ಲ', 'beda']
const UNSURE_WORDS = ['not sure', 'unsure', "don't know", 'dont know', 'pata nahi', 'पता नहीं', 'मालूम नहीं', 'gottilla', 'ಗೊತ್ತಿಲ್ಲ', 'maybe', 'not certain']
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9,
  एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5, छह: 6, सात: 7, आठ: 8, नौ: 9,
  ಒಂದು: 1, ಎರಡು: 2, ಮೂರು: 3, ನಾಲ್ಕು: 4, ಐದು: 5, ಆರು: 6, ಏಳು: 7, ಎಂಟು: 8, ಒಂಬತ್ತು: 9,
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9,
}

export function parseNumber(text: string): number | undefined {
  const digits = text.match(/\d+(\.\d+)?/)
  if (digits) return Number(digits[0])
  const lower = text.toLowerCase()
  for (const [w, n] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`(^|[^\\p{L}])${w}($|[^\\p{L}])`, 'u').test(lower)) return n
  }
  return undefined
}

export function parseYesNo(text: string): 'yes' | 'no' | 'unsure' | undefined {
  const t = text.trim().toLowerCase()
  if (UNSURE_WORDS.some((w) => t.includes(w))) return 'unsure'
  const words = t.split(/[^\p{L}\p{M}']+/u).filter(Boolean)
  if (words.some((w) => NO.includes(w)) || t.startsWith('no')) return 'no'
  if (words.some((w) => YES.includes(w)) || t.startsWith('yes')) return 'yes'
  return undefined
}

const STATES = ['karnataka', 'kerala', 'tamil nadu', 'andhra pradesh', 'telangana', 'maharashtra', 'goa', 'gujarat', 'rajasthan', 'uttar pradesh', 'bihar', 'west bengal', 'odisha', 'madhya pradesh', 'delhi', 'punjab', 'haryana', 'assam', 'jharkhand', 'chhattisgarh']
export function parseState(text: string): string | undefined {
  const t = text.trim().toLowerCase()
  if (t.includes('ಕರ್ನಾಟಕ') || t.includes('कर्नाटक')) return 'karnataka'
  if (UNSURE_WORDS.some((w) => t.includes(w))) return UNSURE
  return STATES.find((s) => t.includes(s)) ?? (t.length > 1 ? t : undefined)
}

/** Parse a free-text reply into a typed answer for the given question. */
export function parseAnswer(q: EligibilityQuestion, text: string): string | number | undefined {
  if (q.kind === 'yesno') return parseYesNo(text)
  if (q.kind === 'state') return parseState(text)
  if (UNSURE_WORDS.some((w) => text.toLowerCase().includes(w))) return UNSURE
  return parseNumber(text)
}

export const STATUS_LABEL: Record<SchemeStatus, string> = {
  potentially_eligible: 'Potentially eligible',
  more_info_required: 'More information required',
  criteria_not_met: 'Criteria not currently met',
}
