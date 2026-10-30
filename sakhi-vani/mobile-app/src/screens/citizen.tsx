import { useEffect, useMemo, useRef, useState } from 'react'
import {
  UserRound, MessageCircle, Landmark, ClipboardCheck, PhoneCall, HeartPulse, Baby, PersonStanding, CalendarClock, HandHeart, Bell, Mic, MicOff, Send, ExternalLink,
  Check, X, CircleHelp, ShieldCheck, Siren, BookOpen, Volume2, ChevronRight, Lock, Trash2, Sparkles,
} from 'lucide-react'
import type { Answers, AssistanceRequest, EligibilityAssessment, EligibilityQuestion, Lang, Scheme, SchemeAssessment } from '../../../shared-types'
import { RECORD_SCHEMAS, fieldsFor, CATEGORY_LABEL } from '../../../database/schemas/recordSchemas'
import { KNOWLEDGE, UIP_SCHEDULE, EMERGENCY_GUIDANCE } from '../../../database/demo-data/knowledge'
import { STATUS_LABEL } from '../../../ai-services/eligibility/engine'
import { formatDate, nextDayOfMonth, isoDate } from '../../../core/util'
import { isSttAvailable, startRecognition, speak, hasVoiceFor } from '../../../voice-services/adapters/browserSpeech'
import { api } from '../api/client'
import { useApp, useLoad } from '../ctx'
import { Badge, Button, Card, DemoBadge, Empty, ErrorBox, Field, Input, Loading, Modal, Notice, ProvenanceBadge, Screen, Section, Select, Textarea, cx, type Tone } from '../components/ui'
import { DOC_LABEL, DOC_TONE, DocumentRow, REQ_LABEL, REQ_TONE } from './asha'
import { Check as CheckBox } from './common'

const STATUS_TONE: Record<SchemeAssessment['status'], Tone> = { potentially_eligible: 'green', more_info_required: 'amber', criteria_not_met: 'gray' }

// ---------------- Home ----------------
export function CitizenHome() {
  const { t, push, tab, lang } = useApp()
  const { data, error, loading, reload } = useLoad(() => api.call('citizenOverview'))
  const schemes = useLoad(() => api.call('listSchemes'))
  if (loading && !data) return <Loading />
  if (error || !data) return <div className="p-4"><ErrorBox message={error ?? ''} onRetry={reload} /></div>
  const relevant = (schemes.data?.schemes ?? []).filter((s) => s.reasons.length)
  const tiles = [
    { icon: <UserRound />, label: t('myHealthProfile'), to: 'profile', tone: 'bg-mist-soft text-mist' },
    { icon: <MessageCircle />, label: t('healthAssistant'), to: 'assistant', tone: 'bg-leaf-soft text-leaf' },
    { icon: <Landmark />, label: t('govSchemes'), to: 'schemes', tone: 'bg-sun-soft text-[#8A5A08]' },
    { icon: <ClipboardCheck />, label: t('checkEligibility'), to: 'eligibility', tone: 'bg-leaf-soft text-leaf' },
    { icon: <PhoneCall />, label: t('callSakhi'), to: 'call', tone: 'bg-navy text-white' },
    { icon: <HeartPulse />, label: t('pregnancySupport'), to: 'maternal', tone: 'bg-rose-soft text-rose' },
    { icon: <Baby />, label: t('childHealth'), to: 'child', tone: 'bg-mist-soft text-mist' },
    { icon: <PersonStanding />, label: t('elderlyCare'), to: 'elderly', tone: 'bg-sun-soft text-[#8A5A08]' },
    { icon: <CalendarClock />, label: t('appointments'), to: 'appointments', tone: 'bg-leaf-soft text-leaf' },
    { icon: <HandHeart />, label: t('requestAsha'), to: 'requestAsha', tone: 'bg-rose-soft text-rose' },
    { icon: <Bell />, label: t('notifications'), to: 'alerts', tone: 'bg-mist-soft text-mist' },
  ]
  return (
    <div className="pb-28">
      <div className="relative overflow-hidden bg-leaf px-4 pb-12 pt-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-16 size-52 rounded-full bg-white/10" />
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/70">Sakhi Care</p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight">{t('hello')}, {data.user.name}</h1>
        <p className="text-[14px] text-white/80">{t('howCanWeHelp')}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.beneficiary && <Badge className="bg-white/15 text-white">ID {data.beneficiary.id}</Badge>}
          {data.beneficiary?.synthetic && <Badge tone="amber">{t('demoData')}</Badge>}
          {data.assignedAsha && <Badge className="bg-white/15 text-white">ASHA: {data.assignedAsha.name}</Badge>}
        </div>
      </div>
      <div className="-mt-7 space-y-3 px-4">
        <button onClick={() => push('assistant')} className="flex h-16 w-full items-center gap-3 rounded-2xl border border-line bg-white px-4 text-left shadow-[0_10px_30px_-18px_rgba(19,41,75,0.5)]">
          <span className="grid size-10 place-items-center rounded-full bg-leaf text-white"><Mic className="size-5" /></span>
          <span className="flex-1"><span className="block font-semibold text-ink">{t('assistant')}</span><span className="text-[12.5px] text-ink/55">Speak or type — private conversation</span></span>
          <ChevronRight className="size-5 text-ink/35" />
        </button>
        {data.nextAppointment && (
          <Card onClick={() => push('appointments')} className="flex items-center gap-3 !p-4">
            <span className="grid size-11 place-items-center rounded-2xl bg-mist-soft text-mist"><CalendarClock className="size-5" /></span>
            <span className="flex-1"><span className="block text-[12px] font-semibold uppercase tracking-wide text-ink/50">Next appointment / visit</span><span className="block text-[17px] font-bold text-ink">{formatDate(data.nextAppointment)}</span></span>
            <ChevronRight className="size-5 text-ink/35" />
          </Card>
        )}
        {relevant.length > 0 && (
          <button onClick={() => tab('schemes')} className="w-full rounded-3xl bg-navy p-4 text-left text-white">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/60">{t('govSchemes')}</p>
            <p className="mt-1 text-[17px] font-bold leading-snug">{t('schemesForYou')}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">{relevant.slice(0, 5).map((s) => <span key={s.id} className="rounded-full bg-white/12 px-2.5 py-1 text-[12px] font-semibold">{s.shortName}</span>)}</div>
            <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-sun">See why they may apply <ChevronRight className="size-4" /></span>
          </button>
        )}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {tiles.map((x) => (
            <button key={x.to} onClick={() => (x.to === 'alerts' || x.to === 'schemes' || x.to === 'assistant' || x.to === 'profile' ? tab(x.to) : push(x.to))} className="flex min-h-[112px] flex-col justify-between rounded-3xl border border-line bg-white p-4 text-left transition active:scale-[0.98] hover:border-leaf/40">
              <span className={cx('grid size-11 place-items-center rounded-2xl [&>svg]:size-5', x.tone)}>{x.icon}</span>
              <span className="text-[14.5px] font-semibold leading-tight text-ink">{x.label}</span>
            </button>
          ))}
        </div>
        <a href={`tel:${EMERGENCY_GUIDANCE.ambulance}`} className="flex items-center gap-3 rounded-2xl border border-rose/30 bg-rose-soft p-3.5 text-rose">
          <Siren className="size-5 shrink-0" /><span className="text-[14px] font-semibold">{t('emergencyLine')}</span>
        </a>
        <p className="px-1 text-[11.5px] text-ink/45">{lang !== 'en' ? 'Some detailed health content is shown in English. ' : ''}SAKHI VANI gives general information and does not replace a doctor.</p>
      </div>
    </div>
  )
}

