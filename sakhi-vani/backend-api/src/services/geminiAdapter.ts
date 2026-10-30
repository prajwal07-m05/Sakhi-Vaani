import type { ExtractedField, RecordType } from '../../../shared-types'
import { RECORD_SCHEMAS } from '../../../database/schemas/recordSchemas'
import { config } from '../config/env'

/**
 * Optional Google Gemini adapter (server-side only — the key never reaches the app).
 * IMPLEMENTED BUT NOT VERIFIED in this build (no key available). Output is strictly validated:
 * only allowed record/field pairs, and evidence must be an exact substring of the transcript.
 * Results are suggestions for the ASHA worker's review — never saved automatically.
 */
export async function geminiSuggestFields(transcript: string, allowed: RecordType[]): Promise<ExtractedField[]> {
  if (!config.geminiApiKey) throw Object.assign(new Error('Gemini is not configured (APP_GEMINI_API_KEY).'), { status: 501 })
  const allowedFields = allowed.flatMap((t) => RECORD_SCHEMAS[t].fields.map((f) => `${t}.${f.key}`))
  const prompt = [
    'Extract structured fields from an ASHA worker visit note. Output JSON only: {"fields":[{"recordType","key","value","evidence"}]}.',
    'Only use these recordType.key pairs: ' + allowedFields.join(', '),
    'evidence MUST be an exact substring of the transcript. Never infer measurements or dates that were not spoken. No diagnoses.',
    'Transcript: """' + transcript + '"""',
  ].join('\n')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } }) })
  if (!res.ok) throw new Error(`Gemini request failed (${res.status})`)
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  let parsed: { fields?: Array<{ recordType: RecordType; key: string; value: string; evidence: string }> } = {}
  try { parsed = JSON.parse(text) } catch { return [] }
  return (parsed.fields ?? [])
    .filter((f) => allowed.includes(f.recordType) && RECORD_SCHEMAS[f.recordType]?.fields.some((d) => d.key === f.key))
    .filter((f) => typeof f.evidence === 'string' && f.evidence.length > 2 && transcript.includes(f.evidence))
    .map((f) => ({ recordType: f.recordType, key: f.key, label: RECORD_SCHEMAS[f.recordType].fields.find((d) => d.key === f.key)!.label, value: String(f.value).slice(0, 300), evidence: f.evidence, confidence: 'medium' as const, source: 'asha_recorded' as const, needsConfirmation: true }))
}
