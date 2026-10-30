import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, House, Users, CalendarDays, CircleCheck, Clock, TriangleAlert, FileText, ClipboardList, HandHeart, Mic, MicOff, ChevronRight,
  NotebookPen, Keyboard, Sparkles, Check, Pencil, Plus, Upload, Droplets, Settings as SettingsIcon, ListChecks, BadgeCheck, Bell, Activity, Baby, HeartPulse, PersonStanding, UserRound,
} from 'lucide-react'
import type { Beneficiary, BeneficiaryCategory, DocumentItem, ExtractedField, Lang, RecordType, RequestStatus, SttMode, VisitDisplayStatus } from '../../../shared-types'
import { RECORD_SCHEMAS, fieldsFor, CATEGORY_LABEL } from '../../../database/schemas/recordSchemas'
import { DEMO_TRANSCRIPTS } from '../../../ai-services/agents/documentationAgent'
import { formatDate, isoDate, addDays } from '../../../core/util'
import { isEmbedded, isSttAvailable, startRecognition } from '../../../voice-services/adapters/browserSpeech'
import { api } from '../api/client'
import { useApp, useLoad } from '../ctx'
import { LANG_NAMES } from '../i18n'
import { Badge, Button, Card, DemoBadge, Empty, ErrorBox, Field, Input, Loading, Modal, Notice, ProvenanceBadge, Screen, Section, Segmented, Select, StatTile, Textarea, cx, type Tone } from '../components/ui'

export const CAT_TONE: Record<BeneficiaryCategory, Tone> = { pregnant: 'green', newborn: 'blue', child: 'blue', postnatal: 'green', elderly: 'amber', general: 'gray' }
export const CatIcon = ({ c, className = 'size-5' }: { c: BeneficiaryCategory; className?: string }) =>
  c === 'pregnant' || c === 'postnatal' ? <HeartPulse className={className} /> : c === 'newborn' || c === 'child' ? <Baby className={className} /> : c === 'elderly' ? <PersonStanding className={className} /> : <UserRound className={className} />

const VISIT_TONE: Record<VisitDisplayStatus, Tone> = { scheduled: 'blue', completed: 'green', overdue: 'red', cancelled: 'gray' }
const VISIT_LABEL: Record<VisitDisplayStatus, string> = { scheduled: 'Pending', completed: 'Completed', overdue: 'Overdue', cancelled: 'Cancelled' }

