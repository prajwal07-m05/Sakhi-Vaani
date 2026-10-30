import { useEffect, useRef, useState } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Send, Volume2, VolumeX, FlaskConical } from 'lucide-react'
import type { CallSession, CallSummary, Lang } from '../../../shared-types'
import { SCHEMES } from '../../../database/demo-data/schemes'
import { CALL_STATUS_TEXT } from '../../../calling-services/simulator/callEngine'
import { isSttAvailable, startRecognition, speak, stopSpeaking, hasVoiceFor } from '../../../voice-services/adapters/browserSpeech'
import { api } from '../api/client'
import { useApp } from '../ctx'
import { LANG_NAMES } from '../i18n'
import { Badge, Button, Card, Notice, cx } from '../components/ui'

const QUICK: Record<Lang, { ask: string[]; yes: string; no: string; unsure: string; state: string; end: string }> = {
  en: { ask: ['I am pregnant. Are there any government schemes for me?', 'How do I prepare for my next antenatal visit?', 'I want to speak to my ASHA worker', 'When is my next appointment?'], yes: 'Yes', no: 'No', unsure: 'Not sure', state: 'Karnataka', end: 'That is all' },
  hi: { ask: ['मैं गर्भवती हूँ। क्या मेरे लिए कोई सरकारी योजना है?', 'प्रसवपूर्व जांच की तैयारी कैसे करूँ?', 'मुझे अपनी आशा कार्यकर्ता से बात करनी है'], yes: 'हाँ', no: 'नहीं', unsure: 'पता नहीं', state: 'कर्नाटक', end: 'बस इतना' },
  kn: { ask: ['ನಾನು ಗರ್ಭಿಣಿ. ನನಗೆ ಯಾವುದಾದರೂ ಸರ್ಕಾರಿ ಯೋಜನೆ ಇದೆಯೇ?', 'ಪ್ರಸವಪೂರ್ವ ತಪಾಸಣೆಗೆ ಹೇಗೆ ತಯಾರಾಗಲಿ?', 'ನನ್ನ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯೊಂದಿಗೆ ಮಾತನಾಡಬೇಕು'], yes: 'ಹೌದು', no: 'ಇಲ್ಲ', unsure: 'ಗೊತ್ತಿಲ್ಲ', state: 'ಕರ್ನಾಟಕ', end: 'ಅಷ್ಟೇ' },
}

