import type { Lang } from '../../shared-types'

/**
 * Server-side Sarvam AI speech-to-text adapter (backend only; API key never reaches the app).
 * NOT VERIFIED in this build — requires SARVAM_API_KEY. Check the current Sarvam API docs for the
 * endpoint, model name and language codes before enabling (values below are configurable).
 */
const LANG: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' }

export async function sarvamTranscribe(audio: Blob, lang: Lang): Promise<{ transcript: string }> {
  const key = process.env.SARVAM_API_KEY
  if (!key) throw new Error('SARVAM_API_KEY is not configured. Use typed input or the demo transcript.')
  const url = process.env.SARVAM_STT_URL ?? 'https://api.sarvam.ai/speech-to-text'
  const form = new FormData()
  form.append('file', audio, 'audio.wav')
  form.append('language_code', LANG[lang])
  if (process.env.SARVAM_STT_MODEL) form.append('model', process.env.SARVAM_STT_MODEL)
  const res = await fetch(url, { method: 'POST', headers: { 'api-subscription-key': key }, body: form })
  if (!res.ok) throw new Error(`Sarvam STT failed: ${res.status}`)
  const json = (await res.json()) as { transcript?: string }
  return { transcript: json.transcript ?? '' }
}