// ---------------- Health profile ----------------
export function HealthProfile() {
  const { push, toast, bump } = useApp()
  const { data, loading, reload } = useLoad(() => api.call('citizenOverview'))
  const [report, setReport] = useState('')
  const [share, setShare] = useState(false)
  const [urgent, setUrgent] = useState(false)
  if (loading && !data) return <Loading />
  if (!data) return null
  const b = data.beneficiary
  const shareRecords = data.consents.find((c) => c.type === 'share_records_with_asha')?.granted
  const shareSelf = data.consents.find((c) => c.type === 'share_self_reports_with_asha')?.granted
  const submit = async () => {
    try {
      const r = await api.call('addSelfReport', { text: report, share })
      setUrgent(r.urgent)
      toast(r.shareBlockedByConsent ? 'Saved privately. Turn on sharing in Settings to share with your ASHA.' : r.sharedWithAsha ? 'Saved and shared with your ASHA worker' : 'Saved privately', 'ok')
      setReport(''); reload(); bump()
    } catch (e) { toast((e as Error).message, 'error') }
  }
  return (
    <Screen title="My Health Profile" noBack>
      <Card className="!p-5">
        <div className="flex items-center justify-between"><p className="text-[22px] font-bold text-ink">{data.user.name}</p>{b?.synthetic && <DemoBadge />}</div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
          <Pair label="Beneficiary ID" value={b?.id ?? 'Not linked'} />
          <Pair label="Household ID" value={b?.householdId ?? '—'} />
          <Pair label="Age" value={`${data.profile?.age ?? '—'}`} />
          <Pair label="Village" value={`${data.profile?.village}, ${data.profile?.state}`} />
          <Pair label="Category" value={b ? CATEGORY_LABEL[b.category] : '—'} />
          <Pair label="Assigned ASHA" value={data.assignedAsha ? `${data.assignedAsha.name} (${data.assignedAsha.workerId})` : 'None'} />
        </dl>
      </Card>
      <Section title="What you share, and with whom">
        <Card className="space-y-2 text-[13.5px] text-ink/75">
          <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" /> Health records: {shareRecords ? <b>shared with {data.assignedAsha?.name ?? 'your ASHA worker'}</b> : <b>not shared</b>}</p>
          <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" /> Things you report yourself: <b>{shareSelf ? 'can be shared when you choose' : 'private'}</b></p>
          <p className="flex items-start gap-2"><Lock className="mt-0.5 size-4 shrink-0 text-leaf" /> Assistant and pregnancy conversations: <b>always private</b></p>
          <Button size="sm" variant="secondary" onClick={() => push('settings')}>Change sharing choices</Button>
        </Card>
      </Section>
      {data.recordTypes.filter((r) => r !== 'ASHA_DIARY').map((rt) => {
        const rec = data.records.find((r) => r.type === rt)
        const defs = b ? fieldsFor(rt, b.category).filter((d) => rec?.fields[d.key]) : []
        return (
          <Section key={rt} title={RECORD_SCHEMAS[rt].title}>
            <Card className="!p-0">
              {defs.length ? defs.map((d) => (
                <div key={d.key} className="border-b border-line px-4 py-3 last:border-0">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink/45">{d.label}</p>
                  <p className="text-[14.5px] text-ink">{d.kind === 'date' ? formatDate(rec!.fields[d.key].value) : rec!.fields[d.key].value}</p>
                  <div className="mt-1"><ProvenanceBadge source={rec!.fields[d.key].source} voice={rec!.fields[d.key].viaVoiceReview} /></div>
                </div>
              )) : <p className="p-4 text-sm text-ink/50">Nothing recorded yet.</p>}
            </Card>
          </Section>
        )
      })}
      <Section title="Report something yourself">
        <Card className="space-y-3">
          <Textarea value={report} onChange={(e) => setReport(e.target.value)} placeholder="e.g. I have had mild back pain since yesterday" />
          <CheckBox label={`Share this with my ASHA worker${shareSelf ? '' : ' (sharing is off in Settings)'}`} checked={share} onChange={setShare} />
          <Button block disabled={!report.trim()} onClick={submit}>Save</Button>
          {urgent && <Notice tone="red" icon={<Siren className="size-4" />} title="This may need urgent care">Please call {EMERGENCY_GUIDANCE.ambulance} or {EMERGENCY_GUIDANCE.emergency}, or go to the nearest health facility now. This app cannot assess symptoms.</Notice>}
        </Card>
      </Section>
      <Section title="Documents">
        <div className="space-y-2">{data.documents.map((d) => <DocumentRow key={d.id} d={d} role="citizen" onChange={reload} />)}{!data.documents.length && <p className="text-sm text-ink/50">No documents listed.</p>}</div>
      </Section>
      <Section title="Health timeline">
        <Card className="!p-0">
          {data.timeline.slice(0, 12).map((e, i) => (
            <div key={i} className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-leaf" />
              <div className="flex-1"><p className="text-[13.5px] font-semibold text-ink">{e.kind}: <span className="font-normal">{e.text}</span></p><div className="mt-0.5 flex items-center gap-2"><span className="text-[12px] text-ink/50">{formatDate(e.at.slice(0, 10))}</span><ProvenanceBadge source={e.source} /></div></div>
            </div>
          ))}
          {!data.timeline.length && <p className="p-4 text-sm text-ink/50">No events yet.</p>}
        </Card>
      </Section>
      <Button className="mt-5" block variant="secondary" onClick={() => push('requests')}>My assistance requests ({data.requests.length})</Button>
      <Button className="mt-2" block variant="ghost" onClick={() => push('settings')}>Settings</Button>
    </Screen>
  )
}
const Pair = ({ label, value }: { label: string; value: string }) => <div><dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink/45">{label}</dt><dd className="mt-0.5 font-medium text-ink">{value}</dd></div>