export function CallSimulator() {
  const { lang: uiLang, toast, bump, back } = useApp()
  const [lang, setLang] = useState<Lang>(uiLang)
  const [call, setCall] = useState<CallSession | null>(null)
  const [summary, setSummary] = useState<{ call: CallSession; summary: CallSummary } | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [listening, setListening] = useState(false)
  const [secs, setSecs] = useState(0)
  const stopRef = useRef<() => void>(() => {})
  const bottom = useRef<HTMLDivElement>(null)
  const spokenRef = useRef(0)

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) }, [call?.transcript.length])
  useEffect(() => {
    if (!call || call.state === 'ended') return
    const id = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [call?.id, call?.state])
  useEffect(() => () => { stopRef.current(); stopSpeaking() }, [])
  // Read new assistant lines aloud (only where the device has a voice for the language).
  useEffect(() => {
    if (!call) return
    const fresh = call.transcript.slice(spokenRef.current).filter((t) => t.speaker === 'assistant')
    spokenRef.current = call.transcript.length
    if (voiceOn && fresh.length) speak(fresh.map((t) => t.text).join(' '), call.language)
  }, [call, voiceOn])

  const start = async () => {
    setBusy(true)
    setSummary(null)
    setSecs(0)
    spokenRef.current = 0
    try {
      let c = await api.call('startCall')
      c = await api.call('callTurn', { callId: c.id, text: LANG_NAMES[lang] === 'English' ? 'English' : lang === 'hi' ? 'हिंदी' : 'ಕನ್ನಡ' })
      setCall(c)
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  const say = async (msg: string) => {
    if (!call || !msg.trim()) return
    setBusy(true)
    setText('')
    try {
      const next = await api.call('callTurn', { callId: call.id, text: msg })
      setCall(next)
      if (next.requestId && next.requestId !== call.requestId) bump()
      if (next.state === 'ended') await end(next)
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  const end = async (c = call) => {
    if (!c) return
    stopRef.current()
    const res = await api.call('endCall', { callId: c.id })
    setCall(res.call)
    setSummary(res)
    bump()
  }
  const mic = () => {
    if (listening) { stopRef.current(); setListening(false); return }
    stopSpeaking()
    setListening(true)
    stopRef.current = startRecognition(call?.language ?? lang, { onText: (t) => setText(t), onEnd: () => setListening(false), onError: (m) => { setListening(false); toast(m, 'error') } })
  }
  const q = QUICK[call?.language ?? lang]
  const chips = !call ? [] : call.state === 'eligibility'
    ? call.pendingQuestionKey === 'state' ? [q.state, 'Kerala'] : call.pendingQuestionKey === 'age' ? ['25', q.unsure] : call.pendingQuestionKey === 'pregnancyMonths' ? ['7', q.unsure] : [q.yes, q.no, q.unsure]
    : call.state === 'confirm_request' ? [q.yes, q.no] : [...q.ask, q.end]
  const mm = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

  return (
    <div className="flex min-h-full flex-col bg-navy text-white">
      <div className="sticky top-0 z-20 bg-navy/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <button onClick={() => { stopSpeaking(); back() }} className="text-[14px] font-semibold text-white/70">Close</button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sun px-3 py-1 text-[11.5px] font-extrabold tracking-wide text-navy"><FlaskConical className="size-3.5" /> DEMO CALL SIMULATOR</span>
          <button onClick={() => { setVoiceOn(!voiceOn); stopSpeaking() }} aria-label="Toggle voice" className="grid size-9 place-items-center rounded-full bg-white/10">{voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}</button>
        </div>
        <div className="mt-4 flex flex-col items-center text-center">
          <span className={cx('grid size-16 place-items-center rounded-full', call && call.state !== 'ended' ? 'bg-leaf' : 'bg-white/10')}><Phone className="size-7" /></span>
          <p className="mt-2 text-[20px] font-bold">SAKHI VANI</p>
          <p className="text-[13px] text-white/60">{!call ? 'Not connected — no real phone number is configured' : call.state === 'ended' ? `Call ended · ${mm}` : `Simulated call · ${mm} · ${LANG_NAMES[call.language]}`}</p>
        </div>
      </div>

      <div className="flex-1 px-4 pb-60">
        {!call && (
          <div className="mt-4 space-y-4">
            <Card className="!border-white/10 !bg-white/5 text-white">
              <p className="text-[14px] leading-relaxed text-white/80">This simulator uses the same conversation engine, eligibility rules and ASHA request service that a real telephone line would use. Real telephony (e.g. Exotel) needs a provisioned number, webhooks and credentials, which are not configured here.</p>
            </Card>
            <p className="text-[13px] font-semibold text-white/70">Choose call language</p>
            <div className="grid grid-cols-3 gap-2">{(Object.keys(LANG_NAMES) as Lang[]).map((l) => <button key={l} onClick={() => setLang(l)} className={cx('h-12 rounded-2xl border font-semibold', l === lang ? 'border-white bg-white text-navy' : 'border-white/25 text-white')}>{LANG_NAMES[l]}</button>)}</div>
            <p className="text-[12px] text-white/50">{hasVoiceFor(lang) ? 'Responses will be read aloud using your device voice.' : `Your device has no ${LANG_NAMES[lang]} voice installed — responses will be shown as text only.`} Speech input {isSttAvailable() ? 'uses browser speech recognition where supported.' : 'is not available in this browser; use the reply buttons or typing.'}</p>
            <Button block size="lg" loading={busy} icon={<Phone className="size-5" />} onClick={start}>Start simulated call</Button>
          </div>
        )}
        {call && (
          <div className="mt-2 space-y-2.5">
            {call.transcript.map((tr, i) => (
              <div key={i} className={cx('flex', tr.speaker === 'caller' ? 'justify-end' : 'justify-start')}>
                <div className={cx('max-w-[86%] rounded-3xl px-4 py-2.5 text-[14.5px] leading-snug', tr.speaker === 'caller' ? 'rounded-br-lg bg-leaf text-white' : 'rounded-bl-lg bg-white/10 text-white')}>{tr.text}</div>
              </div>
            ))}
            <div ref={bottom} />
          </div>
        )}
        {summary && (
          <Card className="mt-5 !border-white/10 !bg-white text-ink">
            <p className="text-[12px] font-bold uppercase tracking-wide text-ink/50">Call summary (minimal data)</p>
            <dl className="mt-2 space-y-1.5 text-[13.5px]">
              <p><b>Language:</b> {LANG_NAMES[summary.summary.language]}</p>
              <p><b>Duration:</b> {summary.summary.durationSeconds}s</p>
              <p><b>Topics:</b> {summary.summary.intents.join(', ') || '—'}</p>
              {summary.summary.schemesDiscussed.length > 0 && <p><b>Schemes checked:</b> {summary.summary.schemesDiscussed.map((s) => `${SCHEMES.find((x) => x.id === s.schemeId)?.shortName}: ${CALL_STATUS_TEXT[s.status].en}`).join('; ')}</p>}
              <p><b>ASHA request:</b> {summary.summary.requestId ? <Badge tone="green">Created · {summary.summary.requestId}</Badge> : 'None'}</p>
              <p><b>Transcript:</b> {summary.summary.transcriptRetained ? 'Kept (you opted in)' : 'Deleted from storage at call end (retention setting)'}</p>
            </dl>
            <Button className="mt-3" block onClick={() => { setCall(null); setSummary(null) }}>New call</Button>
          </Card>
        )}
      </div>

      {call && call.state !== 'ended' && (
        <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 bg-gradient-to-t from-navy via-navy to-navy/0 px-3 pb-4 pt-6">
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">{chips.map((c) => <button key={c} disabled={busy} onClick={() => say(c)} className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{c}</button>)}</div>
          <form onSubmit={(e) => { e.preventDefault(); say(text) }} className="flex items-center gap-2">
            <button type="button" onClick={mic} disabled={!isSttAvailable()} aria-label="Speak" className={cx('grid size-12 shrink-0 place-items-center rounded-full disabled:opacity-40', listening ? 'bg-rose' : 'bg-white/15')}>{listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}</button>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say or type…" className="h-12 min-w-0 flex-1 rounded-full bg-white/10 px-4 text-[15px] text-white outline-none placeholder:text-white/40" />
            <button type="submit" disabled={!text.trim() || busy} aria-label="Send" className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-navy disabled:opacity-40"><Send className="size-5" /></button>
            <button type="button" onClick={() => end()} aria-label="End call" className="grid size-12 shrink-0 place-items-center rounded-full bg-rose"><PhoneOff className="size-5" /></button>
          </form>
        </div>
      )}
      {!call && <div className="px-4 pb-6"><Notice tone="amber">No phone number is displayed because no real telephony line is configured.</Notice></div>}
    </div>
  )
}
