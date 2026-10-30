import type { BeneficiaryCategory, ExtractedField, ExtractionResult, MissingItem, RecordType } from '../../shared-types'
import { RECORD_SCHEMAS, recordTypesFor } from '../../database/schemas/recordSchemas'
import { addDays } from '../../core/util'
import { parseNumber } from '../eligibility/engine'

/**
 * ASHA Documentation Agent (rule-based engine).
 * Extracts visit details from a transcript and maps them to record fields.
 * Rules: never invent values; every extracted field carries the evidence text it came from;
 * nothing here is saved — output is a DRAFT that requires human review and approval.
 */
export interface ExtractionContext {
  beneficiaryName: string
  category: BeneficiaryCategory
  today: string
  existing?: Partial<Record<RecordType, Record<string, string>>>
}

const has = (t: string, words: string[]) => words.some((w) => t.includes(w))

function sentenceWith(transcript: string, words: string[]): string {
  const sentences = transcript.split(/(?<=[.!?।])\s+/)
  const lower = sentences.map((s) => s.toLowerCase())
  const i = lower.findIndex((s) => has(s, words))
  return (i >= 0 ? sentences[i] : transcript).trim().slice(0, 220)
}

const CONCERNS: Array<{ label: string; words: string[] }> = [
  { label: 'discomfort', words: ['discomfort', 'uneasy', 'असुविधा', 'तकलीफ', 'ಅಸ್ವಸ್ಥತೆ', 'ತೊಂದರೆ'] },
  { label: 'pain', words: ['pain', 'ache', 'दर्द', 'ನೋವು'] },
  { label: 'tiredness', words: ['tired', 'weak', 'fatigue', 'थकान', 'कमज़ोरी', 'ಸುಸ್ತು', 'ಆಯಾಸ'] },
  { label: 'vomiting / nausea', words: ['vomit', 'nausea', 'उल्टी', 'ವಾಂತಿ'] },
  { label: 'cough / cold', words: ['cough', 'cold', 'खांसी', 'ಕೆಮ್ಮು'] },
  { label: 'fever', words: ['fever', 'बुखार', 'ಜ್ವರ'] },
  { label: 'dizziness', words: ['dizzy', 'dizziness', 'चक्कर', 'ತಲೆತಿರುಗು'] },
  { label: 'not feeding well', words: ['not feeding', 'not drinking milk', 'दूध नहीं', 'ಹಾಲು ಕುಡಿಯುತ್ತಿಲ್ಲ'] },
]

/** Danger signs (MCP card) — flagged for urgent guidance, never diagnosed. */
const DANGER: Array<{ label: string; words: string[] }> = [
  { label: 'Bleeding reported', words: ['bleeding', 'blood loss', 'खून आ', 'रक्तस्राव', 'ರಕ್ತಸ್ರಾವ'] },
  { label: 'Severe headache / blurred vision reported', words: ['severe headache', 'blurred vision', 'तेज़ सिरदर्द', 'ತೀವ್ರ ತಲೆನೋವು'] },
  { label: 'Fits / convulsions reported', words: ['fits', 'convulsion', 'seizure', 'दौरे', 'ಸೆಳವು'] },
  { label: 'Swelling of face or hands reported', words: ['swelling of face', 'swollen face', 'swelling in hands', 'चेहरे पर सूजन', 'ಮುಖ ಊತ'] },
  { label: 'Reduced baby movement reported', words: ['baby not moving', 'reduced movement', 'less movement', 'हलचल कम', 'ಚಲನೆ ಕಡಿಮೆ'] },
  { label: 'Leaking water reported', words: ['leaking water', 'water broke', 'पानी गिर', 'ನೀರು ಸೋರ'] },
  { label: 'Fast breathing / difficulty breathing reported', words: ['fast breathing', 'difficulty breathing', 'breathless', 'साँस लेने में', 'ಉಸಿರಾಟದ ತೊಂದರೆ'] },
  { label: 'High fever reported', words: ['high fever', 'तेज़ बुखार', 'ಹೆಚ್ಚು ಜ್ವರ'] },
]