function SearchBar({ value, onChange, autoFocus, onFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean; onFocus?: () => void }) {
  const { t } = useApp()
  return (
    <label className="flex h-14 items-center gap-3 rounded-2xl border border-line bg-white px-4 shadow-[0_8px_24px_-18px_rgba(19,41,75,0.5)] focus-within:border-leaf">
      <Search className="size-5 text-ink/45" />
      <input aria-label={t('searchPlaceholder')} autoFocus={autoFocus} onFocus={onFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={t('searchPlaceholder')} className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/40" />
    </label>
  )
}

function BeneficiaryRow({ b, onClick }: { b: { id: string; name: string; age?: number; ageLabel?: string; category: BeneficiaryCategory; householdId: string; synthetic?: boolean }; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="flex items-center gap-3 !p-3.5">
      <span className={cx('grid size-11 shrink-0 place-items-center rounded-2xl', b.category === 'general' ? 'bg-black/5 text-ink/60' : 'bg-leaf-soft text-leaf')}><CatIcon c={b.category} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{b.name}</span>
        <span className="block text-[12.5px] text-ink/55">{b.id} · {b.householdId} · {b.ageLabel ?? (b.age ? `${b.age} yrs` : '')}</span>
      </span>
      <Badge tone={CAT_TONE[b.category]}>{CATEGORY_LABEL[b.category]}</Badge>
      <ChevronRight className="size-4 text-ink/35" />
    </Card>
  )
}

// ---------------- Dashboard ----------------
export function AshaHome() {
  const { t, push, tab } = useApp()
  const { data, error, loading, reload } = useLoad(() => api.call('ashaDashboard'))
  const [q, setQ] = useState('')
  const results = useLoad(() => (q.trim() ? api.call('searchBeneficiaries', { q }) : Promise.resolve([])), [q])
  if (loading && !data) return <Loading />
  if (error || !data) return <div className="p-4"><ErrorBox message={error ?? 'Unable to load'} onRetry={reload} /></div>
  const s = data.stats
  return (
    <div className="pb-28">
      <div className="bg-navy px-4 pb-10 pt-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/60">ASHA Sahayak</p>
            <h1 className="mt-1 text-[24px] font-bold tracking-tight">{t('hello')}, {data.worker.name}</h1>
            <p className="text-[13.5px] text-white/70">{data.worker.workerId} · {data.worker.village}, {data.worker.state}</p>
          </div>
          <button onClick={() => tab('alerts')} className="relative grid size-11 place-items-center rounded-full bg-white/10" aria-label="Notifications">
            <Bell className="size-5" />
            {data.unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-sun px-1 text-[11px] font-bold text-navy">{data.unread}</span>}
          </button>
        </div>
        <div className="mt-2"><Badge tone="amber">{t('demoData')} — synthetic values</Badge></div>
      </div>
      <div className="-mt-7 px-4">
        <SearchBar value={q} onChange={setQ} />
        {q.trim() && (
          <div className="mt-2 space-y-2">
            {results.data?.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-ink/60">No beneficiary found in your assigned area.</p>}
            {results.data?.slice(0, 6).map((b) => <BeneficiaryRow key={b.id} b={b} onClick={() => push('beneficiary', { id: b.id })} />)}
          </div>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <StatTile label={t('households')} value={s.households} icon={<House className="size-4" />} tone="navy" onClick={() => push('households')} />
          <StatTile label={t('totalBeneficiaries')} value={s.beneficiaries} icon={<Users className="size-4" />} tone="navy" onClick={() => tab('people')} />
          <StatTile label={t('todaysVisits')} value={s.todaysVisits} icon={<CalendarDays className="size-4" />} tone="blue" onClick={() => tab('visits')} />
          <StatTile label={t('completed')} value={s.completed} icon={<CircleCheck className="size-4" />} tone="green" onClick={() => tab('visits')} />
          <StatTile label={t('pending')} value={s.pending} icon={<Clock className="size-4" />} tone="blue" onClick={() => tab('visits')} />
          <StatTile label={t('overdue')} value={s.overdue} icon={<TriangleAlert className="size-4" />} tone="red" onClick={() => push('visitsList', { filter: 'overdue' })} />
          <StatTile label={t('recordsNeedUpdate')} value={s.recordsNeedingUpdates} icon={<ClipboardList className="size-4" />} tone="amber" onClick={() => tab('alerts')} />
          <StatTile label={t('missingDocs')} value={s.missingDocuments} icon={<FileText className="size-4" />} tone="amber" onClick={() => push('documents')} />
          <StatTile label={t('newRequests')} value={s.newRequests} icon={<HandHeart className="size-4" />} tone={s.newRequests ? 'red' : 'green'} onClick={() => push('requests')} />
        </div>
        {s.pendingDrafts > 0 && <div className="mt-3"><Notice tone="amber" title={`${s.pendingDrafts} voice note(s) awaiting your approval`}>Nothing is saved to records until you review and approve.</Notice></div>}

        {data.newRequests.length > 0 && (
          <Section title={t('newRequests')} action={<Button size="sm" variant="ghost" onClick={() => push('requests')}>View all</Button>}>
            <div className="space-y-2">
              {data.newRequests.map((r) => (
                <Card key={r.id} onClick={() => push('requests')} className="border-l-4 border-l-rose">
                  <div className="flex items-center justify-between"><Badge tone="red">NEW</Badge><span className="text-[12px] text-ink/50">{r.createdVia === 'call' ? 'Via call assistant' : 'Via app'}</span></div>
                  <p className="mt-1.5 font-semibold text-ink">{r.category}</p>
                  <p className="text-[13px] text-ink/60">{r.beneficiaryName} · {r.beneficiaryId}</p>
                </Card>
              ))}
            </div>
          </Section>
        )}

        <Section title={t('todaysVisits')} action={<Button size="sm" variant="ghost" onClick={() => tab('visits')}>Manage</Button>}>
          <div className="space-y-2">
            {data.todaysVisits.map((v) => (
              <Card key={v.id} onClick={() => push('beneficiary', { id: v.beneficiaryId })} className="flex items-center gap-3 !p-3.5">
                <span className={cx('size-2.5 shrink-0 rounded-full', v.displayStatus === 'completed' ? 'bg-leaf' : 'bg-mist')} />
                <span className="min-w-0 flex-1"><span className="block font-semibold text-ink">{v.beneficiaryName} <span className="font-normal text-ink/50">· {v.beneficiaryId}</span></span><span className="block truncate text-[13px] text-ink/60">{v.purpose}</span></span>
                <Badge tone={VISIT_TONE[v.displayStatus]}>{VISIT_LABEL[v.displayStatus]}</Badge>
              </Card>
            ))}
            {data.overdueVisits.map((v) => (
              <Card key={v.id} onClick={() => push('beneficiary', { id: v.beneficiaryId })} className="flex items-center gap-3 !p-3.5 border-rose/30">
                <TriangleAlert className="size-4 shrink-0 text-rose" />
                <span className="min-w-0 flex-1"><span className="block font-semibold text-ink">{v.beneficiaryName} <span className="font-normal text-ink/50">· {v.beneficiaryId}</span></span><span className="block truncate text-[13px] text-ink/60">{v.purpose} — due {formatDate(v.scheduledDate)}</span></span>
                <Badge tone="red">Overdue</Badge>
              </Card>
            ))}
          </div>
        </Section>

        {data.highPriorityTasks.length > 0 && (
          <Section title={t('highPriority')}>
            <div className="space-y-2">
              {data.highPriorityTasks.map((tk) => (
                <Card key={tk.id} onClick={() => push('beneficiary', { id: tk.beneficiaryId })} className="!p-3.5">
                  <p className="font-semibold text-ink">{tk.title}</p>
                  <p className="text-[13px] text-ink/60">{tk.beneficiaryName} · {tk.dueDate ? `due ${formatDate(tk.dueDate)}` : 'no due date'}</p>
                </Card>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

// ---------------- People ----------------
export function People() {
  const { t, push } = useApp()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<'all' | BeneficiaryCategory>('all')
  const { data, loading } = useLoad(() => api.call('searchBeneficiaries', { q }), [q])
  const list = (data ?? []).filter((b) => cat === 'all' || b.category === cat)
  return (
    <Screen title={t('beneficiaries')} subtitle="Your authorised area only" noBack>
      <SearchBar value={q} onChange={setQ} />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {(['all', 'pregnant', 'newborn', 'child', 'postnatal', 'elderly', 'general'] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cx('h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold', cat === c ? 'bg-navy text-white' : 'border border-line bg-white text-ink/70')}>{c === 'all' ? 'All' : CATEGORY_LABEL[c]}</button>
        ))}
      </div>
      <p className="mt-3 mb-2 text-[12.5px] text-ink/50">{list.length} shown · search by name, beneficiary ID, household ID or mobile</p>
      {loading && !data ? <Loading /> : (
        <div className="space-y-2">
          {list.map((b) => <BeneficiaryRow key={b.id} b={b} onClick={() => push('beneficiary', { id: b.id })} />)}
          {!list.length && <Empty icon={<Search className="size-6" />} title="No matches" body="Only beneficiaries in your assigned area are searchable." />}
        </div>
      )}
      <Button className="mt-4" block variant="secondary" icon={<House className="size-4" />} onClick={() => push('households')}>View household list</Button>
    </Screen>
  )
}

export function Households() {
  const { push } = useApp()
  const { data, loading } = useLoad(() => api.call('listHouseholds'))
  return (
    <Screen title="Households" subtitle="Demo Village · synthetic">
      {loading && !data ? <Loading /> : (
        <div className="space-y-2">
          {data?.map((h) => (
            <Card key={h.id}>
              <div className="flex items-center justify-between"><p className="font-semibold text-ink">{h.id} · {h.headName}</p><DemoBadge /></div>
              <p className="text-[13px] text-ink/55">{h.address}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {h.members.map((m) => <button key={m.id} onClick={() => push('beneficiary', { id: m.id })} className="rounded-full bg-leaf-soft px-2.5 py-1 text-[12px] font-semibold text-leaf-deep">{m.name} · {m.id}</button>)}
                {!h.members.length && <span className="text-[12px] text-ink/45">No registered beneficiaries</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  )
}

// ---------------- Beneficiary profile ----------------
export function BeneficiaryProfile() {
  const { t, route, push, toast, bump } = useApp()
  const id = route.params?.id ?? ''
  const { data, error, loading, reload } = useLoad(() => api.call('getBeneficiaryProfile', { id }), [id])
  const [visitModal, setVisitModal] = useState(false)
  if (loading && !data) return <Loading />
  if (error || !data) return <Screen title="Beneficiary"><ErrorBox message={error ?? 'Not found'} /></Screen>
  const b = data.beneficiary
  const vhr = data.records.find((r) => r.type === 'VHR')
  const openTasks = data.tasks.filter((x) => x.status === 'open')
  return (
    <Screen title={b.name} subtitle={`${b.id} · ${CATEGORY_LABEL[b.category]}`}>
      <Card className="!p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-leaf-soft text-leaf"><CatIcon c={b.category} className="size-7" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5"><Badge tone={CAT_TONE[b.category]}>{CATEGORY_LABEL[b.category]}</Badge>{b.synthetic && <DemoBadge />}</div>
            <p className="mt-1.5 text-[22px] font-bold leading-tight text-ink">{b.name}</p>
            <p className="text-[13.5px] text-ink/60">{b.ageLabel ?? `${b.age} years`} · {b.gender ?? '—'}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
          <Info label="Beneficiary ID" value={b.id} />
          <Info label="Household ID" value={b.householdId} />
          {b.category === 'pregnant' && <Info label="Pregnancy stage" value={vhr?.fields.pregnancyMonth?.value ?? 'Not recorded'} />}
          <Info label="Next visit" value={formatDate(vhr?.fields.nextVisitDate?.value)} />
          <Info label="Address" value={data.household?.address ?? '—'} />
          <Info label="Assigned ASHA" value="Meera (ASHA-DEMO-001)" />
          {b.motherBeneficiaryId && <Info label="Mother" value={b.motherBeneficiaryId} />}
        </dl>
        <div className="mt-4 rounded-2xl bg-paper p-3 text-[12.5px] text-ink/70">
          <p className="font-semibold text-ink">Consent and information sharing</p>
          {data.consent.linkedAccount ? (
            <p className="mt-0.5">Citizen account linked. Records sharing: <b>{data.consent.shareRecords ? 'allowed' : 'not allowed'}</b>. Self-reports: <b>{data.consent.shareSelfReports ? 'shared' : 'private'}</b>. Private assistant chats are never visible here.</p>
          ) : <p className="mt-0.5">No citizen account linked. Record maintained by ASHA worker.</p>}
        </div>
      </Card>

      <button onClick={() => push('voice', { id: b.id })} className="mt-4 flex w-full items-center gap-4 rounded-[28px] bg-leaf p-5 text-left text-white shadow-[0_18px_40px_-20px_rgba(15,122,90,0.8)] transition active:scale-[0.99]">
        <span className="relative grid size-16 shrink-0 place-items-center rounded-full bg-white/15">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/10" />
          <Mic className="size-8" />
        </span>
        <span>
          <span className="block text-[19px] font-bold leading-tight">{t('speakVisit')}</span>
          <span className="mt-1 block text-[13px] text-white/80">{t('speakVisitSub')}</span>
        </span>
      </button>

      <Button className="mt-3" block size="lg" variant="navy" icon={<NotebookPen className="size-5" />} onClick={() => push('records', { id: b.id })}>{t('openRecords')}</Button>
      <p className="mt-1.5 text-center text-[12px] text-ink/50">Records shown: {data.recordTypes.map((r) => RECORD_SCHEMAS[r].title).join(' · ')}</p>

      {data.pendingDrafts.length > 0 && (
        <div className="mt-4"><Notice tone="amber" title="Voice note awaiting approval">
          Nothing has been saved yet. <button className="font-semibold underline" onClick={() => push('review', { id: b.id, draftId: data.pendingDrafts[0].id })}>Review now</button>
        </Notice></div>
      )}

      {data.missingInfo.length > 0 && (
        <Section title="Missing information">
          <Card className="!p-0">
            {data.missingInfo.map((m, i) => (
              <button key={i} onClick={() => push('records', { id: b.id, type: m.recordType })} className="flex w-full items-center justify-between gap-2 border-b border-line px-4 py-3 text-left last:border-0">
                <span><span className="block text-[14px] font-medium text-ink">{m.label}</span><span className="text-[12px] text-ink/50">{RECORD_SCHEMAS[m.recordType].title}</span></span>
                <Badge tone="amber">Needs update</Badge>
              </button>
            ))}
          </Card>
        </Section>
      )}

      <Section title="Pending follow-ups" action={<Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => setVisitModal(true)}>Schedule</Button>}>
        <div className="space-y-2">
          {openTasks.map((tk) => (
            <Card key={tk.id} className="flex items-center gap-3 !p-3.5">
              <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-ink">{tk.title}</span><span className="text-[12px] text-ink/55">{tk.dueDate ? `Due ${formatDate(tk.dueDate)}` : 'No due date'} {tk.priority === 'high' && '· High priority'}</span></span>
              <Button size="sm" variant="secondary" onClick={async () => { await api.call('completeTask', { taskId: tk.id }); toast('Follow-up marked done', 'ok'); reload(); bump() }}>Done</Button>
            </Card>
          ))}
          {data.visits.filter((v) => v.status === 'scheduled').map((v) => (
            <Card key={v.id} className="flex items-center gap-3 !p-3.5">
              <CalendarDays className="size-4 shrink-0 text-mist" />
              <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-ink">{v.purpose}</span><span className="text-[12px] text-ink/55">{formatDate(v.scheduledDate)}</span></span>
              <Badge tone={VISIT_TONE[v.displayStatus]}>{VISIT_LABEL[v.displayStatus]}</Badge>
            </Card>
          ))}
          {!openTasks.length && !data.visits.some((v) => v.status === 'scheduled') && <p className="text-sm text-ink/50">No pending follow-ups.</p>}
        </div>
      </Section>

      <Section title="Documents" action={<Button size="sm" variant="ghost" onClick={() => push('documents', { id: b.id })}>Checklist</Button>}>
        <Card className="flex flex-wrap gap-1.5">
          {data.documents.map((d) => <Badge key={d.id} tone={DOC_TONE[d.status]}>{d.name}: {DOC_LABEL[d.status]}</Badge>)}
          {!data.documents.length && <span className="text-sm text-ink/50">No documents listed.</span>}
        </Card>
      </Section>

      {data.selfReports.length > 0 && (
        <Section title="Shared by citizen (self-reported)">
          <div className="space-y-2">{data.selfReports.map((r) => <Card key={r.id}><ProvenanceBadge source="self_reported" /><p className="mt-1.5 text-[14px] text-ink">{r.text}</p><p className="text-[12px] text-ink/50">{new Date(r.createdAt).toLocaleString('en-IN')}</p></Card>)}</div>
        </Section>
      )}

      <Section title="Previous ASHA notes">
        <div className="space-y-2">
          {data.diary.slice(0, 5).map((d) => (
            <Card key={d.id}>
              <div className="flex items-center justify-between"><p className="text-[13px] font-semibold text-ink">{formatDate(d.fields.visitDateTime?.slice(0, 10))} · {d.fields.purpose}</p>{d.source === 'voice_reviewed' && <Badge tone="gray">Voice, reviewed</Badge>}</div>
              {d.fields.reportedConcerns && <p className="mt-1 text-[13px] text-ink/70">Concerns: {d.fields.reportedConcerns}</p>}
              {d.fields.counselling && <p className="text-[13px] text-ink/70">Counselling: {d.fields.counselling}</p>}
              {d.fields.activities && <p className="text-[13px] text-ink/70">{d.fields.activities}</p>}
            </Card>
          ))}
          {!data.diary.length && <p className="text-sm text-ink/50">No diary entries yet.</p>}
        </div>
      </Section>

      <Section title="Visit history">
        <Card className="!p-0">
          {data.visits.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 last:border-0">
              <span><span className="block text-[14px] text-ink">{v.purpose}</span><span className="text-[12px] text-ink/50">{formatDate(v.scheduledDate)}{v.rescheduledFrom ? ` (moved from ${formatDate(v.rescheduledFrom)})` : ''}</span></span>
              <Badge tone={VISIT_TONE[v.displayStatus]}>{VISIT_LABEL[v.displayStatus]}</Badge>
            </div>
          ))}
        </Card>
      </Section>

      {data.householdMembers.length > 0 && (
        <Section title="Household members">
          <div className="flex flex-wrap gap-2">{data.householdMembers.map((m) => <button key={m.id} onClick={() => push('beneficiary', { id: m.id })} className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-semibold text-ink">{m.name} · {CATEGORY_LABEL[m.category]}</button>)}</div>
        </Section>
      )}
      <NewVisitModal open={visitModal} onClose={() => setVisitModal(false)} beneficiaryId={b.id} onDone={() => { reload(); bump() }} />
    </Screen>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink/45">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  )
}

function NewVisitModal({ open, onClose, beneficiaryId, onDone }: { open: boolean; onClose: () => void; beneficiaryId?: string; onDone: () => void }) {
  const { toast } = useApp()
  const people = useLoad(() => (open && !beneficiaryId ? api.call('searchBeneficiaries', { q: '' }) : Promise.resolve([])), [open])
  const [bid, setBid] = useState(beneficiaryId ?? '')
  const [date, setDate] = useState(addDays(isoDate(new Date()), 7))
  const [purpose, setPurpose] = useState('Follow-up home visit')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    try {
      await api.call('createVisit', { beneficiaryId: beneficiaryId ?? bid, date, purpose })
      toast('Visit scheduled', 'ok')
      onDone()
      onClose()
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Schedule a visit" footer={<><Button variant="secondary" block onClick={onClose}>Cancel</Button><Button block loading={busy} disabled={!(beneficiaryId || bid)} onClick={submit}>Schedule</Button></>}>
      <div className="space-y-3">
        {!beneficiaryId && (
          <Field label="Beneficiary"><Select value={bid} onChange={(e) => setBid(e.target.value)}><option value="">Choose…</option>{people.data?.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.id}</option>)}</Select></Field>
        )}
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Purpose"><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}

// ---------------- Records ----------------
export function Records() {
  const { route, toast, bump, push } = useApp()
  const id = route.params?.id ?? ''
  const { data, error, loading, reload } = useLoad(() => api.call('getBeneficiaryProfile', { id }), [id])
  const [active, setActive] = useState<RecordType | undefined>(route.params?.type as RecordType | undefined)
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (data && !active) setActive(data.recordTypes[0]) }, [data, active])
  if (loading && !data) return <Loading />
  if (error || !data || !active) return <Screen title="Records"><ErrorBox message={error ?? 'Not found'} /></Screen>
  const b = data.beneficiary
  const schema = RECORD_SCHEMAS[active]
  const rec = data.records.find((r) => r.type === active)
  const defs = fieldsFor(active, b.category)
  const startEdit = () => { setValues(Object.fromEntries(defs.map((d) => [d.key, rec?.fields[d.key]?.value ?? '']))); setEditing(true) }
  const save = async () => {
    setBusy(true)
    try {
      if (active === 'ASHA_DIARY') { await api.call('addDiaryEntry', { beneficiaryId: b.id, fields: values }); toast('Diary entry saved', 'ok') }
      else { const r = await api.call('updateRecord', { beneficiaryId: b.id, type: active, values }); toast(r.changed.length ? `${r.changed.length} field(s) updated` : 'No changes', 'ok') }
      setEditing(false); reload(); bump()
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <Screen title="Beneficiary records" subtitle={`${b.name} · ${b.id}`}>
      <Segmented value={active} onChange={(v) => { setActive(v); setEditing(false) }} options={data.recordTypes.map((r) => ({ value: r, label: r === 'VHR' ? 'Village Register' : r === 'ASHA_DIARY' ? 'ASHA Diary' : RECORD_SCHEMAS[r].title.replace(' Record', '').replace(' Home Visit', '') }))} />
      <Card className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <div><p className="text-[17px] font-bold text-ink">{schema.title}</p><p className="text-[13px] text-ink/60">{schema.purpose}</p></div>
          {b.synthetic && <DemoBadge />}
        </div>
        {!editing && <div className="mt-3 flex gap-2">
          <Button size="sm" icon={active === 'ASHA_DIARY' ? <Plus className="size-4" /> : <Pencil className="size-4" />} onClick={active === 'ASHA_DIARY' ? () => { setValues({ visitDateTime: isoDate(new Date()), purpose: '' }); setEditing(true) } : startEdit}>{active === 'ASHA_DIARY' ? 'Add entry manually' : 'Edit manually'}</Button>
          <Button size="sm" variant="secondary" icon={<Mic className="size-4" />} onClick={() => push('voice', { id: b.id })}>Speak instead</Button>
        </div>}
      </Card>

      {editing ? (
        <div className="mt-3 space-y-3">
          {defs.map((d) => (
            <Field key={d.key} label={d.label} hint={d.nature === 'measurement' ? 'Measurement — only if taken by an authorised person. Never estimate.' : d.nature === 'verified' ? 'Copy only from facility record / MCP card.' : d.nature === 'observation' ? 'Your observation — not a medical diagnosis.' : d.help}>
              {d.kind === 'textarea' ? <Textarea value={values[d.key] ?? ''} onChange={(e) => setValues({ ...values, [d.key]: e.target.value })} /> :
                d.kind === 'select' ? <Select value={values[d.key] ?? ''} onChange={(e) => setValues({ ...values, [d.key]: e.target.value })}><option value="">—</option>{d.options!.map((o) => <option key={o}>{o}</option>)}</Select> :
                  <Input type={d.kind === 'date' ? 'date' : 'text'} value={values[d.key] ?? ''} onChange={(e) => setValues({ ...values, [d.key]: e.target.value })} />}
            </Field>
          ))}
          <div className="sticky bottom-24 flex gap-2 rounded-2xl bg-paper/95 py-2"><Button variant="secondary" block onClick={() => setEditing(false)}>Cancel</Button><Button block loading={busy} onClick={save}>Save</Button></div>
        </div>
      ) : active === 'ASHA_DIARY' ? (
        <div className="mt-3 space-y-2">
          {data.diary.map((d) => (
            <Card key={d.id}>
              <div className="flex items-center justify-between"><p className="font-semibold text-ink">{d.fields.visitDateTime?.slice(0, 10)} · {d.fields.purpose}</p><Badge tone={d.source === 'voice_reviewed' ? 'blue' : 'gray'}>{d.source === 'voice_reviewed' ? 'Voice, reviewed' : d.source === 'visit_completion' ? 'Visit completion' : 'Manual'}</Badge></div>
              <dl className="mt-2 space-y-1.5">
                {RECORD_SCHEMAS.ASHA_DIARY.fields.filter((f) => f.key !== 'visitDateTime' && f.key !== 'purpose' && d.fields[f.key]).map((f) => (
                  <div key={f.key}><dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink/45">{f.label}</dt><dd className="text-[14px] text-ink">{d.fields[f.key]}</dd></div>
                ))}
              </dl>
            </Card>
          ))}
          {!data.diary.length && <Empty icon={<NotebookPen className="size-6" />} title="No diary entries" body="Add one manually or speak about today's visit." />}
        </div>
      ) : (
        <Card className="mt-3 !p-0">
          {defs.map((d) => {
            const fv = rec?.fields[d.key]
            return (
              <div key={d.key} className="border-b border-line px-4 py-3 last:border-0">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink/45">{d.label}{d.required && !fv && <span className="ml-1 text-[#8A5A08]">· required</span>}</p>
                {fv ? (
                  <><p className="mt-0.5 text-[14.5px] text-ink">{d.kind === 'date' ? formatDate(fv.value) : fv.value}</p><div className="mt-1"><ProvenanceBadge source={fv.source} voice={fv.viaVoiceReview} /></div></>
                ) : <p className="mt-0.5 text-[14px] italic text-ink/40">{d.nature === 'measurement' ? 'Not measured' : 'Not recorded'}</p>}
              </div>
            )
          })}
        </Card>
      )}
    </Screen>
  )
}

// ---------------- Voice documentation ----------------
export function VoiceDoc() {
  const { route, push, toast, lang: uiLang } = useApp()
  const id = route.params?.id ?? ''
  const { data } = useLoad(() => api.call('getBeneficiaryProfile', { id }), [id])
  const [lang, setLang] = useState<Lang>(uiLang)
  const [transcript, setTranscript] = useState('')
  const [mode, setMode] = useState<SttMode>('typed')
  const [listening, setListening] = useState(false)
  const [sttError, setSttError] = useState('')
  const [busy, setBusy] = useState(false)
  const stopRef = useRef<() => void>(() => {})
  const sttAvailable = useMemo(() => isSttAvailable(), [])
  useEffect(() => () => stopRef.current(), [])
  const b = data?.beneficiary

  const toggleMic = () => {
    if (listening) { stopRef.current(); setListening(false); return }
    setSttError('')
    setListening(true)
    stopRef.current = startRecognition(lang, {
      onText: (text) => { setTranscript(text); setMode('browser_speech') },
      onEnd: () => setListening(false),
      onError: (msg) => { setSttError(msg); setListening(false) },
    })
  }
  const useDemo = () => { if (!b) return; setTranscript(DEMO_TRANSCRIPTS[lang](b.name)); setMode('demo_simulated'); setSttError('') }
  const process = async () => {
    if (!b) return
    setBusy(true)
    try {
      const { draft } = await api.call('processTranscript', { beneficiaryId: b.id, transcript, language: lang, sttMode: mode })
      push('review', { id: b.id, draftId: draft.id })
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  if (!b) return <Loading />
  return (
    <Screen title="Speak about today's visit" subtitle={`${b.name} · ${b.id} · ${CATEGORY_LABEL[b.category]}`}>
      <Segmented value={lang} onChange={setLang} options={(Object.keys(LANG_NAMES) as Lang[]).map((l) => ({ value: l, label: LANG_NAMES[l] }))} />
      <div className="mt-6 flex flex-col items-center">
        <button onClick={toggleMic} disabled={!sttAvailable} aria-pressed={listening} aria-label={listening ? 'Stop recording' : 'Start recording'}
          className={cx('relative grid size-36 place-items-center rounded-full text-white transition disabled:opacity-40', listening ? 'bg-rose' : 'bg-leaf')}>
          {listening && <span className="absolute inset-0 animate-ping rounded-full bg-rose/30" />}
          {listening ? <MicOff className="size-14" /> : <Mic className="size-14" />}
        </button>
        <p className="mt-3 text-[15px] font-semibold text-ink">{listening ? 'Listening… tap to stop' : sttAvailable ? 'Tap and speak naturally' : 'Speech recognition unavailable here'}</p>
        <p className="text-[12.5px] text-ink/55">{sttAvailable ? `Browser speech recognition (${LANG_NAMES[lang]}) — accuracy depends on your browser/device` : 'Use typing or the demo transcript below'}</p>
      </div>
      {sttError && <div className="mt-4"><Notice tone="amber" title="Voice input could not start">{sttError} You can also type the note, or use the labelled demo transcript.
        {isEmbedded() && <a href={window.location.href} target="_blank" rel="noreferrer" className="mt-2 flex h-10 w-fit items-center rounded-xl bg-navy px-3 text-[13px] font-semibold text-white">Open app in a new tab</a>}
      </Notice></div>}

      <div className="mt-5">
        <Field label="Transcript (you can edit before processing)">
          <Textarea className="min-h-36" value={transcript} onChange={(e) => { setTranscript(e.target.value); if (mode !== 'browser_speech') setMode('typed') }} placeholder="Example: Today I visited Lakshmi. She is seven months pregnant…" />
        </Field>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={mode === 'demo_simulated' ? 'amber' : mode === 'browser_speech' ? 'green' : 'gray'}>
            {mode === 'demo_simulated' ? 'SIMULATED speech (demo transcript)' : mode === 'browser_speech' ? 'Captured by browser speech recognition' : <><Keyboard className="size-3" /> Typed</>}
          </Badge>
          <Button size="sm" variant="secondary" icon={<Sparkles className="size-4" />} onClick={useDemo}>Use demo transcription</Button>
        </div>
      </div>
      <Notice tone="blue">
        <b>Nothing is saved yet.</b> The next step extracts details into the Village Health Register, ASHA Diary and {CATEGORY_LABEL[b.category] === 'Pregnant woman' ? 'Maternal Health Record' : 'category record'} for your review. You must approve before anything is stored.
      </Notice>
      <Button className="mt-4" block size="lg" loading={busy} disabled={!transcript.trim()} onClick={process}>Process transcript</Button>
    </Screen>
  )
}

export function ReviewDraft() {
  const { route, push, toast, bump, tab, back } = useApp()
  const id = route.params?.id ?? ''
  const draftId = route.params?.draftId ?? ''
  const { data, loading } = useLoad(() => api.call('getBeneficiaryProfile', { id }), [id])
  const draft = data?.pendingDrafts.find((d) => d.id === draftId)
  const [rows, setRows] = useState<Array<ExtractedField & { include: boolean }>>([])
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [approved, setApproved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ saved: number; nextDate?: string } | null>(null)
  useEffect(() => { if (draft) setRows(draft.extraction.fields.map((f) => ({ ...f, include: !f.needsConfirmation }))) }, [draft?.id])

  if (loading && !data) return <Loading />
  if (result) {
    return (
      <Screen title="Saved after your approval">
        <div className="mt-6 flex flex-col items-center text-center">
          <span className="grid size-20 place-items-center rounded-full bg-leaf text-white"><Check className="size-10" /></span>
          <p className="mt-4 text-[20px] font-bold text-ink">{result.saved} reviewed field(s) saved</p>
          <p className="mt-1 text-[14px] text-ink/65">Records for {data?.beneficiary.name} were updated. Today's visit is marked completed.</p>
          {result.nextDate && <div className="mt-4 w-full"><Notice tone="green" title="Follow-up created">Next visit scheduled for {formatDate(result.nextDate)}. A reminder notification has been added{data?.beneficiary.linkedUserId ? ' for you and the citizen' : ''}.</Notice></div>}
        </div>
        <div className="mt-6 space-y-2">
          <Button block onClick={() => push('records', { id })}>View updated records</Button>
          <Button block variant="secondary" onClick={() => tab('alerts')}>View notifications</Button>
        </div>
      </Screen>
    )
  }
  if (!draft || !data) return <Screen title="Review"><Empty icon={<ListChecks className="size-6" />} title="This draft is no longer pending" body="It may already have been approved or discarded." action={<Button onClick={back}>Go back</Button>} /></Screen>

  const b = data.beneficiary
  const groups = data.recordTypes.map((rt) => ({ rt, items: rows.map((r, i) => ({ r, i })).filter((x) => x.r.recordType === rt) }))
  const update = (i: number, patch: Partial<ExtractedField & { include: boolean }>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const approve = async () => {
    setBusy(true)
    try {
      const fields = [
        ...rows.filter((r) => r.include && r.value.trim()).map((r) => ({ recordType: r.recordType, key: r.key, value: r.value })),
        ...draft.extraction.missing.filter((m) => extra[`${m.recordType}.${m.key}`]?.trim()).map((m) => ({ recordType: m.recordType, key: m.key, value: extra[`${m.recordType}.${m.key}`] })),
      ]
      // De-duplicate: manual entries for a missing field override extracted ones.
      const map = new Map(fields.map((f) => [`${f.recordType}.${f.key}`, f]))
      const res = await api.call('approveDraft', { draftId: draft.id, confirmed: true, fields: [...map.values()] })
      setResult({ saved: res.saved, nextDate: res.visit?.scheduledDate })
      bump()
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  const discard = async () => { await api.call('discardDraft', { draftId: draft.id }); toast('Draft discarded. Nothing was saved.', 'info'); bump(); back() }

  return (
    <Screen title="Review extracted details" subtitle={`${b.name} · ${b.id}`}>
      <Notice tone="amber" title="AI-extracted — not confirmed medical data">Check every field. Edit or untick anything that is wrong. Fields marked "confirm" are unticked until you check them.</Notice>
      <Card className="mt-3">
        <div className="flex items-center justify-between"><p className="text-[12px] font-bold uppercase tracking-wide text-ink/50">Original transcript</p><Badge tone={draft.sttMode === 'demo_simulated' ? 'amber' : 'gray'}>{draft.sttMode === 'demo_simulated' ? 'Simulated speech' : draft.sttMode === 'browser_speech' ? 'Browser speech' : 'Typed'} · {LANG_NAMES[draft.language]}</Badge></div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink/80">“{draft.transcript}”</p>
        <p className="mt-2 text-[11.5px] text-ink/45">Agents run: Voice Processing → Orchestrator → ASHA Documentation Agent ({draft.extraction.engine === 'rule_based' ? 'rule-based extraction' : 'Gemini, validated'})</p>
      </Card>
      {draft.extraction.urgentFlags.length > 0 && <div className="mt-3"><Notice tone="red" icon={<TriangleAlert className="size-4" />} title="Possible danger signs mentioned">{draft.extraction.urgentFlags.join('; ')}. Advise prompt professional assessment or call 108. This is not a diagnosis.</Notice></div>}
      {draft.extraction.notes.map((n, i) => <p key={i} className="mt-2 text-[12.5px] text-ink/60">• {n}</p>)}

      {groups.map(({ rt, items }) => items.length > 0 && (
        <Section key={rt} title={RECORD_SCHEMAS[rt].title}>
          <div className="space-y-2">
            {items.map(({ r, i }) => (
              <Card key={i} className={cx('!p-3.5', !r.include && 'opacity-70')}>
                <div className="flex items-start gap-2">
                  <input type="checkbox" aria-label={`Include ${r.label}`} className="mt-1 size-5 accent-[#0F7A5A]" checked={r.include} onChange={(e) => update(i, { include: e.target.checked })} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-ink">{r.label}</p>
                      <Badge tone={r.confidence === 'high' ? 'green' : r.confidence === 'medium' ? 'blue' : 'amber'}>{r.confidence}</Badge>
                      {r.needsConfirmation && <Badge tone="amber">confirm</Badge>}
                      <ProvenanceBadge source={r.source} />
                    </div>
                    <Input className="mt-2 !h-11" type={RECORD_SCHEMAS[rt].fields.find((f) => f.key === r.key)?.kind === 'date' ? 'date' : 'text'} value={r.value} onChange={(e) => update(i, { value: e.target.value, include: true })} />
                    <p className="mt-1 text-[11.5px] text-ink/45">Evidence: “{r.evidence}”</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      ))}

      {draft.extraction.missing.length > 0 && (
        <Section title="Additional information required">
          <div className="space-y-2">
            {draft.extraction.missing.map((m) => {
              const k = `${m.recordType}.${m.key}`
              const def = RECORD_SCHEMAS[m.recordType].fields.find((f) => f.key === m.key)
              return (
                <Card key={k} className="!p-3.5 border-sun/40">
                  <p className="text-[13.5px] font-semibold text-[#6E4706]">{m.message}</p>
                  <p className="text-[11.5px] text-ink/50">{RECORD_SCHEMAS[m.recordType].title} · {m.label}</p>
                  <Input className="mt-2 !h-11" type={def?.kind === 'date' ? 'date' : 'text'} placeholder={def?.nature === 'measurement' ? 'Leave empty if not measured' : 'Add manually (optional)'} value={extra[k] ?? ''} onChange={(e) => setExtra({ ...extra, [k]: e.target.value })} />
                </Card>
              )
            })}
            <Button variant="secondary" size="sm" icon={<Mic className="size-4" />} onClick={() => push('voice', { id })}>Speak again</Button>
          </div>
        </Section>
      )}

      <Card className="mt-6 border-leaf/30">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-0.5 size-5 accent-[#0F7A5A]" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
          <span className="text-[14px] text-ink">I have reviewed these details and confirm they are accurate to the best of my knowledge. They are reported information, not a medical diagnosis.</span>
        </label>
      </Card>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" block onClick={discard}>Discard</Button>
        <Button block size="lg" icon={<BadgeCheck className="size-5" />} disabled={!approved} loading={busy} onClick={approve}>Approve and save</Button>
      </div>
    </Screen>
  )
}

// ---------------- Visits ----------------
export function Visits() {
  const { t, push, route, toast, bump } = useApp()
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'overdue' | 'completed' | 'tasks'>((route.params?.filter as 'overdue') ?? 'today')
  const visits = useLoad(() => api.call('listVisits'))
  const tasks = useLoad(() => api.call('listTasks'))
  const [complete, setComplete] = useState<string | null>(null)
  const [resched, setResched] = useState<string | null>(null)
  const [newVisit, setNewVisit] = useState(false)
  const [notes, setNotes] = useState('')
  const [nextDate, setNextDate] = useState('')
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const today = isoDate(new Date())
  const list = (visits.data ?? []).filter((v) =>
    filter === 'today' ? v.scheduledDate === today && v.status !== 'cancelled' : filter === 'upcoming' ? v.displayStatus === 'scheduled' && v.scheduledDate > today : filter === 'overdue' ? v.displayStatus === 'overdue' : v.status === 'completed')
  const reloadAll = () => { visits.reload(); tasks.reload(); bump() }
  return (
    <Screen title={t('visits')} subtitle="Visit calendar and follow-ups" noBack={!route.params?.filter} right={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setNewVisit(true)}>New</Button>}>
      <Segmented value={filter} onChange={setFilter} options={[{ value: 'today', label: 'Today' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'overdue', label: 'Overdue' }, { value: 'completed', label: 'Done' }, { value: 'tasks', label: 'Tasks' }]} />
      <div className="mt-3 space-y-2">
        {filter === 'tasks' ? (tasks.data ?? []).filter((x) => x.status === 'open').map((tk) => (
          <Card key={tk.id} className="!p-3.5">
            <div className="flex items-center gap-2">{tk.priority === 'high' && <Badge tone="red">High</Badge>}<p className="flex-1 text-[14px] font-semibold text-ink">{tk.title}</p></div>
            <p className="text-[12.5px] text-ink/55">{tk.beneficiaryName} · {tk.dueDate ? `due ${formatDate(tk.dueDate)}` : 'no due date'}</p>
            <div className="mt-2 flex gap-2"><Button size="sm" onClick={async () => { await api.call('completeTask', { taskId: tk.id }); toast('Task done', 'ok'); reloadAll() }}>Mark done</Button><Button size="sm" variant="secondary" onClick={() => push('beneficiary', { id: tk.beneficiaryId })}>Open profile</Button></div>
          </Card>
        )) : list.map((v) => (
          <Card key={v.id} className="!p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-ink">{v.beneficiaryName} <span className="font-normal text-ink/50">· {v.beneficiaryId}</span></p>
              <Badge tone={VISIT_TONE[v.displayStatus]}>{VISIT_LABEL[v.displayStatus]}</Badge>
            </div>
            <p className="text-[13px] text-ink/60">{v.purpose} · {formatDate(v.scheduledDate)}</p>
            {v.notes && <p className="mt-1 text-[12.5px] text-ink/50">{v.notes}</p>}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {v.status === 'scheduled' && <Button size="sm" icon={<Check className="size-4" />} onClick={() => { setComplete(v.id); setNotes(''); setNextDate('') }}>Complete</Button>}
              {v.status === 'scheduled' && <Button size="sm" variant="secondary" onClick={() => { setResched(v.id); setDate(addDays(today, 1)); setReason('') }}>Reschedule</Button>}
              <Button size="sm" variant="ghost" onClick={() => push('beneficiary', { id: v.beneficiaryId })}>Profile</Button>
            </div>
          </Card>
        ))}
        {filter !== 'tasks' && visits.data && !list.length && <Empty icon={<CalendarDays className="size-6" />} title="No visits here" />}
      </div>
      <Modal open={!!complete} onClose={() => setComplete(null)} title="Complete visit" footer={<><Button block variant="secondary" onClick={() => setComplete(null)}>Cancel</Button><Button block onClick={async () => { try { await api.call('completeVisit', { visitId: complete!, notes, nextVisitDate: nextDate || undefined }); toast('Visit completed and added to ASHA Diary', 'ok'); setComplete(null); reloadAll() } catch (e) { toast((e as Error).message, 'error') } }}>Complete</Button></>}>
        <div className="space-y-3">
          <Field label="Visit notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was done during the visit" /></Field>
          <Field label="Next visit date (creates a follow-up)"><Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} /></Field>
        </div>
      </Modal>
      <Modal open={!!resched} onClose={() => setResched(null)} title="Reschedule visit" footer={<><Button block variant="secondary" onClick={() => setResched(null)}>Cancel</Button><Button block onClick={async () => { try { await api.call('rescheduleVisit', { visitId: resched!, newDate: date, reason }); toast('Visit rescheduled', 'ok'); setResched(null); reloadAll() } catch (e) { toast((e as Error).message, 'error') } }}>Save</Button></>}>
        <div className="space-y-3">
          <Field label="New date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Reason (optional)"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        </div>
      </Modal>
      <NewVisitModal open={newVisit} onClose={() => setNewVisit(false)} onDone={reloadAll} />
    </Screen>
  )
}

// ---------------- Assistance requests (ASHA) ----------------
const REQ_TONE: Record<RequestStatus, Tone> = { NEW: 'red', ASSIGNED: 'blue', IN_PROGRESS: 'blue', FOLLOW_UP_SCHEDULED: 'amber', COMPLETED: 'green', REFERRED: 'navy' }
export const REQ_LABEL: Record<RequestStatus, string> = { NEW: 'NEW', ASSIGNED: 'ASSIGNED', IN_PROGRESS: 'IN PROGRESS', FOLLOW_UP_SCHEDULED: 'FOLLOW-UP SCHEDULED', COMPLETED: 'COMPLETED', REFERRED: 'REFERRED' }
export { REQ_TONE }

export function AshaRequests() {
  const { push, toast, bump } = useApp()
  const { data, loading, reload } = useLoad(() => api.call('listRequests'))
  const [edit, setEdit] = useState<{ id: string; status: RequestStatus; note: string } | null>(null)
  return (
    <Screen title="Assistance requests" subtitle="From citizens in your area">
      {loading && !data ? <Loading /> : !data?.length ? <Empty icon={<HandHeart className="size-6" />} title="No requests yet" body="When a citizen requests help (in the app or via the call assistant), it appears here." /> : (
        <div className="space-y-2">
          {data.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between"><Badge tone={REQ_TONE[r.status]}>{REQ_LABEL[r.status]}</Badge><span className="text-[12px] text-ink/50">{new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
              <p className="mt-2 font-semibold text-ink">{r.category}</p>
              <p className="text-[13px] text-ink/60">{r.beneficiaryName} · {r.beneficiaryId ?? 'not linked'} · prefers {r.contactMethod.replace('_', ' ')}</p>
              {r.description && <p className="mt-1.5 rounded-xl bg-paper p-2.5 text-[13.5px] text-ink/80">{r.description}</p>}
              <p className="mt-1 text-[11.5px] text-ink/45">Created via {r.createdVia} · consent to share: {r.consentToShare ? 'yes' : 'no'}</p>
              <div className="mt-2.5 flex gap-2">
                <Button size="sm" onClick={() => setEdit({ id: r.id, status: r.status === 'NEW' ? 'ASSIGNED' : r.status, note: '' })}>Update status</Button>
                {r.beneficiaryId && <Button size="sm" variant="secondary" onClick={() => push('beneficiary', { id: r.beneficiaryId })}>Profile</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Update request status" footer={<><Button block variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button block onClick={async () => { await api.call('updateRequestStatus', { requestId: edit!.id, status: edit!.status, note: edit!.note || undefined }); toast('Status updated — citizen notified', 'ok'); setEdit(null); reload(); bump() }}>Save</Button></>}>
        {edit && <div className="space-y-3">
          <Field label="Status"><Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as RequestStatus })}>{(Object.keys(REQ_LABEL) as RequestStatus[]).map((s) => <option key={s} value={s}>{REQ_LABEL[s]}</option>)}</Select></Field>
          <Field label="Note for the citizen (optional)" hint="Keep it short; avoid sensitive health details."><Input value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
        </div>}
      </Modal>
    </Screen>
  )
}

// ---------------- Documents ----------------
export const DOC_TONE: Record<DocumentItem['status'], Tone> = { missing: 'red', received: 'green', needs_verification: 'amber', uploaded: 'blue' }
export const DOC_LABEL: Record<DocumentItem['status'], string> = { missing: 'Missing', received: 'Received', needs_verification: 'Pending verification', uploaded: 'Uploaded (demo)' }

export function DocumentRow({ d, role, onChange }: { d: DocumentItem & { beneficiaryName?: string }; role: 'asha' | 'citizen'; onChange: () => void }) {
  const { toast } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const set = async (status: DocumentItem['status'], file?: File) => {
    try {
      await api.call('updateDocument', { documentId: d.id, status, fileName: file?.name, fileSize: file?.size })
      toast(status === 'uploaded' ? 'Demo upload recorded (file name only — content not stored)' : 'Document status updated', 'ok')
      onChange()
    } catch (e) { toast((e as Error).message, 'error') }
  }
  return (
    <Card className="!p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-semibold text-ink">{d.name}</p><p className="text-[12.5px] text-ink/55">{d.beneficiaryName ? `${d.beneficiaryName} · ` : ''}{d.purpose}</p>{d.fileName && <p className="text-[12px] text-ink/45">File: {d.fileName}</p>}</div>
        <Badge tone={DOC_TONE[d.status]}>{DOC_LABEL[d.status]}</Badge>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && set('uploaded', e.target.files[0])} />
        <Button size="sm" variant="secondary" icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>Upload demo file</Button>
        {role === 'asha' && d.status !== 'received' && <Button size="sm" onClick={() => set('received')}>Mark received</Button>}
        {role === 'asha' && d.status !== 'needs_verification' && <Button size="sm" variant="ghost" onClick={() => set('needs_verification')}>Needs verification</Button>}
      </div>
    </Card>
  )
}

export function Documents() {
  const { route } = useApp()
  const id = route.params?.id
  const { data, loading, reload } = useLoad(() => api.call('listDocuments', { beneficiaryId: id }), [id])
  const [name, setName] = useState('')
  const missing = (data ?? []).filter((d) => d.status === 'missing').length
  return (
    <Screen title="Document checklist" subtitle={id ? `Beneficiary ${id}` : 'All beneficiaries in your area'}>
      <Notice tone="blue">“Received” means you have seen the document. SAKHI VANI does not officially verify documents. Demo uploads store only the file name.</Notice>
      <p className="mt-3 text-[13px] text-ink/60">{missing} missing · {(data ?? []).length} total</p>
      {loading && !data ? <Loading /> : <div className="mt-2 space-y-2">{data?.map((d) => <DocumentRow key={d.id} d={d} role="asha" onChange={reload} />)}</div>}
      {id && (
        <Card className="mt-4">
          <p className="text-[13px] font-semibold text-ink">Add a required document</p>
          <div className="mt-2 flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Birth registration" /><Button onClick={async () => { await api.call('addDocument', { beneficiaryId: id, name, purpose: 'Added by ASHA' }); setName(''); reload() }} disabled={!name.trim()}>Add</Button></div>
        </Card>
      )}
    </Screen>
  )
}

// ---------------- Water inspection ----------------
export function Water() {
  const { toast } = useApp()
  const list = useLoad(() => api.call('listWater'))
  const households = useLoad(() => api.call('listHouseholds'))
  const [f, setF] = useState({ householdId: '', waterSource: '', storageMethod: '', cleanlinessConcerns: '', observations: '', guidanceProvided: true, followUpDate: '' })
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    try { await api.call('createWater', f); toast('Water inspection saved', 'ok'); setF({ ...f, cleanlinessConcerns: '', observations: '' }); list.reload() } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <Screen title="Water inspection" subtitle="Household safe-storage check">
      <Notice tone="amber">A visual check or questionnaire cannot prove water is microbiologically safe. Only laboratory testing can confirm that.</Notice>
      <Card className="mt-3 space-y-3">
        <Field label="Household" required><Select value={f.householdId} onChange={(e) => setF({ ...f, householdId: e.target.value })}><option value="">Choose…</option>{households.data?.map((h) => <option key={h.id} value={h.id}>{h.id} · {h.headName}</option>)}</Select></Field>
        <Field label="Water source" required><Select value={f.waterSource} onChange={(e) => setF({ ...f, waterSource: e.target.value })}><option value="">Choose…</option>{['Piped supply', 'Public tap', 'Borewell / hand pump', 'Open well', 'Tanker', 'Other'].map((o) => <option key={o}>{o}</option>)}</Select></Field>
        <Field label="Storage method" required><Select value={f.storageMethod} onChange={(e) => setF({ ...f, storageMethod: e.target.value })}><option value="">Choose…</option>{['Covered container', 'Uncovered container', 'Overhead tank', 'Container with tap', 'Other'].map((o) => <option key={o}>{o}</option>)}</Select></Field>
        <Field label="Visible cleanliness concerns"><Input value={f.cleanlinessConcerns} onChange={(e) => setF({ ...f, cleanlinessConcerns: e.target.value })} placeholder="e.g. container not covered" /></Field>
        <Field label="Observations"><Textarea value={f.observations} onChange={(e) => setF({ ...f, observations: e.target.value })} /></Field>
        <label className="flex items-center gap-3 text-[14px]"><input type="checkbox" className="size-5 accent-[#0F7A5A]" checked={f.guidanceProvided} onChange={(e) => setF({ ...f, guidanceProvided: e.target.checked })} /> Safe storage guidance provided</label>
        <Field label="Follow-up date"><Input type="date" value={f.followUpDate} onChange={(e) => setF({ ...f, followUpDate: e.target.value })} /></Field>
        <Button block loading={busy} icon={<Droplets className="size-4" />} onClick={submit}>Save inspection</Button>
      </Card>
      <Section title="Recent inspections">
        <div className="space-y-2">
          {list.data?.map((w) => <Card key={w.id} className="!p-3.5"><p className="font-semibold text-ink">{w.householdId} · {formatDate(w.inspectionDate)}</p><p className="text-[13px] text-ink/60">{w.waterSource} · {w.storageMethod}{w.cleanlinessConcerns ? ` · ${w.cleanlinessConcerns}` : ''}</p>{w.followUpDate && <p className="text-[12px] text-ink/50">Follow-up {formatDate(w.followUpDate)}</p>}</Card>)}
          {list.data && !list.data.length && <p className="text-sm text-ink/50">No inspections recorded yet.</p>}
        </div>
      </Section>
    </Screen>
  )
}

export function AuditLogScreen() {
  const { data, loading } = useLoad(() => api.call('listAudit'))
  return (
    <Screen title="My activity log" subtitle="Audit trail of your actions">
      {loading && !data ? <Loading /> : <Card className="!p-0">{data?.map((a) => <div key={a.id} className="border-b border-line px-4 py-2.5 last:border-0"><p className="text-[13px] font-semibold text-ink">{a.action.replace(/_/g, ' ').toLowerCase()} · {a.entity} {a.entityId}</p><p className="text-[12px] text-ink/50">{new Date(a.at).toLocaleString('en-IN')}{a.detail ? ` · ${a.detail}` : ''}</p></div>)}</Card>}
    </Screen>
  )
}

export function AshaMore() {
  const { push, user, t } = useApp()
  const items = [
    { icon: <HandHeart className="size-5" />, label: 'Assistance requests', to: 'requests' },
    { icon: <FileText className="size-5" />, label: 'Document checklist', to: 'documents' },
    { icon: <Droplets className="size-5" />, label: 'Water inspection', to: 'water' },
    { icon: <House className="size-5" />, label: 'Household list', to: 'households' },
    { icon: <Activity className="size-5" />, label: 'My activity log', to: 'audit' },
    { icon: <SettingsIcon className="size-5" />, label: t('settings'), to: 'settings' },
  ]
  return (
    <Screen title={t('more')} subtitle={`${user?.name} · ASHA worker`} noBack>
      <div className="space-y-2">
        {items.map((i) => (
          <Card key={i.to} onClick={() => push(i.to)} className="flex items-center gap-3 !p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-leaf-soft text-leaf">{i.icon}</span>
            <span className="flex-1 font-semibold text-ink">{i.label}</span>
            <ChevronRight className="size-4 text-ink/35" />
          </Card>
        ))}
      </div>
    </Screen>
  )
}

export type { Beneficiary }
