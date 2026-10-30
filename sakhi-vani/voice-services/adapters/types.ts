import type { Lang } from '../../shared-types'

/** Speech provider adapter contracts. Swap implementations without touching the app. */
export interface SttAdapter {
  id: 'browser_speech' | 'sarvam' | 'demo_simulated'
  isAvailable(): boolean
  supports(lang: Lang): boolean
}
export interface TtsAdapter {
  id: 'browser_speech' | 'sarvam' | 'none'
  isAvailable(): boolean
  speak(text: string, lang: Lang): Promise<void>
}
export const BCP47: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' }