export function extractVisitDetails(transcript: string, ctx: ExtractionContext): ExtractionResult {
  const text = transcript.trim()
  const t = text.toLowerCase()
  const allowed = new Set(recordTypesFor(ctx.category))
  const fields: ExtractedField[] = []
  const missing: MissingItem[] = []
  const notes: string[] = []
  const add = (f: Omit<ExtractedField, 'label'>) => {
    if (!allowed.has(f.recordType)) return
    const label = RECORD_SCHEMAS[f.recordType].fields.find((d) => d.key === f.key)?.label ?? f.key
    fields.push({ ...f, label })
  }
  const miss = (recordType: RecordType, key: string, message: string) => {
    if (!allowed.has(recordType)) return
    const label = RECORD_SCHEMAS[recordType].fields.find((d) => d.key === key)?.label ?? key
    missing.push({ recordType, key, label, message })
  }

  if (!text) {
    return { fields: [], missing: [], urgentFlags: [], notes: ['Transcript is empty — speak again or type the visit details.'], engine: 'rule_based', beneficiaryNameMentioned: false }
  }

  const nameMentioned = t.includes(ctx.beneficiaryName.toLowerCase().split(' ')[0])
  if (!nameMentioned) notes.push(`The beneficiary's name (${ctx.beneficiaryName}) was not mentioned. Confirm this note is for the correct person.`)

  // Visit date
  const yesterday = has(t, ['yesterday', 'ನಿನ್ನೆ'])
  const todayWord = has(t, ['today', 'आज', 'ಇಂದು'])
  add({
    recordType: 'ASHA_DIARY', key: 'visitDateTime',
    value: yesterday ? addDays(ctx.today, -1) : ctx.today,
    evidence: yesterday ? sentenceWith(text, ['yesterday', 'ನಿನ್ನೆ']) : todayWord ? sentenceWith(text, ['today', 'आज', 'ಇಂದು']) : 'Not stated — defaulted to today',
    confidence: todayWord || yesterday ? 'high' : 'low', source: 'asha_recorded', needsConfirmation: !(todayWord || yesterday),
  })

  // Purpose
  const purpose = ctx.category === 'pregnant' ? 'Antenatal home visit' : ctx.category === 'postnatal' ? 'Postnatal home visit' : ctx.category === 'newborn' ? 'HBNC home visit' : ctx.category === 'child' ? 'Child health / immunisation follow-up visit' : ctx.category === 'elderly' ? 'Elderly care visit' : 'Home visit'
  add({ recordType: 'ASHA_DIARY', key: 'purpose', value: purpose, evidence: `Based on beneficiary category (${ctx.category})`, confidence: 'medium', source: 'asha_recorded', needsConfirmation: true })

  // Pregnancy
  const pregWords = ['pregnant', 'गर्भवती', 'ಗರ್ಭಿಣಿ']
  if (has(t, pregWords)) {
    add({ recordType: 'VHR', key: 'pregnancyStatus', value: 'Pregnant', evidence: sentenceWith(text, pregWords), confidence: 'high', source: 'beneficiary_reported' })
  }
  const monthMatch = text.match(/([\p{L}\p{M}\d]+)\s*(?:-\s*)?(months?|mahine|महीने|महीना|ತಿಂಗಳು|ತಿಂಗಳ)/iu)
  if (monthMatch) {
    const n = parseNumber(monthMatch[1])
    if (n && n >= 1 && n <= 10 && ctx.category === 'pregnant') {
      const ev = sentenceWith(text, [monthMatch[0].toLowerCase()])
      add({ recordType: 'VHR', key: 'pregnancyMonth', value: `${n} months (reported)`, evidence: ev, confidence: 'high', source: 'beneficiary_reported' })
      add({ recordType: 'MATERNAL', key: 'pregnancyStage', value: `${n} months (reported)`, evidence: ev, confidence: 'high', source: 'beneficiary_reported' })
    }
  }

  // ANC
  const ancWords = ['antenatal', 'anc', 'check-up', 'checkup', 'check up', 'जांच', 'ತಪಾಸಣೆ']
  if (has(t, ancWords)) {
    const attended = has(t, ['attended', 'completed', 'went', 'had her', 'did her', 'गई थी', 'करवाई', 'ಹೋಗಿದ್ದರು', 'ಮಾಡಿಸಿಕೊಂಡರು'])
    add({
      recordType: 'MATERNAL', key: 'ancVisits',
      value: attended ? 'Previous ANC check-up reported as attended (date and details not stated)' : 'ANC check-up mentioned — details not stated',
      evidence: sentenceWith(text, ancWords), confidence: 'medium', source: 'beneficiary_reported', needsConfirmation: true,
    })
    miss('MATERNAL', 'ancVisits', 'ANC visit details (date, facility) need confirmation from the MCP card.')
  }

  // Concerns
  const concerns = CONCERNS.filter((c) => has(t, c.words))
  if (concerns.length) {
    const ev = sentenceWith(text, concerns.flatMap((c) => c.words))
    const v = `Reported: ${concerns.map((c) => c.label).join(', ')}`
    add({ recordType: 'ASHA_DIARY', key: 'reportedConcerns', value: v, evidence: ev, confidence: 'high', source: 'beneficiary_reported' })
    add({ recordType: 'MATERNAL', key: 'reportedSymptoms', value: v, evidence: ev, confidence: 'high', source: 'beneficiary_reported' })
    add({ recordType: 'POSTNATAL', key: 'recoveryReported', value: v, evidence: ev, confidence: 'medium', source: 'beneficiary_reported' })
    add({ recordType: 'HBNC', key: 'reportedConcerns', value: v, evidence: ev, confidence: 'medium', source: 'beneficiary_reported' })
    add({ recordType: 'IMMUNISATION', key: 'reportedConcerns', value: v, evidence: ev, confidence: 'medium', source: 'beneficiary_reported' })
    add({ recordType: 'ELDERLY', key: 'reportedConcerns', value: v, evidence: ev, confidence: 'medium', source: 'beneficiary_reported' })
  }
  const urgentFlags = DANGER.filter((d) => has(t, d.words)).map((d) => d.label)

  // Measurements: only captured if explicitly stated with a number.
  const bp = text.match(/(?:bp|blood pressure|बीपी|ಬಿಪಿ)\D{0,15}(\d{2,3})\s*(?:\/|over|by)\s*(\d{2,3})/i)
  const bpTarget: RecordType = ctx.category === 'elderly' ? 'ELDERLY' : 'MATERNAL'
  if (bp) {
    add({ recordType: bpTarget, key: 'bp', value: `${bp[1]}/${bp[2]} mmHg — confirm who measured it`, evidence: sentenceWith(text, [bp[0].toLowerCase()]), confidence: 'medium', source: 'measured', needsConfirmation: true })
  } else {
    miss(bpTarget, 'bp', 'BP measurement has not been provided. Leave empty unless measured by an authorised person.')
  }
  const wt = text.match(/(?:weight|weighs|वजन|ತೂಕ)\D{0,12}(\d{1,3}(?:\.\d)?)\s*(?:kg|kilo|किलो|ಕೆಜಿ)/i)
  if (wt) add({ recordType: 'MATERNAL', key: 'weight', value: `${wt[1]} kg — confirm it was measured`, evidence: sentenceWith(text, [wt[0].toLowerCase()]), confidence: 'medium', source: 'measured', needsConfirmation: true })

  // Counselling / services / observations
  const counselWords = ['counsel', 'advised', 'explained', 'told her', 'nutrition', 'diet', 'समझाया', 'सलाह', 'ತಿಳಿಸಿದೆ', 'ಸಲಹೆ']
  if (has(t, counselWords)) add({ recordType: 'ASHA_DIARY', key: 'counselling', value: sentenceWith(text, counselWords), evidence: sentenceWith(text, counselWords), confidence: 'medium', source: 'asha_recorded' })
  const serviceWords = ['ifa', 'iron tablet', 'tablets given', 'gave', 'distributed', 'ನೀಡಿದೆ']
  if (has(t, serviceWords)) add({ recordType: 'ASHA_DIARY', key: 'servicesProvided', value: sentenceWith(text, serviceWords), evidence: sentenceWith(text, serviceWords), confidence: 'medium', source: 'asha_recorded' })
  const obsWords = ['i noticed', 'i observed', 'observed', 'देखा', 'ಗಮನಿಸಿದೆ']
  if (has(t, obsWords)) add({ recordType: 'ASHA_DIARY', key: 'observations', value: `${sentenceWith(text, obsWords)} (observation, not a diagnosis)`, evidence: sentenceWith(text, obsWords), confidence: 'medium', source: 'asha_recorded' })

  // Category-specific
  const feedWords = ['breastfeed', 'feeding', 'स्तनपान', 'ಹಾಲುಣಿಸ']
  if (has(t, feedWords)) add({ recordType: 'HBNC', key: 'feedingReported', value: sentenceWith(text, feedWords), evidence: sentenceWith(text, feedWords), confidence: 'medium', source: 'beneficiary_reported' })
  if (has(t, feedWords)) add({ recordType: 'POSTNATAL', key: 'breastfeedingConcerns', value: sentenceWith(text, feedWords), evidence: sentenceWith(text, feedWords), confidence: 'low', source: 'beneficiary_reported', needsConfirmation: true })
  const vacWords = ['vaccin', 'immunis', 'immuniz', 'टीका', 'ಲಸಿಕೆ']
  if (has(t, vacWords)) {
    add({ recordType: 'IMMUNISATION', key: 'scheduledAppointments', value: sentenceWith(text, vacWords), evidence: sentenceWith(text, vacWords), confidence: 'low', source: 'asha_recorded', needsConfirmation: true })
    if (allowed.has('IMMUNISATION')) notes.push('Vaccines given must be confirmed from the MCP card — voice notes are not an immunisation record.')
  }
  const medWords = ['medicine', 'tablet', 'दवा', 'ಔಷಧ', 'ಮಾತ್ರೆ']
  if (has(t, medWords)) add({ recordType: 'ELDERLY', key: 'medicationReported', value: `As reported by beneficiary: ${sentenceWith(text, medWords)}`, evidence: sentenceWith(text, medWords), confidence: 'medium', source: 'beneficiary_reported' })

  // Referral
  const refWords = ['refer', 'रेफर', 'ರೆಫರ್']
  if (has(t, refWords)) add({ recordType: 'ASHA_DIARY', key: 'referral', value: sentenceWith(text, refWords), evidence: sentenceWith(text, refWords), confidence: 'medium', source: 'asha_recorded', needsConfirmation: true })

  // Follow-up + next visit
  const fuWords = ['follow-up', 'follow up', 'followup', 'visit again', 'come again', 'फॉलो', 'दोबारा', 'फिर से', 'ಮತ್ತೆ', 'ಫಾಲೋ']
  if (has(t, fuWords)) {
    const ev = sentenceWith(text, fuWords)
    add({ recordType: 'ASHA_DIARY', key: 'followUpRequired', value: 'Yes', evidence: ev, confidence: 'high', source: 'asha_recorded' })
    add({ recordType: 'VHR', key: 'followUpStatus', value: 'Follow-up required', evidence: ev, confidence: 'high', source: 'asha_recorded' })
    add({ recordType: 'MATERNAL', key: 'followUpStatus', value: 'Follow-up required', evidence: ev, confidence: 'high', source: 'asha_recorded' })
  }
  const explicitDate = text.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  const tomorrow = has(t, ['tomorrow', 'ನಾಳೆ'])
  const nextWeek = has(t, ['next week', 'अगले हफ्ते', 'अगले सप्ताह', 'ಮುಂದಿನ ವಾರ'])
  const inDays = t.match(/in (\d{1,2}) days/)
  let nextDate: string | undefined
  let dateEvidence = ''
  let confirmed = false
  if (explicitDate) { nextDate = explicitDate[1]; dateEvidence = sentenceWith(text, [explicitDate[1]]); confirmed = true }
  else if (tomorrow) { nextDate = addDays(ctx.today, 1); dateEvidence = sentenceWith(text, ['tomorrow', 'ನಾಳೆ']); confirmed = true }
  else if (inDays) { nextDate = addDays(ctx.today, Number(inDays[1])); dateEvidence = sentenceWith(text, [inDays[0]]); confirmed = true }
  else if (nextWeek) { nextDate = addDays(ctx.today, 7); dateEvidence = sentenceWith(text, ['next week', 'अगले', 'ಮುಂದಿನ ವಾರ']) }

  if (nextDate) {
    const f = { value: nextDate, evidence: dateEvidence, confidence: confirmed ? ('high' as const) : ('low' as const), source: 'asha_recorded' as const, needsConfirmation: !confirmed }
    add({ recordType: 'ASHA_DIARY', key: 'nextVisitDate', ...f })
    add({ recordType: 'VHR', key: 'nextVisitDate', ...f })
    if (!confirmed) {
      notes.push('"Next week" was mentioned — a suggested date is pre-filled but must be confirmed.')
      miss('ASHA_DIARY', 'nextVisitDate', 'Suggested follow-up date needs confirmation (only "next week" was said).')
    }
  } else {
    miss('ASHA_DIARY', 'nextVisitDate', 'Next visit date is missing.')
  }

  if (ctx.category === 'pregnant' && !ctx.existing?.MATERNAL?.edd) miss('MATERNAL', 'edd', 'EDD is not recorded and was not mentioned. Confirm from the MCP card or facility.')
  if (urgentFlags.length) notes.push('Danger signs were mentioned. Advise prompt professional medical assessment / call 108. This is not a diagnosis.')

  return { fields, missing, urgentFlags, notes, engine: 'rule_based', beneficiaryNameMentioned: nameMentioned }
}

