import { useState } from 'react'
import { Stethoscope, UsersRound, ArrowRight, Bell, Download, LogOut, Languages, ShieldCheck, RefreshCw, Lock, KeyRound } from 'lucide-react'
import type { AppNotification, ConsentType, Lang, Role } from '../../../shared-types'
import { api } from '../api/client'
import { useApp, useLoad } from '../ctx'
import { LANG_NAMES } from '../i18n'
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Logo, Notice, PriorityBadge, Screen, Section, Select, cx } from '../components/ui'

export const DEMO = {
  asha: { email: 'asha@demo.com', password: 'Asha@123', name: 'Meera' },
  citizen: { email: 'citizen@demo.com', password: 'Citizen@123', name: 'Lakshmi' },
}

export function LanguagePicker({ compact }: { compact?: boolean }) {
  const { lang, setLang } = useApp()
  return (
    <div role="radiogroup" aria-label="Language" className={cx('grid grid-cols-3 gap-2', compact && 'max-w-xs')}>
      {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
        <button key={l} role="radio" aria-checked={lang === l} onClick={() => setLang(l)} className={cx('h-12 rounded-2xl border text-[15px] font-semibold transition', lang === l ? 'border-white bg-white text-navy' : 'border-white/25 text-white hover:bg-white/10')}>
          {LANG_NAMES[l]}
        </button>
      ))}
    </div>
  )
}

export function Splash() {
  const { t, push } = useApp()
  return (
    <div className="min-h-full bg-paper">
      <div className="relative overflow-hidden bg-navy px-5 pb-16 pt-10 text-white">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-leaf/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-mist/40 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <Logo size={52} light />
            <div>
              <p className="text-[26px] font-extrabold leading-none tracking-tight">{t('appName')}</p>
              <p className="mt-1 text-[13px] font-semibold text-white/65">ಸಖಿ ವಾಣಿ · सखी वाणी</p>
            </div>
          </div>
          <p className="mt-6 text-[22px] font-semibold leading-snug">{t('tagline')}</p>
          <p className="mt-6 mb-2 text-[13px] font-semibold text-white/70">{t('chooseLanguage')}</p>
          <LanguagePicker />
          <p className="mt-7 text-[13px] font-semibold text-white/70">{t('whoAreYou')}</p>
        </div>
      </div>
      <div className="relative -mt-8 space-y-3 px-4 pb-10">
        <EntryCard tone="leaf" icon={<Stethoscope className="size-7" />} title={t('ashaWorker')} sub={t('ashaSub')} cta={t('continueAsha')} onClick={() => push('login', { role: 'asha' })} />
        <EntryCard tone="mist" icon={<UsersRound className="size-7" />} title={t('citizen')} sub={t('citizenSub')} cta={t('continueCitizen')} onClick={() => push('login', { role: 'citizen' })} />
        <div className="pt-3 text-center text-[12px] leading-relaxed text-ink/55">
          All records in this demo are synthetic. No real patient data or Aadhaar numbers are used.
          <br />
          <a className="mt-2 inline-flex items-center gap-1 font-semibold text-leaf underline" href={`${import.meta.env.BASE_URL}downloads/SAKHI_VANI_COMPLETE_PROJECT.zip`} download>
            <Download className="size-3.5" /> Download project source (ZIP)
          </a>
        </div>
      </div>
    </div>
  )
}

function EntryCard({ tone, icon, title, sub, cta, onClick }: { tone: 'leaf' | 'mist'; icon: React.ReactNode; title: string; sub: string; cta: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group w-full rounded-[28px] border border-line bg-white p-5 text-left shadow-[0_10px_30px_-18px_rgba(19,41,75,0.35)] transition active:scale-[0.99]">
      <div className="flex items-start gap-4">
        <span className={cx('grid size-14 shrink-0 place-items-center rounded-2xl text-white', tone === 'leaf' ? 'bg-leaf' : 'bg-mist')}>{icon}</span>
        <div className="min-w-0">
          <p className="text-[20px] font-bold tracking-tight text-ink">{title}</p>
          <p className="mt-1 text-[14px] leading-snug text-ink/65">{sub}</p>
        </div>
      </div>
      <span className={cx('mt-4 flex h-12 items-center justify-between rounded-2xl px-4 text-[15px] font-semibold text-white', tone === 'leaf' ? 'bg-leaf group-hover:bg-leaf-deep' : 'bg-mist group-hover:bg-navy')}>
        {cta} <ArrowRight className="size-5" />
      </span>
    </button>
  )
}

