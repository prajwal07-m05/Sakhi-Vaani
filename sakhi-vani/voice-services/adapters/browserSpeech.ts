import type { Lang } from '../../shared-types'
import { BCP47 } from './types'

/**
 * Browser Web Speech API adapter (real speech recognition where the browser supports it,
 * e.g. Chrome on Android/desktop). Language support depends on the browser + OS; if it is not
 * available, the app shows the limitation and offers typing or the labelled demo transcript.
 */
type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

function ctor(): (new () => Recognition) | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/** True when running inside an iframe (e.g. a design-tool preview), where the mic is usually blocked. */
export function isEmbedded(): boolean {
  try { return typeof window !== 'undefined' && window.self !== window.top } catch { return true }
}

export function isSttAvailable(): boolean {
  return !!ctor()
}

export function startRecognition(lang: Lang, handlers: { onText: (text: string, final: boolean) => void; onEnd: () => void; onError: (msg: string) => void }): () => void {
  const C = ctor()
  if (!C) {
    handlers.onError('Speech recognition is not available in this browser.')
    return () => {}
  }
  const r = new C()
  r.lang = BCP47[lang]
  r.interimResults = true
  r.continuous = true
  let finalText = ''
  r.onresult = (e) => {
    let interim = ''
    finalText = ''
    for (let i = 0; i < e.results.length; i++) {
      const res = e.results[i]
      if (res.isFinal) finalText += res[0].transcript + ' '
      else interim += res[0].transcript
    }
    handlers.onText((finalText + interim).trim(), !interim)
  }
  r.onerror = (e) => {
    const map: Record<string, string> = {
      'not-allowed': isEmbedded()
        ? 'The microphone is blocked because the app is running inside an embedded preview frame. Open the app in its own browser tab to use voice.'
        : 'Microphone permission was denied. Allow microphone access for this site in your browser settings (Safari also needs Siri & Dictation enabled in System Settings).',
      'service-not-allowed': 'Speech service is not allowed in this context.',
      'language-not-supported': 'This language is not supported by the browser speech service.',
      'no-speech': 'No speech was detected. Please try again.',
      network: 'The browser speech service needs an internet connection.',
    }
    handlers.onError(map[e.error] ?? `Speech recognition error: ${e.error}`)
  }
  r.onend = () => handlers.onEnd()
  try {
    r.start()
  } catch (err) {
    handlers.onError(String(err))
  }
  return () => {
    try { r.stop() } catch { /* already stopped */ }
  }
}

export function hasVoiceFor(lang: Lang): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  const code = BCP47[lang].slice(0, 2)
  return window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(code))
}

export function speak(text: string, lang: Lang): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  const u = new SpeechSynthesisUtterance(text)
  u.lang = BCP47[lang]
  const code = BCP47[lang].slice(0, 2)
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(code))
  if (!voice) return false
  u.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
  return true
}

export function stopSpeaking() {
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
}