/** Demo transcripts for the clearly-labelled simulated speech fallback. */
export const DEMO_TRANSCRIPTS: Record<'en' | 'hi' | 'kn', (name: string) => string> = {
  en: (n) => `Today I visited ${n}. She is seven months pregnant. She attended her previous antenatal check-up. She reported some discomfort and needs a follow-up visit next week. I advised her about nutrition and rest.`,
  hi: (n) => `आज मैं ${n} से मिली। वह सात महीने की गर्भवती है। वह पिछली जांच के लिए गई थी। उसने कुछ असुविधा बताई और अगले हफ्ते फॉलो-अप की ज़रूरत है।`,
  kn: (n) => `ಇಂದು ನಾನು ${n} ಅವರನ್ನು ಭೇಟಿ ಮಾಡಿದೆ. ಅವರು ಏಳು ತಿಂಗಳ ಗರ್ಭಿಣಿ. ಹಿಂದಿನ ತಪಾಸಣೆಗೆ ಹೋಗಿದ್ದರು. ಸ್ವಲ್ಪ ಅಸ್ವಸ್ಥತೆ ಇದೆ ಎಂದು ಹೇಳಿದರು, ಮುಂದಿನ ವಾರ ಮತ್ತೆ ಭೇಟಿ ಬೇಕು.`,
}