export function Login() {
  const { t, route, push, setUser, toast } = useApp()
  const role = (route.params?.role ?? 'citizen') as Role
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const demo = DEMO[role]
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await api.login(email, password, role)
      setUser(u)
      toast(`Welcome, ${u.name}`, 'ok')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Screen title={role === 'asha' ? t('ashaWorker') : t('citizen')} subtitle={t('login')}>
      <div className="mt-2 flex items-center gap-3 rounded-3xl bg-white p-4 border border-line">
        <span className={cx('grid size-12 place-items-center rounded-2xl text-white', role === 'asha' ? 'bg-leaf' : 'bg-mist')}>{role === 'asha' ? <Stethoscope className="size-6" /> : <UsersRound className="size-6" />}</span>
        <p className="text-[14px] leading-snug text-ink/70">{role === 'asha' ? t('ashaSub') : t('citizenSub')}</p>
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label={t('email')}><Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label={t('password')}><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
        {error && <p role="alert" className="rounded-2xl bg-rose-soft p-3 text-sm font-medium text-rose">{error}</p>}
        <Button type="submit" size="lg" block loading={busy} variant={role === 'asha' ? 'primary' : 'navy'}>{t('login')}</Button>
      </form>
      <Card className="mt-5 border-sun/40 bg-sun-soft/60">
        <div className="flex items-center gap-2"><KeyRound className="size-4 text-[#8A5A08]" /><p className="text-[13px] font-bold text-[#6E4706]">Hackathon demo account — synthetic</p></div>
        <p className="mt-1 font-mono text-[13px] text-ink/80">{demo.email} · {demo.password}</p>
        <Button className="mt-3" size="sm" variant="secondary" onClick={() => { setEmail(demo.email); setPassword(demo.password) }}>{t('useDemo')} ({demo.name})</Button>
      </Card>
      <button onClick={() => push('register', { role })} className="mt-5 w-full text-center text-[14px] font-semibold text-leaf">{t('noAccount')}</button>
    </Screen>
  )
}

