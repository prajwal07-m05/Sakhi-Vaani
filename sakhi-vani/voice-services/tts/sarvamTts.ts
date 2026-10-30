import type { Lang } from '../../shared-types'

/**
 * Server-side Sarvam AI text-to-speech adapter. NOT VERIFIED in this build — requires SARVAM_API_KEY.
 * Confirm request/response shape against current Sarvam docs before enabling.
 */
const LANG: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' }

export async function sarvamSpeak(text: string, lang: Lang): Promise<{ audioBase64: string }> {
  const key = process.env.SARVAM_API_KEY
  if (!key) throw new Error('SARVAM_API_KEY is not configured.')
  const url = process.env.SARVAM_TTS_URL ?? 'https://api.sarvam.ai/text-to-speech'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'api-subscription-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: [text], target_language_code: LANG[lang], ...(process.env.SARVAM_TTS_MODEL ? { model: process.env.SARVAM_TTS_MODEL } : {}) }),
  })
  if (!res.ok) throw new Error(`Sarvam TTS failed: ${res.status}`)
  const json = (await res.json()) as { audios?: string[] }
  return { audioBase64: json.audios?.[0] ?? '' }
}