// ---------------- Schemes ----------------
function LevelBadge({ s }: { s: Scheme }) {
  return <Badge tone={s.level === 'central' ? 'blue' : 'navy'}>{s.level === 'central' ? 'Central scheme' : 'Karnataka state scheme'}</Badge>
}

export function Schemes() {
  const { t, push } = useApp()
  const { data, loading } = useLoad(() => api.call('listSchemes'))
  if (loading && !data) return <Loading />
  const latest = data?.latestAssessment
  const statusOf = (id: string) => latest?.results.find((r) => r.schemeId === id)
  const relevant = data?.schemes.filter((s) => s.reasons.length) ?? []
  const others = data?.schemes.filter((s) => !s.reasons.length) ?? []
  return (
    <Screen title={t('govSchemes')} subtitle={t('schemesForYou')} noBack>
      <Notice tone="amber" title="Please verify before applying">Scheme details are compiled from official websites and marked “needs verification” until reviewed. SAKHI VANI never approves applications — only the department can.</Notice>
      <Button className="mt-3" block size="lg" icon={<ClipboardCheck className="size-5" />} onClick={() => push('eligibility')}>{t('checkEligibility')}</Button>
      {latest && <p className="mt-2 text-center text-[12px] text-ink/50">Last checked {new Date(latest.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} ({latest.channel})</p>}
      <Section title="May be relevant to you">
        <div className="space-y-2.5">{relevant.map((s) => <SchemeCard key={s.id} s={s} status={statusOf(s.id)} onClick={() => push('scheme', { id: s.id })} />)}</div>
      </Section>
      {others.length > 0 && <Section title="Other schemes"><div className="space-y-2.5">{others.map((s) => <SchemeCard key={s.id} s={s} status={statusOf(s.id)} onClick={() => push('scheme', { id: s.id })} />)}</div></Section>}
    </Screen>
  )
}

function SchemeCard({ s, status, onClick }: { s: Scheme & { reasons: string[] }; status?: SchemeAssessment; onClick: () => void }) {
  return (
    <Card onClick={onClick}>
      <div className="flex flex-wrap items-center gap-1.5"><LevelBadge s={s} />{status && <Badge tone={STATUS_TONE[status.status]}>{STATUS_LABEL[status.status]}</Badge>}</div>
      <p className="mt-2 text-[16px] font-bold leading-snug text-ink">{s.shortName} — {s.name}</p>
      <p className="mt-1 text-[13.5px] leading-snug text-ink/65">{s.purpose}</p>
      {s.reasons.length > 0 && <p className="mt-2 text-[12.5px] font-medium text-leaf-deep">Why shown: {s.reasons.join(' · ')}</p>}
    </Card>
  )
}

export function SchemeDetail() {
  const { route, push } = useApp()
  const { data } = useLoad(() => api.call('listSchemes'))
  const s = data?.schemes.find((x) => x.id === route.params?.id)
  const status = data?.latestAssessment?.results.find((r) => r.schemeId === s?.id)
  if (!s) return <Loading />
  return (
    <Screen title={s.shortName} subtitle={s.name}>
      <div className="flex flex-wrap gap-1.5"><LevelBadge s={s} /><Badge tone="amber">{s.verificationStatus === 'verified' ? 'Verified' : 'Needs verification'}</Badge>{status && <Badge tone={STATUS_TONE[status.status]}>{STATUS_LABEL[status.status]}</Badge>}</div>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{s.purpose}</p>
      <List title="Main benefits" items={s.benefits} />
      <Section title="Intended beneficiaries"><Card><p className="text-[14px] text-ink/80">{s.intendedBeneficiaries}</p></Card></Section>
      <List title="Eligibility criteria" items={s.eligibilitySummary} />
      <List title="Documents usually required" items={s.documents} />
      <List title="How to apply" items={s.applicationProcess} ordered />
      <Section title="Source">
        <Card className="space-y-1.5 text-[13px] text-ink/70">
          <p>{s.sourceName}</p>
          <p>Last reviewed: {s.lastReviewed}</p>
          <p className="text-[12px]">{s.verificationNote}</p>
          <a href={s.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-leaf underline">Official website <ExternalLink className="size-3.5" /></a>
        </Card>
      </Section>
      <div className="mt-5 space-y-2">
        <Button block size="lg" onClick={() => push('eligibility', { schemeId: s.id })}>Check my eligibility for {s.shortName}</Button>
        <Button block variant="secondary" icon={<HandHeart className="size-4" />} onClick={() => push('requestAsha', { schemeId: s.id, category: 'Help with a government scheme' })}>Ask my ASHA worker for help</Button>
      </div>
    </Screen>
  )
}
function List({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  return (
    <Section title={title}>
      <Card className="space-y-2">
        {items.map((x, i) => <p key={i} className="flex gap-2.5 text-[14px] leading-snug text-ink/80"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-leaf-soft text-[11px] font-bold text-leaf-deep">{ordered ? i + 1 : '•'}</span>{x}</p>)}
      </Card>
    </Section>
  )
}

// ---------------- Eligibility conversation ----------------
const ANSWER_LABEL: Record<string, Record<Lang, string>> = {
  yes: { en: 'Yes', hi: 'हाँ', kn: 'ಹೌದು' },
  no: { en: 'No', hi: 'नहीं', kn: 'ಇಲ್ಲ' },
  unsure: { en: 'Not sure', hi: 'पता नहीं', kn: 'ಗೊತ್ತಿಲ್ಲ' },
}
const PREFILL_LABEL: Record<string, string> = { pregnant: 'Pregnant', state: 'State', age: 'Age', pregnancyMonths: 'Month of pregnancy' }

export function Eligibility() {
  const { route, lang, toast, bump } = useApp()
  const schemeId = route.params?.schemeId
  const schemeIds = useMemo(() => (schemeId ? [schemeId] : undefined), [schemeId])
  const schemes = useLoad(() => api.call('listSchemes'))
  const [answers, setAnswers] = useState<Answers | null>(null)
  const [usePrefill, setUsePrefill] = useState(true)
  const [prefill, setPrefill] = useState<Answers>({})
  const [log, setLog] = useState<Array<{ who: 'bot' | 'me'; text: string }>>([])
  const [q, setQ] = useState<EligibilityQuestion | null | undefined>(undefined)
  const [num, setNum] = useState('')
  const [result, setResult] = useState<EligibilityAssessment | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  const start = async (withPrefill: boolean) => {
    const pre = withPrefill ? (await api.call('eligibilityPrefill')).answers : {}
    setPrefill(pre)
    setAnswers(pre)
    setResult(null)
    const intro = lang === 'hi' ? 'मैं कुछ आसान सवाल एक-एक करके पूछूँगी।' : lang === 'kn' ? 'ನಾನು ಕೆಲವು ಸರಳ ಪ್ರಶ್ನೆಗಳನ್ನು ಒಂದೊಂದಾಗಿ ಕೇಳುತ್ತೇನೆ.' : 'I will ask a few simple questions, one at a time.'
    setLog([{ who: 'bot', text: intro }, ...(Object.keys(pre).length ? [{ who: 'bot' as const, text: `From your profile: ${Object.entries(pre).map(([k, v]) => `${PREFILL_LABEL[k] ?? k}: ${v}`).join(', ')}.` }] : [])])
    const { question } = await api.call('nextEligibilityQuestion', { answers: pre, schemeIds })
    setQ(question)
    if (question) setLog((l) => [...l, { who: 'bot', text: question.text[lang] }])
    else finish(pre)
  }
  useEffect(() => { start(usePrefill) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [usePrefill, schemeId])
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [log, result])

  const finish = async (a: Answers) => {
    const res = await api.call('runEligibility', { answers: a, schemeIds })
    setResult(res)
    setLog((l) => [...l, { who: 'bot', text: lang === 'hi' ? 'धन्यवाद। ये योजनाएँ आपके लिए प्रासंगिक हो सकती हैं, और यह जानकारी अभी बाकी है।' : lang === 'kn' ? 'ಧನ್ಯವಾದಗಳು. ನಿಮಗೆ ಸಂಬಂಧಿಸಬಹುದಾದ ಯೋಜನೆಗಳು ಮತ್ತು ಇನ್ನೂ ಬೇಕಾದ ಮಾಹಿತಿ ಇಲ್ಲಿದೆ.' : 'Thank you. I will show you the schemes that may be relevant and the information you still need to confirm.' }])
    bump()
  }
  const answer = async (value: string | number, label: string) => {
    if (!q || !answers) return
    const next = { ...answers, [q.key]: value }
    setAnswers(next)
    setLog((l) => [...l, { who: 'me', text: label }])
    setNum('')
    try {
      const { question } = await api.call('nextEligibilityQuestion', { answers: next, schemeIds })
      setQ(question)
      if (question) setLog((l) => [...l, { who: 'bot', text: question.text[lang] }])
      else await finish(next)
    } catch (e) { toast((e as Error).message, 'error') }
  }

  return (
    <Screen title="Check my eligibility" subtitle={schemeId ? `For ${schemes.data?.schemes.find((s) => s.id === schemeId)?.shortName ?? ''}` : 'All schemes'}>
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white p-3 border border-line">
        <span className="text-[13px] text-ink/70">Use details from my profile</span>
        <input type="checkbox" className="size-5 accent-[#0F7A5A]" checked={usePrefill} onChange={(e) => setUsePrefill(e.target.checked)} aria-label="Use details from my profile" />
      </div>
      <div className="space-y-2.5">
        {log.map((m, i) => (
          <div key={i} className={cx('flex', m.who === 'me' ? 'justify-end' : 'justify-start')}>
            <div className={cx('max-w-[85%] rounded-3xl px-4 py-2.5 text-[15px] leading-snug', m.who === 'me' ? 'rounded-br-lg bg-navy text-white' : 'rounded-bl-lg border border-line bg-white text-ink')}>{m.text}</div>
          </div>
        ))}
      </div>
      {q && !result && (
        <div className="mt-4 rounded-3xl border border-line bg-white p-3">
          {q.kind === 'yesno' && (
            <div className="grid grid-cols-3 gap-2">
              {(['yes', 'no', 'unsure'] as const).map((v) => <Button key={v} variant={v === 'yes' ? 'primary' : v === 'no' ? 'navy' : 'secondary'} onClick={() => answer(v, ANSWER_LABEL[v][lang])}>{ANSWER_LABEL[v][lang]}</Button>)}
            </div>
          )}
          {q.kind === 'state' && (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => answer('karnataka', lang === 'kn' ? 'ಕರ್ನಾಟಕ' : lang === 'hi' ? 'कर्नाटक' : 'Karnataka')}>Karnataka</Button>
              <Button variant="secondary" onClick={() => answer('other', 'Another state')}>Another state</Button>
            </div>
          )}
          {q.kind === 'number' && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (num) answer(Number(num), num) }}>
              <Input inputMode="numeric" autoFocus value={num} onChange={(e) => setNum(e.target.value.replace(/[^\d]/g, ''))} placeholder="Type a number" />
              <Button type="submit" disabled={!num}>OK</Button>
              <Button type="button" variant="secondary" onClick={() => answer('unsure', ANSWER_LABEL.unsure[lang])}>{ANSWER_LABEL.unsure[lang]}</Button>
            </form>
          )}
        </div>
      )}
      {result && <EligibilityResults assessment={result} schemes={schemes.data?.schemes ?? []} onRestart={() => start(usePrefill)} />}
      <div ref={bottom} />
      {Object.keys(prefill).length > 0 && !result && <p className="mt-3 text-[12px] text-ink/45">Profile details were used. Turn off the switch above to answer everything yourself.</p>}
    </Screen>
  )
}

const KEY_TEXT: Record<string, string> = { pregnant: 'Pregnancy status', state: 'State', pregnancyMonths: 'Month of pregnancy', age: 'Age', plansPublicFacility: 'Delivery at a government facility', bplCard: 'BPL ration card', scSt: 'SC/ST category', pmjayListed: 'Ayushman (PM-JAY) card', govtEmployee: 'Government employment', firstChild: 'First child' }

export function EligibilityResults({ assessment, schemes, onRestart }: { assessment: EligibilityAssessment; schemes: Array<Scheme & { reasons: string[] }>; onRestart: () => void }) {
  const { push } = useApp()
  const order = { potentially_eligible: 0, more_info_required: 1, criteria_not_met: 2 }
  const results = [...assessment.results].sort((a, b) => order[a.status] - order[b.status])
  return (
    <div className="mt-5 space-y-3">
      <Notice tone="blue">These results come from fixed rules stored in SAKHI VANI — not an approval. Final eligibility is decided by the government department.</Notice>
      {results.map((r) => {
        const s = schemes.find((x) => x.id === r.schemeId)
        if (!s) return null
        return (
          <Card key={r.schemeId}>
            <div className="flex flex-wrap items-center gap-1.5"><Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge><LevelBadge s={s} /></div>
            <p className="mt-2 text-[16px] font-bold text-ink">{s.shortName} — {s.name}</p>
            {s.reasons.length > 0 && <p className="text-[12.5px] text-leaf-deep">Why shown: {s.reasons.join(' · ')}</p>}
            <div className="mt-2.5 space-y-1.5">
              {r.criteria.map((c) => (
                <p key={c.id} className="flex items-start gap-2 text-[13.5px] text-ink/80">
                  {c.outcome === 'met' ? <Check className="mt-0.5 size-4 shrink-0 text-leaf" /> : c.outcome === 'not_met' ? <X className="mt-0.5 size-4 shrink-0 text-rose" /> : <CircleHelp className="mt-0.5 size-4 shrink-0 text-[#8A5A08]" />}
                  <span>{c.label} <span className="text-ink/45">— {c.outcome === 'met' ? 'satisfied' : c.outcome === 'not_met' ? 'not satisfied' : 'unknown'}</span></span>
                </p>
              ))}
            </div>
            {r.missingKeys.length > 0 && <p className="mt-2 rounded-xl bg-sun-soft p-2.5 text-[13px] text-[#6E4706]">Still needed: {r.missingKeys.map((k) => KEY_TEXT[k] ?? k).join(', ')}</p>}
            {r.status !== 'criteria_not_met' && (
              <details className="mt-2.5 rounded-xl bg-paper p-3 text-[13.5px]">
                <summary className="cursor-pointer font-semibold text-navy">Documents and how to apply</summary>
                <p className="mt-2 font-semibold text-ink">Documents</p>
                <ul className="ml-4 list-disc text-ink/75">{s.documents.map((d) => <li key={d}>{d}</li>)}</ul>
                <p className="mt-2 font-semibold text-ink">Application process</p>
                <ol className="ml-4 list-decimal text-ink/75">{s.applicationProcess.map((d) => <li key={d}>{d}</li>)}</ol>
                <a href={s.officialUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-leaf underline">Official instructions <ExternalLink className="size-3.5" /></a>
              </details>
            )}
            {r.status !== 'criteria_not_met' && <Button className="mt-3" size="sm" variant="secondary" icon={<HandHeart className="size-4" />} onClick={() => push('requestAsha', { schemeId: s.id, category: 'Help with a government scheme' })}>Get ASHA help with {s.shortName}</Button>}
          </Card>
        )
      })}
      {assessment.answers.hasDocuments && assessment.answers.hasDocuments !== 'yes' && <Notice tone="amber" title="Documents">You said you may not have all documents. Your ASHA worker can help you gather them.</Notice>}
      <div className="flex gap-2"><Button block variant="secondary" onClick={onRestart}>Start again</Button><Button block icon={<HandHeart className="size-4" />} onClick={() => push('requestAsha', { category: 'Help with a government scheme' })}>Request ASHA help</Button></div>
    </div>
  )
}

// ---------------- Request ASHA ----------------
const CATEGORIES = ['Help with a government scheme', 'Pregnancy and motherhood support', 'Child health', 'Elderly care', 'Documents', 'Home visit request', 'Other']
export function RequestAsha() {
  const { route, toast, push, bump, back } = useApp()
  const overview = useLoad(() => api.call('citizenOverview'))
  const [category, setCategory] = useState(route.params?.category ?? CATEGORIES[0])
  const [description, setDescription] = useState(route.params?.schemeId ? `I would like help with the ${route.params.schemeId.toUpperCase()} scheme — documents and application.` : '')
  const [contact, setContact] = useState<AssistanceRequest['contactMethod']>('phone_call')
  const [consent, setConsent] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ashaName = overview.data?.assignedAsha?.name
  const send = async () => {
    setBusy(true)
    try {
      await api.call('createAssistanceRequest', { category, description, contactMethod: contact, consentToShare: consent, confirmed: true, relatedSchemeId: route.params?.schemeId, createdVia: route.params?.schemeId ? 'eligibility' : 'app' })
      toast('Request sent to your ASHA worker', 'ok')
      setConfirmOpen(false); bump(); back(); push('requests')
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <Screen title="Request ASHA Assistance" subtitle={ashaName ? `Your ASHA worker: ${ashaName}` : undefined}>
      <div className="space-y-4">
        <Field label="What do you need help with?"><Select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Short description" hint="Share only what you are comfortable sharing."><Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} /></Field>
        <Field label="How should the ASHA worker contact you?">
          <div className="grid grid-cols-3 gap-2">
            {([['phone_call', 'Phone call'], ['home_visit', 'Home visit'], ['in_app', 'In the app']] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setContact(v)} className={cx('h-12 rounded-2xl border text-[13.5px] font-semibold', contact === v ? 'border-leaf bg-leaf-soft text-leaf-deep' : 'border-line bg-white text-ink/70')}>{l}</button>
            ))}
          </div>
        </Field>
        <Card><CheckBox label={`I agree to share this request and my name, beneficiary ID and village with ${ashaName ?? 'my assigned ASHA worker'}.`} checked={consent} onChange={setConsent} /></Card>
        <Button block size="lg" disabled={!consent} onClick={() => setConfirmOpen(true)}>Continue</Button>
      </div>
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Send this request?" footer={<><Button block variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button><Button block loading={busy} onClick={send}>Yes, send</Button></>}>
        <div className="space-y-1.5 text-[14px] text-ink/80">
          <p><b>To:</b> {ashaName ?? 'Assigned ASHA worker'}</p>
          <p><b>Category:</b> {category}</p>
          <p><b>Contact:</b> {contact.replace('_', ' ')}</p>
          {description && <p><b>Message:</b> {description}</p>}
          <p className="pt-2 text-[12.5px] text-ink/55">This is a request for help from your ASHA worker. It is not an official scheme application.</p>
        </div>
      </Modal>
    </Screen>
  )
}

export function CitizenRequests() {
  const { push } = useApp()
  const { data, loading } = useLoad(() => api.call('listRequests'))
  const steps: AssistanceRequest['status'][] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FOLLOW_UP_SCHEDULED', 'COMPLETED']
  return (
    <Screen title="My assistance requests" right={<Button size="sm" onClick={() => push('requestAsha')}>New</Button>}>
      {loading && !data ? <Loading /> : !data?.length ? <Empty icon={<HandHeart className="size-6" />} title="No requests yet" action={<Button onClick={() => push('requestAsha')}>Request ASHA Assistance</Button>} /> : (
        <div className="space-y-2.5">
          {data.map((r) => {
            const idx = steps.indexOf(r.status)
            return (
              <Card key={r.id}>
                <div className="flex items-center justify-between"><Badge tone={REQ_TONE[r.status]}>{REQ_LABEL[r.status]}</Badge><span className="text-[12px] text-ink/50">{r.id}</span></div>
                <p className="mt-2 font-semibold text-ink">{r.category}</p>
                <p className="text-[12.5px] text-ink/55">Sent {new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} via {r.createdVia}</p>
                {r.status !== 'REFERRED' && (
                  <div className="mt-3 flex items-center gap-1">{steps.map((s, i) => <span key={s} className={cx('h-1.5 flex-1 rounded-full', i <= idx ? 'bg-leaf' : 'bg-black/10')} />)}</div>
                )}
                <div className="mt-2.5 space-y-1">{r.history.map((h, i) => <p key={i} className="text-[12.5px] text-ink/65">• {REQ_LABEL[h.status]} — {new Date(h.at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}{h.note ? `: ${h.note}` : ''}</p>)}</div>
              </Card>
            )
          })}
        </div>
      )}
    </Screen>
  )
}

// ---------------- Info hubs ----------------
function Article({ id }: { id: string }) {
  const { lang } = useApp()
  const a = KNOWLEDGE.find((k) => k.id === id)!
  return (
    <details className="group rounded-3xl border border-line bg-white p-4">
      <summary className="flex cursor-pointer list-none items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-leaf-soft text-leaf"><BookOpen className="size-4" /></span>
        <span className="flex-1 font-semibold text-ink">{a.title[lang]}</span>
        <ChevronRight className="size-4 text-ink/35 transition group-open:rotate-90" />
      </summary>
      <p className="mt-3 text-[14px] leading-relaxed text-ink/80">{a.summary[lang]}</p>
      <ul className="mt-2 ml-4 list-disc space-y-1 text-[13.5px] text-ink/70">{a.points.map((p) => <li key={p}>{p}</li>)}</ul>
      <p className="mt-2 text-[12px] text-ink/50">Source: {a.sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer" className="underline">{s.name}{i < a.sources.length - 1 ? '; ' : ''}</a>)}</p>
    </details>
  )
}

export function Maternal() {
  const { push } = useApp()
  const { data } = useLoad(() => api.call('citizenOverview'))
  const mat = data?.records.find((r) => r.type === 'MATERNAL')
  const pregnant = data?.beneficiary?.category === 'pregnant'
  const pmsma = nextDayOfMonth(isoDate(new Date()), 9)
  return (
    <Screen title="Pregnancy and Motherhood" subtitle="Sakhi Care">
      {pregnant && mat ? (
        <Card className="!p-5">
          <div className="flex items-center justify-between"><p className="text-[12px] font-bold uppercase tracking-wide text-ink/50">My pregnancy profile</p>{data?.beneficiary?.synthetic && <DemoBadge />}</div>
          <p className="mt-1 text-[24px] font-bold text-ink">{mat.fields.pregnancyStage?.value ?? 'Stage not recorded'}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
            <Pair label="EDD" value={mat.fields.edd?.value ? formatDate(mat.fields.edd.value) : 'Not yet confirmed'} />
            <Pair label="Next appointment" value={formatDate(mat.fields.nextAppointment?.value)} />
          </dl>
          <p className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-ink/45">ANC visits</p>
          <p className="text-[14px] text-ink">{mat.fields.ancVisits?.value ?? 'None recorded'}</p>
          {mat.fields.ancVisits && <div className="mt-1"><ProvenanceBadge source={mat.fields.ancVisits.source} voice={mat.fields.ancVisits.viaVoiceReview} /></div>}
        </Card>
      ) : <Notice tone="blue">If you are pregnant, you can share this with your ASHA worker or note it in your profile. Sharing is voluntary.</Notice>}
      <div className="mt-3"><Notice tone="green" title="PMSMA check-up day">Free antenatal check-ups at designated government facilities on the 9th of every month. Next: {formatDate(pmsma)}.</Notice></div>
      <div className="mt-3 rounded-3xl border border-rose/30 bg-rose-soft p-4">
        <p className="flex items-center gap-2 font-bold text-rose"><Siren className="size-5" /> Warning signs — go to a facility or call 108 now</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-rose/90">Bleeding · severe headache or blurred vision · fits · high fever · severe stomach pain · swelling of face or hands · leaking water · baby moving less.</p>
      </div>
      <Section title="Learn">
        <div className="space-y-2">{['anc-prep', 'pregnancy-nutrition', 'pregnancy-danger', 'delivery-prep', 'postnatal-care', 'breastfeeding', 'newborn-care'].map((id) => <Article key={id} id={id} />)}</div>
      </Section>
      <div className="mt-5 space-y-2">
        <Button block size="lg" icon={<Lock className="size-4" />} onClick={() => push('assistant', { channel: 'maternal' })}>Private Sakhi conversation</Button>
        <Button block variant="secondary" icon={<HandHeart className="size-4" />} onClick={() => push('requestAsha', { category: 'Pregnancy and motherhood support' })}>Request ASHA assistance</Button>
      </div>
      <p className="mt-3 text-[12px] text-ink/50">Sakhi does not diagnose, prescribe or replace your ANM or doctor. Your private conversations are not shown to your ASHA worker or family.</p>
    </Screen>
  )
}

export function ChildHealth() {
  const { push } = useApp()
  return (
    <Screen title="Child Health">
      <Section title="National immunisation schedule (reference)">
        <Card className="!p-0">
          {UIP_SCHEDULE.rows.map((r) => <div key={r.age} className="border-b border-line px-4 py-3 last:border-0"><p className="text-[13px] font-bold text-ink">{r.age}</p><p className="text-[13.5px] text-ink/70">{r.vaccines}</p></div>)}
        </Card>
        <p className="mt-2 text-[12px] text-ink/50">Source: {UIP_SCHEDULE.source.name}. Marked “needs verification” — always follow the dates on your MCP card and your ANM's advice.</p>
      </Section>
      <Section title="Learn"><div className="space-y-2">{['immunisation', 'newborn-care', 'breastfeeding'].map((id) => <Article key={id} id={id} />)}</div></Section>
      <Button className="mt-5" block variant="secondary" icon={<HandHeart className="size-4" />} onClick={() => push('requestAsha', { category: 'Child health' })}>Request ASHA assistance</Button>
    </Screen>
  )
}

export function ElderlyCare() {
  const { push } = useApp()
  return (
    <Screen title="Elderly Care">
      <Notice tone="blue">AB PM-JAY coverage for people aged 70 and above has been announced — check current status on the official website or with your ASHA worker.</Notice>
      <Section title="Learn"><div className="space-y-2">{['elderly-checks', 'medicine-safety', 'water-storage'].map((id) => <Article key={id} id={id} />)}</div></Section>
      <div className="mt-5 space-y-2">
        <Button block onClick={() => push('scheme', { id: 'pmjay' })}>About AB PM-JAY</Button>
        <Button block variant="secondary" icon={<HandHeart className="size-4" />} onClick={() => push('requestAsha', { category: 'Elderly care' })}>Request ASHA assistance</Button>
      </div>
    </Screen>
  )
}

export function Appointments() {
  const { push } = useApp()
  const { data, loading } = useLoad(() => api.call('citizenOverview'))
  if (loading && !data) return <Loading />
  const upcoming = (data?.visits ?? []).filter((v) => v.displayStatus === 'scheduled')
  const missed = (data?.visits ?? []).filter((v) => v.displayStatus === 'overdue')
  const appt = data?.records.find((r) => r.type === 'MATERNAL')?.fields.nextAppointment?.value
  return (
    <Screen title="Appointments and Reminders">
      {appt && <Card className="border-l-4 border-l-leaf"><p className="text-[12px] font-bold uppercase tracking-wide text-ink/50">Antenatal check-up</p><p className="text-[18px] font-bold text-ink">{formatDate(appt)}</p><p className="text-[13px] text-ink/60">Carry your MCP card. Recorded by your ASHA worker.</p></Card>}
      <Section title="Upcoming home visits">
        <div className="space-y-2">
          {upcoming.map((v) => <Card key={v.id} className="!p-3.5"><p className="font-semibold text-ink">{formatDate(v.scheduledDate)}</p><p className="text-[13px] text-ink/60">{v.purpose}</p></Card>)}
          {!upcoming.length && <p className="text-sm text-ink/50">No upcoming visits.</p>}
        </div>
      </Section>
      {missed.length > 0 && (
        <Section title="May have been missed">
          <div className="space-y-2">{missed.map((v) => <Card key={v.id} className="!p-3.5 border-rose/30"><p className="font-semibold text-ink">{formatDate(v.scheduledDate)}</p><p className="text-[13px] text-ink/60">{v.purpose}</p></Card>)}</div>
        </Section>
      )}
      <Button className="mt-5" block variant="secondary" onClick={() => push('alerts')}>View all notifications</Button>
    </Screen>
  )
}

// ---------------- Assistant (private chat) ----------------
const SUGGEST: Record<Lang, string[]> = {
  en: ['How do I prepare for my next antenatal visit?', 'What should I eat during pregnancy?', 'Is it safe to stop my tablets?', 'Are there government schemes for me?', 'I want to speak to my ASHA worker'],
  hi: ['अगली प्रसवपूर्व जांच की तैयारी कैसे करूँ?', 'गर्भावस्था में क्या खाना चाहिए?', 'क्या मेरे लिए सरकारी योजना है?', 'मुझे अपनी आशा कार्यकर्ता से बात करनी है'],
  kn: ['ಮುಂದಿನ ಪ್ರಸವಪೂರ್ವ ತಪಾಸಣೆಗೆ ಹೇಗೆ ತಯಾರಾಗಲಿ?', 'ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ಏನು ತಿನ್ನಬೇಕು?', 'ನನಗೆ ಸರ್ಕಾರಿ ಯೋಜನೆ ಇದೆಯೇ?', 'ನನ್ನ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯೊಂದಿಗೆ ಮಾತನಾಡಬೇಕು'],
}
export function Assistant() {
  const { route, lang, push, toast, tab } = useApp()
  const channel: 'health' | 'maternal' = route.params?.channel === 'maternal' ? 'maternal' : 'health'
  const { data, reload } = useLoad(() => api.call('listPrivateMessages', { channel }), [channel])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [readAloud, setReadAloud] = useState(false)
  const stopRef = useRef<() => void>(() => {})
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [data])
  useEffect(() => () => stopRef.current(), [])
  const send = async (msg: string) => {
    if (!msg.trim()) return
    setBusy(true)
    setText('')
    try {
      const r = await api.call('askAssistant', { text: msg, channel, lang })
      if (readAloud && !speak(r.text.split('\n')[0] + ' ' + (r.text.split('\n')[1] ?? ''), lang)) toast(`No ${lang === 'kn' ? 'Kannada' : lang === 'hi' ? 'Hindi' : 'English'} voice is installed on this device for reading aloud.`, 'info')
      reload()
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  const mic = () => {
    if (listening) { stopRef.current(); setListening(false); return }
    setListening(true)
    stopRef.current = startRecognition(lang, { onText: (t) => setText(t), onEnd: () => setListening(false), onError: (m) => { setListening(false); toast(m, 'error') } })
  }
  return (
    <Screen title={channel === 'maternal' ? 'Private Sakhi conversation' : 'Health Information Assistant'} subtitle="Private · not shared with your ASHA worker" noBack={channel === 'health' && !route.params?.channel}
      right={<button aria-label="Clear conversation" onClick={async () => { await api.call('clearPrivateMessages', { channel }); reload() }} className="grid size-10 place-items-center rounded-full hover:bg-black/5"><Trash2 className="size-5 text-ink/50" /></button>}>
      <Notice tone="green" icon={<Lock className="size-4" />}>General, source-backed information only. Sakhi cannot diagnose, prescribe or change medicines. In an emergency call 108.</Notice>
      <div className="mt-3 space-y-2.5">
        {!data?.length && (
          <div className="space-y-2">
            <p className="text-[13px] text-ink/55">Try asking:</p>
            <div className="flex flex-wrap gap-2">{SUGGEST[lang].map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-white px-3 py-2 text-left text-[13px] text-ink">{s}</button>)}</div>
          </div>
        )}
        {data?.map((m) => (
          <div key={m.id} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cx('max-w-[88%] whitespace-pre-line rounded-3xl px-4 py-3 text-[14.5px] leading-relaxed', m.role === 'user' ? 'rounded-br-lg bg-navy text-white' : m.urgent ? 'rounded-bl-lg border-2 border-rose bg-rose-soft text-rose' : 'rounded-bl-lg border border-line bg-white text-ink')}>
              {m.urgent && <p className="mb-1 flex items-center gap-1.5 font-bold"><Siren className="size-4" /> Urgent guidance</p>}
              {m.text}
              {m.urgent && <a href="tel:108" className="mt-2 flex h-11 items-center justify-center rounded-xl bg-rose font-semibold text-white">Call 108</a>}
              {m.intent === 'scheme' && <Button className="mt-2" size="sm" onClick={() => tab('schemes')}>Open schemes</Button>}
              {m.intent === 'asha_assistance' && <Button className="mt-2" size="sm" onClick={() => push('requestAsha')}>Request ASHA Assistance</Button>}
              {m.intent === 'appointment' && <Button className="mt-2" size="sm" onClick={() => push('appointments')}>My appointments</Button>}
              {!!m.sources?.length && <p className="mt-2 border-t border-line pt-2 text-[11.5px] text-ink/50">Sources: {m.sources.map((s) => s.name).join('; ')}</p>}
            </div>
          </div>
        ))}
        {busy && <div className="text-[13px] text-ink/50">Sakhi is thinking…</div>}
        <div ref={bottom} />
      </div>
      <div className="fixed bottom-[76px] left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 px-3 pb-2">
        <form onSubmit={(e) => { e.preventDefault(); send(text) }} className="flex items-center gap-2 rounded-3xl border border-line bg-white p-2 shadow-[0_10px_30px_-12px_rgba(19,41,75,0.35)]">
          <button type="button" onClick={mic} disabled={!isSttAvailable()} aria-label="Speak" className={cx('grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-40', listening ? 'bg-rose text-white' : 'bg-leaf-soft text-leaf')}>{listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}</button>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or speak your question" className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
          <button type="button" onClick={() => setReadAloud(!readAloud)} aria-pressed={readAloud} aria-label="Read replies aloud" className={cx('grid size-10 shrink-0 place-items-center rounded-full', readAloud ? 'bg-mist text-white' : 'text-ink/40')} title={hasVoiceFor(lang) ? 'Read replies aloud' : 'No voice installed for this language on this device'}><Volume2 className="size-5" /></button>
          <button type="submit" disabled={!text.trim() || busy} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-white disabled:opacity-40"><Send className="size-5" /></button>
        </form>
      </div>
    </Screen>
  )
}

export { Sparkles, DOC_LABEL, DOC_TONE }