export function Register() {
  const { t, route, back, toast } = useApp()
  const role = (route.params?.role ?? 'citizen') as Role
  const [f, setF] = useState<Record<string, string>>({ gender: 'undisclosed' })
  const [checks, setChecks] = useState({ consentAccepted: false, shareWithAsha: true, notifications: true, pregnant: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (role === 'asha') await api.call('registerAsha', { name: f.name, workerId: f.workerId, village: f.village, phone: f.phone, email: f.email, password: f.password })
      else await api.call('registerCitizen', { name: f.name, age: Number(f.age), gender: f.gender as 'female', village: f.village, phone: f.phone, email: f.email, password: f.password, ...checks })
      toast('Account created. Please log in.', 'ok')
      back()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Screen title={t('register')} subtitle={role === 'asha' ? t('ashaWorker') : t('citizen')}>
      <form onSubmit={submit} className="mt-2 space-y-4">
        <Field label="Full name" required><Input value={f.name ?? ''} onChange={set('name')} required /></Field>
        {role === 'asha' ? (
          <>
            <Field label="Worker ID" required><Input value={f.workerId ?? ''} onChange={set('workerId')} required /></Field>
            <Field label="Assigned village / area" required hint="Beneficiaries in this area will be visible to you."><Input value={f.village ?? ''} onChange={set('village')} required /></Field>
            <Field label="Mobile number"><Input inputMode="tel" value={f.phone ?? ''} onChange={set('phone')} /></Field>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age" required><Input inputMode="numeric" value={f.age ?? ''} onChange={set('age')} required /></Field>
              <Field label="Gender (optional)">
                <Select value={f.gender} onChange={set('gender')}>
                  <option value="undisclosed">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
                </Select>
              </Field>
            </div>
            <Field label="Village / location" required hint='Use "Demo Village" to be linked to the demo ASHA worker.'><Input value={f.village ?? ''} onChange={set('village')} required /></Field>
            <Field label="Mobile number (optional)"><Input inputMode="tel" value={f.phone ?? ''} onChange={set('phone')} /></Field>
          </>
        )}
        <Field label={t('email')} required><Input type="email" value={f.email ?? ''} onChange={set('email')} required /></Field>
        <Field label={t('password')} required hint="At least 8 characters."><Input type="password" value={f.password ?? ''} onChange={set('password')} required /></Field>
        {role === 'citizen' && (
          <div className="space-y-3 rounded-3xl border border-line bg-white p-4">
            <p className="flex items-center gap-2 text-[14px] font-bold text-ink"><ShieldCheck className="size-4 text-leaf" /> Privacy and consent</p>
            <p className="text-[13px] leading-relaxed text-ink/65">
              SAKHI VANI stores only the information you give. Your private assistant conversations are never shown to ASHA workers or family members.
              Information may be shared where the law or safeguarding duties require it. You can change these choices anytime in Settings.
            </p>
            <Check label="I am currently pregnant (optional, voluntary)" checked={checks.pregnant} onChange={(v) => setChecks({ ...checks, pregnant: v })} />
            <Check label="Share my health records with my assigned ASHA worker" checked={checks.shareWithAsha} onChange={(v) => setChecks({ ...checks, shareWithAsha: v })} />
            <Check label="Send me reminders and notifications" checked={checks.notifications} onChange={(v) => setChecks({ ...checks, notifications: v })} />
            <Check label="I have read the privacy information (required)" checked={checks.consentAccepted} onChange={(v) => setChecks({ ...checks, consentAccepted: v })} />
          </div>
        )}
        {error && <p role="alert" className="rounded-2xl bg-rose-soft p-3 text-sm font-medium text-rose">{error}</p>}
        <Button type="submit" size="lg" block loading={busy}>{t('register')}</Button>
      </form>
    </Screen>
  )
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-ink">
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[#0F7A5A]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function openLink(push: (n: string, p?: Record<string, string | undefined>) => void, link?: AppNotification['link']) {
  if (!link) return
  push(link.screen, link.id ? { id: link.id } : undefined)
}

function timeAgo(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  if (m < 1440) return `${Math.round(m / 60)} h ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function Notifications() {
  const { t, push, bump } = useApp()
  const { data, loading, error, reload } = useLoad(() => api.call('listNotifications'))
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')
  const list = (data ?? []).filter((n) => filter === 'all' || !n.read)
  const markAll = async () => { await api.call('markAllNotificationsRead'); reload(); bump() }
  const open = async (n: AppNotification) => {
    if (!n.read) await api.call('markNotificationRead', { id: n.id })
    openLink(push, n.link)
  }
  return (
    <Screen title={t('notifications')} right={<Button size="sm" variant="ghost" onClick={markAll}>{t('markAllRead')}</Button>}>
      <div className="mb-3 flex gap-2">
        {(['unread', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cx('h-9 rounded-full px-4 text-[13px] font-semibold', filter === f ? 'bg-navy text-white' : 'bg-white text-ink/70 border border-line')}>
            {f === 'unread' ? `Unread (${(data ?? []).filter((n) => !n.read).length})` : 'All'}
          </button>
        ))}
      </div>
      {loading && !data && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && !list.length && <Empty icon={<Bell className="size-6" />} title="You are all caught up" body="New reminders and alerts will appear here." />}
      <div className="space-y-2.5">
        {list.map((n) => (
          <Card key={n.id} className={cx(!n.read && 'border-l-4 border-l-leaf')}>
            <div className="flex items-center justify-between gap-2">
              <PriorityBadge p={n.priority} />
              <span className="text-[12px] text-ink/50">{timeAgo(n.createdAt)}</span>
            </div>
            <p className="mt-2 text-[15px] font-semibold leading-snug text-ink">{n.title}</p>
            <p className="mt-0.5 text-[13.5px] leading-snug text-ink/65">{n.body}</p>
            <div className="mt-3 flex gap-2">
              {n.link && <Button size="sm" onClick={() => open(n)}>Open</Button>}
              {!n.read && <Button size="sm" variant="secondary" onClick={async () => { await api.call('markNotificationRead', { id: n.id }); reload(); bump() }}>Mark as read</Button>}
              {n.sensitive && <span className="ml-auto inline-flex items-center gap-1 self-center text-[11px] text-ink/45"><Lock className="size-3" /> Hidden on lock screen</span>}
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  )
}

const CONSENT_LABEL: Record<ConsentType, { title: string; body: string }> = {
  share_records_with_asha: { title: 'Share health records with my ASHA worker', body: 'Lets your assigned ASHA worker see records linked to you.' },
  share_self_reports_with_asha: { title: 'Share things I report myself', body: 'Self-reported symptoms/concerns are private unless this is on.' },
  notifications: { title: 'Reminders and notifications', body: 'Visit, appointment and scheme reminders.' },
  call_transcript_retention: { title: 'Keep call transcripts', body: 'If off, call transcripts are deleted when the call ends; only a short summary is kept.' },
}

export function Settings() {
  const { t, user, setUser, setLang, lang, toast } = useApp()
  const isCitizen = user?.role === 'citizen'
  const overview = useLoad(() => (isCitizen ? api.call('citizenOverview') : Promise.resolve(undefined)), [isCitizen])
  const toggle = async (type: ConsentType, granted: boolean) => {
    await api.call('setConsent', { type, granted })
    toast('Your choice has been saved.', 'ok')
    overview.reload()
  }
  return (
    <Screen title={t('settings')}>
      <Section title={t('language')}>
        <Card>
          <div className="flex items-center gap-2 text-ink"><Languages className="size-5 text-leaf" /><span className="font-semibold">{LANG_NAMES[lang]}</span></div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
              <button key={l} onClick={() => { setLang(l); api.call('setLanguage', { language: l }).catch(() => {}) }} className={cx('h-11 rounded-xl border text-sm font-semibold', l === lang ? 'border-leaf bg-leaf-soft text-leaf-deep' : 'border-line text-ink/70')}>{LANG_NAMES[l]}</button>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-ink/55">Main labels are translated. Some detailed content is in English; translations need native-speaker review.</p>
        </Card>
      </Section>
      {isCitizen && overview.data && (
        <Section title="Privacy and sharing">
          <div className="space-y-2">
            {overview.data.consents.map((c) => (
              <Card key={c.id}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" className="mt-1 size-5 accent-[#0F7A5A]" checked={c.granted} onChange={(e) => toggle(c.type, e.target.checked)} />
                  <span><span className="block font-semibold text-ink">{CONSENT_LABEL[c.type].title}</span><span className="text-[13px] text-ink/60">{CONSENT_LABEL[c.type].body}</span></span>
                </label>
              </Card>
            ))}
            <Notice tone="green">Private assistant conversations are never shared with ASHA workers or family. Confidentiality has legal and safeguarding limits.</Notice>
          </div>
        </Section>
      )}
      <Section title="System">
        <Card className="space-y-2 text-[13.5px] text-ink/75">
          <p>Data mode: <Badge tone={api.mode === 'http' ? 'green' : 'amber'}>{api.mode === 'http' ? 'Connected to backend API' : 'In-app demo backend (browser storage)'}</Badge></p>
          <p>Speech: browser speech recognition where available; otherwise typed input or a clearly labelled demo transcript.</p>
          <p>Telephony: not configured — the calling assistant runs as a DEMO CALL SIMULATOR.</p>
          {api.resetDemo && (
            <Button size="sm" variant="secondary" icon={<RefreshCw className="size-4" />} onClick={() => { if (confirm('Reset all demo data to the original synthetic seed?')) { api.resetDemo!(); setUser(null); toast('Demo data reset.', 'ok') } }}>
              Reset demo data
            </Button>
          )}
        </Card>
      </Section>
      <div className="mt-6 space-y-2">
        <a href={`${import.meta.env.BASE_URL}downloads/SAKHI_VANI_COMPLETE_PROJECT.zip`} download className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-white font-semibold text-navy"><Download className="size-4" /> Download project ZIP</a>
        <Button block variant="danger" icon={<LogOut className="size-4" />} onClick={() => { api.logout(); setUser(null); setLang(lang) }}>{t('logout')}</Button>
      </div>
    </Screen>
  )
}
