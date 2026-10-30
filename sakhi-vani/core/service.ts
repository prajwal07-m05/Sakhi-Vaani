import type {
  AppNotification, AssistanceRequest, Beneficiary, CallSession, ConsentType, Database, DiaryEntry, DocumentItem,
  DocumentStatus, EligibilityAssessment, ExtractedField, FieldValue, HealthRecord, Lang, Provenance, RecordType,
  RequestStatus, Session, SttMode, User, Visit, VisitDisplayStatus, Answers, Scheme,
} from '../shared-types'
import { RECORD_SCHEMAS, fieldsFor, recordTypesFor, type FieldNature } from '../database/schemas/recordSchemas'
import { SCHEMES } from '../database/demo-data/schemes'
import { HBNC_VISIT_DAYS } from '../database/demo-data/knowledge'
import { assessAll, nextQuestion, parseNumber } from '../ai-services/eligibility/engine'
import { extractVisitDetails } from '../ai-services/agents/documentationAgent'
import { classifyIntent, routeAssistantMessage } from '../ai-services/orchestrator/orchestrator'
import { callTurn as engineTurn, createCallSession, endCall as engineEnd } from '../calling-services/simulator/callEngine'
import { addDays, daysBetween, formatDate, isoDate, newId, nextDayOfMonth } from './util'
import { forbidden, invalid, notFound, unauthorised } from './errors'

export interface ServiceOptions {
  now?: () => Date
  hashPassword: (pw: string) => string
  verifyPassword: (pw: string, hash: string) => boolean
  /** Optional AI extraction enhancer (e.g. Gemini on the backend). Output is validated before use. */
  enhanceExtraction?: undefined
}

export type PublicUser = Omit<User, 'passwordHash'>
const publicUser = (u: User): PublicUser => {
  const { passwordHash: _omit, ...rest } = u
  return rest
}

const NATURE_SOURCE: Record<FieldNature, Provenance> = {
  admin: 'asha_recorded',
  reported: 'beneficiary_reported',
  measurement: 'measured',
  verified: 'professionally_verified',
  observation: 'asha_recorded',
}

const REQUEST_STATUS_TEXT: Record<RequestStatus, string> = {
  NEW: 'New', ASSIGNED: 'Assigned', IN_PROGRESS: 'In progress', FOLLOW_UP_SCHEDULED: 'Follow-up scheduled', COMPLETED: 'Completed', REFERRED: 'Referred',
}

export function createService(db: Database, opts: ServiceOptions) {
  const now = () => (opts.now ? opts.now() : new Date())
  const today = () => isoDate(now())
  const nowIso = () => now().toISOString()

  // ---------- helpers ----------
  const audit = (actorUserId: string, action: string, entity: string, entityId: string, detail?: string) =>
    db.audit.push({ id: newId('AUD'), at: nowIso(), actorUserId, action, entity, entityId, detail })

  const userById = (id?: string) => db.users.find((u) => u.id === id)
  const requireSession = (s: Session | null): Session => {
    if (!s || !userById(s.userId)) throw unauthorised()
    return s
  }
  const requireRole = (s: Session | null, role: 'asha' | 'citizen'): Session => {
    const ss = requireSession(s)
    if (ss.role !== role) throw forbidden(role === 'asha' ? 'This page is only for ASHA workers.' : 'This page is only for citizens.')
    return ss
  }
  const ashaProfile = (uid: string) => db.ashaProfiles.find((p) => p.userId === uid)
  const citizenProfile = (uid: string) => db.citizenProfiles.find((p) => p.userId === uid)
  const ashaAreas = (uid: string) => ashaProfile(uid)?.assignedAreaIds ?? []
  const ashaBeneficiaries = (uid: string) => db.beneficiaries.filter((b) => ashaAreas(uid).includes(b.areaId))
  const citizenBeneficiary = (uid: string) => db.beneficiaries.find((b) => b.linkedUserId === uid)

  const canAccess = (s: Session, b: Beneficiary) =>
    s.role === 'asha' ? ashaAreas(s.userId).includes(b.areaId) : b.linkedUserId === s.userId

  const getBen = (s: Session, id: string): Beneficiary => {
    const b = db.beneficiaries.find((x) => x.id === id)
    if (!b) throw notFound('Beneficiary not found.')
    if (!canAccess(s, b)) {
      audit(s.userId, 'ACCESS_DENIED', 'Beneficiary', id)
      throw forbidden('This beneficiary is not in your authorised area.')
    }
    return b
  }

  const consent = (userId: string | undefined, type: ConsentType) =>
    !!userId && !!db.consents.find((c) => c.userId === userId && c.type === type)?.granted

  const getRecord = (bid: string, type: RecordType) => db.records.find((r) => r.beneficiaryId === bid && r.type === type)
  const ensureRecord = (bid: string, type: Exclude<RecordType, 'ASHA_DIARY'>): HealthRecord => {
    let r = getRecord(bid, type)
    if (!r) {
      r = { id: `REC-${bid}-${type}`, beneficiaryId: bid, type, fields: {}, updatedAt: nowIso() }
      db.records.push(r)
    }
    return r
  }
  const recordValues = (bid: string) => {
    const out: Partial<Record<RecordType, Record<string, string>>> = {}
    for (const r of db.records.filter((x) => x.beneficiaryId === bid)) {
      out[r.type] = Object.fromEntries(Object.entries(r.fields).map(([k, v]) => [k, v.value]))
    }
    return out
  }

  const displayStatus = (v: Visit): VisitDisplayStatus => (v.status === 'scheduled' && v.scheduledDate < today() ? 'overdue' : v.status)
  const benName = (id: string) => db.beneficiaries.find((b) => b.id === id)?.name ?? id

  const notify = (userId: string | undefined, n: Omit<AppNotification, 'id' | 'userId' | 'createdAt' | 'read'>) => {
    if (!userId) return
    if (db.notifications.some((x) => x.userId === userId && x.key === n.key)) return
    db.notifications.push({ ...n, id: newId('NTF'), userId, createdAt: nowIso(), read: false })
  }
  const notifyCitizenOf = (b: Beneficiary, n: Omit<AppNotification, 'id' | 'userId' | 'createdAt' | 'read'>) => {
    if (b.linkedUserId && consent(b.linkedUserId, 'notifications')) notify(b.linkedUserId, n)
  }

  const clearVisitAlerts = (visitId: string) =>
    db.notifications.filter((n) => n.key.startsWith(`visit-due-${visitId}-`) || n.key.startsWith(`visit-overdue-${visitId}-`)).forEach((n) => (n.read = true))

  const missingRequired = (b: Beneficiary, type: RecordType) => {
    if (type === 'ASHA_DIARY') return []
    const rec = getRecord(b.id, type)
    return fieldsFor(type, b.category).filter((f) => f.required && !rec?.fields[f.key]?.value)
  }

  const scheduleVisit = (b: Beneficiary, ashaUserId: string, date: string, purpose: string): Visit => {
    const existing = db.visits.find((v) => v.beneficiaryId === b.id && v.scheduledDate === date && v.status === 'scheduled')
    if (existing) return existing
    const v: Visit = { id: newId('VIS'), beneficiaryId: b.id, ashaUserId, scheduledDate: date, purpose, status: 'scheduled', createdAt: nowIso() }
    db.visits.push(v)
    notifyCitizenOf(b, { key: `cit-visit-${v.id}`, title: 'A home visit has been scheduled', body: `Your ASHA worker scheduled a visit on ${formatDate(date)}. Open the app for details.`, priority: 'reminder', link: { screen: 'appointments' }, sensitive: true })
    return v
  }

  // ---------- notification rules (deterministic) ----------
  const refreshNotifications = (userId: string) => {
    const u = userById(userId)
    if (!u) return
    const td = today()
    if (u.role === 'asha') {
      const bens = ashaBeneficiaries(userId)
      const ids = new Set(bens.map((b) => b.id))
      for (const v of db.visits.filter((x) => ids.has(x.beneficiaryId) && x.status === 'scheduled')) {
        const b = bens.find((x) => x.id === v.beneficiaryId)!
        const ds = displayStatus(v)
        if (ds === 'overdue') {
          notify(userId, { key: `visit-overdue-${v.id}-${v.scheduledDate}`, title: `Follow-up overdue: ${b.name} (${b.id})`, body: `Visit scheduled for ${formatDate(v.scheduledDate)} was missed. Please review the pending visit.`, priority: 'attention', link: { screen: 'beneficiary', id: b.id }, relatedBeneficiaryId: b.id, sensitive: true })
        } else if (daysBetween(td, v.scheduledDate) <= 2) {
          const label = /HBNC/i.test(v.purpose) ? 'HBNC visit due' : /postnatal/i.test(v.purpose) ? 'Postnatal home visit due' : /immunis/i.test(v.purpose) ? 'Immunisation follow-up due' : 'Visit due'
          notify(userId, { key: `visit-due-${v.id}-${v.scheduledDate}`, title: `${label}: ${b.name} (${b.id})`, body: `${v.purpose} — ${v.scheduledDate === td ? 'today' : formatDate(v.scheduledDate)}.`, priority: 'reminder', link: { screen: 'beneficiary', id: b.id }, relatedBeneficiaryId: b.id, sensitive: true })
        }
      }
      for (const b of bens.filter((x) => x.category !== 'general')) {
        for (const type of recordTypesFor(b.category)) {
          const miss = missingRequired(b, type)
          if (miss.length) {
            const what = miss.map((f) => f.label.replace(/\s*\(.*\)/, '')).join(', ')
            notify(userId, { key: `rec-${b.id}-${type}-${miss.map((f) => f.key).join('.')}`, title: `Record update required: ${RECORD_SCHEMAS[type].title}`, body: `${b.name} (${b.id}) — ${what} needs confirmation.`, priority: 'attention', link: { screen: 'records', id: b.id }, relatedBeneficiaryId: b.id, sensitive: true })
          }
        }
        const lastDiary = db.diary.filter((d) => d.beneficiaryId === b.id).sort((a, c) => c.createdAt.localeCompare(a.createdAt))[0]
        if (!lastDiary || daysBetween(lastDiary.createdAt.slice(0, 10), td) > 30) {
          notify(userId, { key: `diary-missing-${b.id}-${td.slice(0, 7)}`, title: `ASHA Diary entry missing: ${b.name}`, body: `No diary entry in the last 30 days for ${b.id}.`, priority: 'reminder', link: { screen: 'beneficiary', id: b.id }, relatedBeneficiaryId: b.id, sensitive: false })
        }
        const missingDocs = db.documents.filter((d) => d.beneficiaryId === b.id && d.status === 'missing')
        if (missingDocs.length) {
          notify(userId, { key: `docs-${b.id}-${missingDocs.map((d) => d.id).join('.')}`, title: `Missing documents: ${b.name}`, body: `${missingDocs.map((d) => d.name).join(', ')}.`, priority: 'reminder', link: { screen: 'documents', id: b.id }, relatedBeneficiaryId: b.id, sensitive: false })
        }
        // HBNC / postnatal schedule from date of birth / delivery.
        const dob = b.category === 'newborn' ? getRecord(b.id, 'HBNC')?.fields.dob?.value : b.category === 'postnatal' ? getRecord(b.id, 'POSTNATAL')?.fields.deliveryDate?.value : undefined
        if (dob) {
          const day = daysBetween(dob, td)
          const nextDay = HBNC_VISIT_DAYS.find((d) => d >= day)
          if (nextDay !== undefined && nextDay - day <= 2) {
            const due = addDays(dob, nextDay)
            notify(userId, { key: `hbnc-${b.id}-${nextDay}`, title: `${b.category === 'newborn' ? 'HBNC home visit' : 'Postnatal home visit'} due: ${b.name}`, body: `Day-${nextDay} visit due on ${formatDate(due)} (HBNC schedule: days ${HBNC_VISIT_DAYS.join(', ')}).`, priority: 'reminder', link: { screen: 'beneficiary', id: b.id }, relatedBeneficiaryId: b.id, sensitive: false })
          }
        }
      }
      for (const d of db.drafts.filter((x) => x.ashaUserId === userId && x.status === 'pending_review')) {
        notify(userId, { key: `draft-${d.id}`, title: `Record awaiting your approval: ${benName(d.beneficiaryId)}`, body: 'A voice-documented visit is waiting for review. Nothing is saved until you approve it.', priority: 'attention', link: { screen: 'beneficiary', id: d.beneficiaryId }, relatedBeneficiaryId: d.beneficiaryId, sensitive: false })
      }
    } else {
      if (!consent(userId, 'notifications')) return
      const b = citizenBeneficiary(userId)
      if (b) {
        for (const v of db.visits.filter((x) => x.beneficiaryId === b.id && x.status === 'scheduled')) {
          const ds = displayStatus(v)
          if (ds === 'overdue') notify(userId, { key: `cit-missed-${v.id}-${v.scheduledDate}`, title: 'An appointment may have been missed', body: 'A scheduled visit has passed. Your ASHA worker will follow up, or you can request assistance.', priority: 'attention', link: { screen: 'appointments' }, sensitive: true })
          else if (daysBetween(today(), v.scheduledDate) <= 3) notify(userId, { key: `cit-upcoming-${v.id}-${v.scheduledDate}`, title: 'Your upcoming follow-up is scheduled', body: 'Open the application to view details.', priority: 'reminder', link: { screen: 'appointments' }, sensitive: true })
        }
        const appt = getRecord(b.id, 'MATERNAL')?.fields.nextAppointment?.value
        if (appt && appt >= today() && daysBetween(today(), appt) <= 7) notify(userId, { key: `cit-appt-${appt}`, title: 'Antenatal check-up coming up', body: `Your next recorded appointment is on ${formatDate(appt)}. Carry your MCP card.`, priority: 'reminder', link: { screen: 'appointments' }, sensitive: true })
        if (b.category === 'pregnant') {
          const pmsma = nextDayOfMonth(today(), 9)
          if (daysBetween(today(), pmsma) <= 5) notify(userId, { key: `cit-pmsma-${pmsma}`, title: 'Maternal health reminder', body: `PMSMA free antenatal check-up day is on ${formatDate(pmsma)} at designated government facilities.`, priority: 'reminder', link: { screen: 'maternal' }, sensitive: false })
        }
        const missingDocs = db.documents.filter((d) => d.beneficiaryId === b.id && d.status === 'missing')
        if (missingDocs.length) notify(userId, { key: `cit-docs-${missingDocs.map((d) => d.id).join('.')}`, title: 'Some scheme documents are missing', body: `${missingDocs.map((d) => d.name).join(', ')}. Your ASHA worker can help.`, priority: 'reminder', link: { screen: 'profile' }, sensitive: false })
      }
      if (relevantSchemes(userId).length) notify(userId, { key: 'cit-schemes-intro', title: 'A government health scheme may be relevant to your profile', body: 'Check the eligibility details.', priority: 'info', link: { screen: 'schemes' }, sensitive: false })
      notify(userId, { key: 'cit-info-anc', title: 'New health information available', body: 'Read: Preparing for your antenatal check-up.', priority: 'info', link: { screen: 'maternal' }, sensitive: false })
      const lastAssessment = db.assessments.filter((a) => a.userId === userId).sort((a, c) => c.createdAt.localeCompare(a.createdAt))[0]
      if (lastAssessment?.results.some((r) => r.status === 'more_info_required')) notify(userId, { key: `cit-elig-${lastAssessment.id}`, title: 'Eligibility information needs updating', body: 'Some details are still unknown for schemes that may apply to you.', priority: 'reminder', link: { screen: 'schemes' }, sensitive: false })
    }
  }

  // ---------- schemes ----------
  const eligibilityPrefill = (userId: string): Answers => {
    const p = citizenProfile(userId)
    const b = citizenBeneficiary(userId)
    const a: Answers = {}
    if (p?.state) a.state = p.state.toLowerCase()
    if (p?.age) a.age = p.age
    if (b) {
      if (b.category === 'pregnant') a.pregnant = 'yes'
      const month = getRecord(b.id, 'VHR')?.fields.pregnancyMonth?.value
      const n = month ? parseNumber(month) : undefined
      if (n) a.pregnancyMonths = n
    }
    return a
  }
  const relevantSchemes = (userId: string): Array<Scheme & { reasons: string[] }> => {
    const p = citizenProfile(userId)
    const b = citizenBeneficiary(userId)
    const cat = b?.category ?? 'general'
    return SCHEMES.map((s) => {
      const reasons: string[] = []
      if (cat === 'pregnant' && s.audience.includes('pregnant')) reasons.push('Your profile shows you are pregnant')
      if (cat === 'postnatal' && s.audience.includes('postnatal')) reasons.push('Your profile shows a recent delivery')
      if ((p?.age ?? 0) >= 60 && s.audience.includes('elderly')) reasons.push('Relevant for older adults')
      if (s.level === 'karnataka' && p?.state?.toLowerCase() === 'karnataka') reasons.push('You live in Karnataka')
      if (s.audience.includes('general') && reasons.length === 0) reasons.push('Open to families who meet the criteria')
      return { ...s, reasons }
    }).filter((s) => s.reasons.length)
  }

  const runAssessment = (userId: string, answers: Answers, schemeIds: string[] | undefined, channel: EligibilityAssessment['channel']) => {
    const a: EligibilityAssessment = { id: newId('ELG'), userId, answers, results: assessAll(answers, schemeIds), channel, createdAt: nowIso() }
    db.assessments.push(a)
    audit(userId, 'ELIGIBILITY_ASSESSED', 'EligibilityAssessment', a.id, `${channel}; ${a.results.map((r) => `${r.schemeId}:${r.status}`).join(', ')}`)
    return a
  }

  const createRequestInternal = (userId: string, input: { category: string; description: string; contactMethod: AssistanceRequest['contactMethod']; createdVia: AssistanceRequest['createdVia']; relatedSchemeId?: string }) => {
    const b = citizenBeneficiary(userId)
    const asha = b?.assignedAshaUserId
    const r: AssistanceRequest = {
      id: newId('REQ'), citizenUserId: userId, beneficiaryId: b?.id, ashaUserId: asha, category: input.category, description: input.description.slice(0, 500),
      contactMethod: input.contactMethod, consentToShare: true, status: 'NEW', createdVia: input.createdVia, relatedSchemeId: input.relatedSchemeId,
      history: [{ status: 'NEW', at: nowIso(), by: userId }], createdAt: nowIso(),
    }
    db.requests.push(r)
    audit(userId, 'ASSISTANCE_REQUEST_CREATED', 'AssistanceRequest', r.id, input.createdVia)
    notify(asha, { key: `req-new-${r.id}`, title: 'New assistance request', body: `A citizen from your assigned area needs support (${input.category}).`, priority: 'attention', link: { screen: 'requests', id: r.id }, relatedBeneficiaryId: b?.id, sensitive: false })
    notify(userId, { key: `req-sent-${r.id}`, title: 'Your ASHA assistance request was sent', body: asha ? 'Your assigned ASHA worker has been notified.' : 'No ASHA worker is assigned to your area yet; the request is waiting.', priority: 'info', link: { screen: 'requests' }, sensitive: false })
    return r
  }

  const nextAppointmentFor = (userId: string) => {
    const b = citizenBeneficiary(userId)
    if (!b) return undefined
    const dates = db.visits.filter((v) => v.beneficiaryId === b.id && v.status === 'scheduled' && v.scheduledDate >= today()).map((v) => v.scheduledDate)
    const appt = getRecord(b.id, 'MATERNAL')?.fields.nextAppointment?.value
    if (appt && appt >= today()) dates.push(appt)
    return dates.sort()[0]
  }

  // ---------- public API ----------
  return {
    // ===== Auth =====
    login(_s: Session | null, input: { email: string; password: string; role: 'asha' | 'citizen' }) {
      const u = db.users.find((x) => x.email.toLowerCase() === String(input.email ?? '').trim().toLowerCase())
      if (!u || !opts.verifyPassword(String(input.password ?? ''), u.passwordHash)) throw unauthorised('Incorrect email or password.')
      if (input.role && u.role !== input.role) throw forbidden(`This account is registered as ${u.role === 'asha' ? 'an ASHA worker' : 'a citizen'}. Please use the ${u.role === 'asha' ? 'ASHA Worker' : 'Citizen'} entry.`)
      audit(u.id, 'LOGIN', 'User', u.id)
      return { user: publicUser(u) }
    },

    registerAsha(_s: Session | null, input: { name: string; workerId: string; village: string; phone: string; email: string; password: string }) {
      const { name, workerId, village, phone, email, password } = input
      if (!name || !workerId || !village || !email || !password) throw invalid('Please fill in all required fields.')
      if (password.length < 8) throw invalid('Password must be at least 8 characters.')
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw invalid('An account with this email already exists.')
      if (db.ashaProfiles.some((p) => p.workerId === workerId)) throw invalid('This Worker ID is already registered.')
      let area = db.areas.find((a) => a.village.toLowerCase() === village.trim().toLowerCase())
      if (!area) { area = { id: newId('AREA'), village: village.trim(), district: 'Not specified', state: 'Karnataka' }; db.areas.push(area) }
      const u: User = { id: newId('USR'), role: 'asha', email: email.trim(), passwordHash: opts.hashPassword(password), name: name.trim(), phone, language: 'en', createdAt: nowIso(), synthetic: false }
      db.users.push(u)
      db.ashaProfiles.push({ userId: u.id, workerId, village: area.village, state: area.state, assignedAreaIds: [area.id] })
      audit(u.id, 'REGISTER', 'User', u.id, 'asha')
      return { user: publicUser(u) }
    },

    registerCitizen(_s: Session | null, input: { name: string; age: number; gender?: 'female' | 'male' | 'other' | 'undisclosed'; village: string; phone?: string; email: string; password: string; pregnant?: boolean; consentAccepted: boolean; shareWithAsha: boolean; notifications: boolean }) {
      const { name, age, village, email, password } = input
      if (!input.consentAccepted) throw invalid('Please read and accept the privacy information to continue.')
      if (!name || !age || !village || !email || !password) throw invalid('Please fill in all required fields.')
      if (password.length < 8) throw invalid('Password must be at least 8 characters.')
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw invalid('An account with this email already exists.')
      const u: User = { id: newId('USR'), role: 'citizen', email: email.trim(), passwordHash: opts.hashPassword(password), name: name.trim(), phone: input.phone, language: 'en', createdAt: nowIso(), synthetic: false }
      db.users.push(u)
      const area = db.areas.find((a) => a.village.toLowerCase() === village.trim().toLowerCase())
      let beneficiaryId: string | undefined
      if (area) {
        const hh = { id: newId('H'), areaId: area.id, address: `${village.trim()} (self-registered)`, headName: name.trim(), synthetic: false }
        db.households.push(hh)
        const asha = db.ashaProfiles.find((p) => p.assignedAreaIds.includes(area.id))
        const b: Beneficiary = { id: newId('BEN'), householdId: hh.id, areaId: area.id, name: name.trim(), age: Number(age), gender: input.gender, category: input.pregnant ? 'pregnant' : Number(age) >= 60 ? 'elderly' : 'general', assignedAshaUserId: asha?.userId, linkedUserId: u.id, phone: input.phone, synthetic: false, createdAt: nowIso() }
        db.beneficiaries.push(b)
        beneficiaryId = b.id
      }
      db.citizenProfiles.push({ userId: u.id, beneficiaryId, age: Number(age), gender: input.gender, village: village.trim(), state: 'Karnataka' })
      const c = (type: ConsentType, granted: boolean) => db.consents.push({ id: newId('CON'), userId: u.id, type, granted, updatedAt: nowIso() })
      c('share_records_with_asha', !!input.shareWithAsha)
      c('share_self_reports_with_asha', false)
      c('notifications', !!input.notifications)
      c('call_transcript_retention', false)
      audit(u.id, 'REGISTER', 'User', u.id, 'citizen')
      return { user: publicUser(u) }
    },

    me(s: Session | null) {
      const ss = requireSession(s)
      const u = userById(ss.userId)!
      const ap = ashaProfile(u.id)
      const cp = citizenProfile(u.id)
      return { user: publicUser(u), ashaProfile: ap, citizenProfile: cp, areas: db.areas.filter((a) => ap?.assignedAreaIds.includes(a.id)) }
    },

    setLanguage(s: Session | null, input: { language: Lang }) {
      const u = userById(requireSession(s).userId)!
      u.language = input.language
      return { ok: true }
    },

    // ===== ASHA =====
    ashaDashboard(s: Session | null) {
      const ss = requireRole(s, 'asha')
      refreshNotifications(ss.userId)
      const bens = ashaBeneficiaries(ss.userId)
      const ids = new Set(bens.map((b) => b.id))
      const areaIds = ashaAreas(ss.userId)
      const visits = db.visits.filter((v) => ids.has(v.beneficiaryId))
      const td = today()
      const todays = visits.filter((v) => v.scheduledDate === td && v.status !== 'cancelled')
      const overdue = visits.filter((v) => displayStatus(v) === 'overdue')
      let recordsNeedingUpdates = 0
      for (const b of bens.filter((x) => x.category !== 'general')) for (const t of recordTypesFor(b.category)) if (missingRequired(b, t).length) recordsNeedingUpdates++
      const missingDocuments = db.documents.filter((d) => ids.has(d.beneficiaryId) && d.status === 'missing').length
      const highPriority = db.tasks.filter((t) => ids.has(t.beneficiaryId) && t.status === 'open' && t.priority === 'high')
      const requests = db.requests.filter((r) => r.ashaUserId === ss.userId)
      const withName = <T extends { beneficiaryId: string }>(x: T) => ({ ...x, beneficiaryName: benName(x.beneficiaryId) })
      return {
        worker: { name: userById(ss.userId)!.name, workerId: ashaProfile(ss.userId)?.workerId, village: ashaProfile(ss.userId)?.village, state: ashaProfile(ss.userId)?.state },
        stats: {
          households: db.households.filter((h) => areaIds.includes(h.areaId)).length,
          beneficiaries: bens.length,
          todaysVisits: todays.length,
          completed: todays.filter((v) => v.status === 'completed').length,
          pending: todays.filter((v) => v.status === 'scheduled').length,
          overdue: overdue.length,
          recordsNeedingUpdates,
          missingDocuments,
          highPriority: highPriority.length,
          newRequests: requests.filter((r) => r.status === 'NEW').length,
          pendingDrafts: db.drafts.filter((d) => d.ashaUserId === ss.userId && d.status === 'pending_review').length,
        },
        todaysVisits: todays.map((v) => ({ ...withName(v), displayStatus: displayStatus(v) })),
        overdueVisits: overdue.map((v) => ({ ...withName(v), displayStatus: 'overdue' as const })),
        highPriorityTasks: highPriority.map(withName),
        newRequests: requests.filter((r) => r.status === 'NEW').map((r) => ({ ...r, beneficiaryName: r.beneficiaryId ? benName(r.beneficiaryId) : 'Unlinked citizen' })),
        unread: db.notifications.filter((n) => n.userId === ss.userId && !n.read).length,
      }
    },

    searchBeneficiaries(s: Session | null, input: { q?: string }) {
      const ss = requireRole(s, 'asha')
      const q = String(input.q ?? '').trim().toLowerCase()
      const list = ashaBeneficiaries(ss.userId).filter((b) => !q || b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.householdId.toLowerCase().includes(q) || (b.phone ?? '').includes(q))
      return list.slice(0, 60).map((b) => ({ id: b.id, name: b.name, age: b.age, ageLabel: b.ageLabel, category: b.category, householdId: b.householdId, synthetic: b.synthetic, linked: !!b.linkedUserId }))
    },

    listHouseholds(s: Session | null) {
      const ss = requireRole(s, 'asha')
      const areas = ashaAreas(ss.userId)
      return db.households.filter((h) => areas.includes(h.areaId)).map((h) => ({ ...h, members: db.beneficiaries.filter((b) => b.householdId === h.id).map((b) => ({ id: b.id, name: b.name, category: b.category })) }))
    },

    getBeneficiaryProfile(s: Session | null, input: { id: string }) {
      const ss = requireRole(s, 'asha')
      const b = getBen(ss, input.id)
      refreshNotifications(ss.userId)
      audit(ss.userId, 'VIEW', 'Beneficiary', b.id)
      const types = recordTypesFor(b.category)
      const shareSelf = consent(b.linkedUserId, 'share_self_reports_with_asha')
      return {
        beneficiary: b,
        household: db.households.find((h) => h.id === b.householdId),
        householdMembers: db.beneficiaries.filter((x) => x.householdId === b.householdId && x.id !== b.id).map((x) => ({ id: x.id, name: x.name, category: x.category })),
        recordTypes: types,
        records: db.records.filter((r) => r.beneficiaryId === b.id),
        diary: db.diary.filter((d) => d.beneficiaryId === b.id).sort((a, c) => c.createdAt.localeCompare(a.createdAt)),
        visits: db.visits.filter((v) => v.beneficiaryId === b.id).map((v) => ({ ...v, displayStatus: displayStatus(v) })).sort((a, c) => c.scheduledDate.localeCompare(a.scheduledDate)),
        tasks: db.tasks.filter((t) => t.beneficiaryId === b.id),
        documents: db.documents.filter((d) => d.beneficiaryId === b.id),
        missingInfo: types.flatMap((t) => missingRequired(b, t).map((f) => ({ recordType: t, key: f.key, label: f.label }))),
        consent: { linkedAccount: !!b.linkedUserId, shareRecords: b.linkedUserId ? consent(b.linkedUserId, 'share_records_with_asha') : null, shareSelfReports: b.linkedUserId ? shareSelf : null },
        selfReports: shareSelf ? db.selfReports.filter((r) => r.beneficiaryId === b.id && r.shared) : [],
        pendingDrafts: db.drafts.filter((d) => d.beneficiaryId === b.id && d.status === 'pending_review'),
        requests: db.requests.filter((r) => r.beneficiaryId === b.id && r.ashaUserId === ss.userId),
      }
    },

    updateRecord(s: Session | null, input: { beneficiaryId: string; type: RecordType; values: Record<string, string> }) {
      const ss = requireRole(s, 'asha')
      const b = getBen(ss, input.beneficiaryId)
      if (!recordTypesFor(b.category).includes(input.type)) throw invalid('This record type does not apply to this beneficiary.')
      if (input.type === 'ASHA_DIARY') throw invalid('Use addDiaryEntry for diary entries.')
      const rec = ensureRecord(b.id, input.type)
      const defs = fieldsFor(input.type, b.category)
      const changed: string[] = []
      for (const def of defs) {
        if (!(def.key in input.values)) continue
        const v = String(input.values[def.key] ?? '').trim()
        if ((rec.fields[def.key]?.value ?? '') === v) continue
        if (!v) delete rec.fields[def.key]
        else rec.fields[def.key] = { value: v, source: NATURE_SOURCE[def.nature], updatedAt: nowIso(), updatedBy: ss.userId }
        changed.push(def.key)
      }
      rec.updatedAt = nowIso()
      const nv = input.values.nextVisitDate || input.values.nextVisit
      if (nv && changed.some((k) => k === 'nextVisitDate' || k === 'nextVisit')) scheduleVisit(b, ss.userId, nv, `${RECORD_SCHEMAS[input.type].title} follow-up`)
      audit(ss.userId, 'RECORD_UPDATED', input.type, rec.id, changed.join(','))
      return { record: rec, changed }
    },

    addDiaryEntry(s: Session | null, input: { beneficiaryId: string; fields: Record<string, string> }) {
      const ss = requireRole(s, 'asha')
      const b = getBen(ss, input.beneficiaryId)
      const allowed = new Set(RECORD_SCHEMAS.ASHA_DIARY.fields.map((f) => f.key))
      const fields = Object.fromEntries(Object.entries(input.fields).filter(([k, v]) => allowed.has(k) && String(v).trim()))
      if (!fields.visitDateTime) fields.visitDateTime = today()
      if (!fields.purpose) throw invalid('Purpose of visit is required.')
      const e: DiaryEntry = { id: newId('DIA'), beneficiaryId: b.id, ashaUserId: ss.userId, createdAt: nowIso(), fields, source: 'manual' }
      db.diary.push(e)
      if (fields.nextVisitDate) scheduleVisit(b, ss.userId, fields.nextVisitDate, 'Follow-up visit')
      audit(ss.userId, 'DIARY_ADDED', 'AshaDiary', e.id)
      return e
    },

    processTranscript(s: Session | null, input: { beneficiaryId: string; transcript: string; language: Lang; sttMode: SttMode }) {
      const ss = requireRole(s, 'asha')
      const b = getBen(ss, input.beneficiaryId)
      const transcript = String(input.transcript ?? '').slice(0, 4000)
      if (!transcript.trim()) throw invalid('The transcript is empty. Please speak again or type the visit details.')
      const extraction = extractVisitDetails(transcript, { beneficiaryName: b.name, category: b.category, today: today(), existing: recordValues(b.id) })
      const draft = { id: newId('DRF'), beneficiaryId: b.id, ashaUserId: ss.userId, transcript, language: input.language, sttMode: input.sttMode, extraction, status: 'pending_review' as const, createdAt: nowIso() }
      db.drafts.push(draft)
      audit(ss.userId, 'VOICE_DRAFT_CREATED', 'DocumentationDraft', draft.id, `stt=${input.sttMode}; NOT SAVED to records until approved`)
      return { draft, agentsInvoked: ['Voice Processing Agent (' + input.sttMode + ')', 'Orchestrator', 'ASHA Documentation Agent (rule-based extraction)'] }
    },

    approveDraft(s: Session | null, input: { draftId: string; confirmed: boolean; fields: Array<{ recordType: RecordType; key: string; value: string }> }) {
      const ss = requireRole(s, 'asha')
      const draft = db.drafts.find((d) => d.id === input.draftId)
      if (!draft) throw notFound('Draft not found.')
      if (draft.ashaUserId !== ss.userId) throw forbidden()
      if (draft.status !== 'pending_review') throw invalid('This draft has already been decided.')
      if (input.confirmed !== true) throw invalid('Human approval is required before saving.')
      const b = getBen(ss, draft.beneficiaryId)
      const allowedTypes = new Set(recordTypesFor(b.category))
      const byType = new Map<RecordType, Record<string, string>>()
      for (const f of input.fields ?? []) {
        const v = String(f.value ?? '').trim()
        if (!v || !allowedTypes.has(f.recordType)) continue
        if (!RECORD_SCHEMAS[f.recordType].fields.some((d) => d.key === f.key)) continue
        if (!byType.has(f.recordType)) byType.set(f.recordType, {})
        byType.get(f.recordType)![f.key] = v
      }
      const sourceFor = (type: RecordType, key: string): Provenance => {
        const ex = draft.extraction.fields.find((x: ExtractedField) => x.recordType === type && x.key === key)
        if (ex) return ex.source
        const def = RECORD_SCHEMAS[type].fields.find((d) => d.key === key)!
        return NATURE_SOURCE[def.nature]
      }
      let saved = 0
      let diaryEntryId: string | undefined
      for (const [type, values] of byType) {
        if (type === 'ASHA_DIARY') {
          const e: DiaryEntry = { id: newId('DIA'), beneficiaryId: b.id, ashaUserId: ss.userId, createdAt: nowIso(), fields: { visitDateTime: today(), purpose: 'Home visit', ...values }, source: 'voice_reviewed', draftId: draft.id }
          db.diary.push(e)
          diaryEntryId = e.id
          saved += Object.keys(values).length
        } else {
          const rec = ensureRecord(b.id, type)
          for (const [k, v] of Object.entries(values)) {
            const fv: FieldValue = { value: v, source: sourceFor(type, k), updatedAt: nowIso(), updatedBy: ss.userId, viaVoiceReview: true }
            rec.fields[k] = fv
            saved++
          }
          rec.updatedAt = nowIso()
        }
      }
      draft.status = 'approved'
      draft.decidedAt = nowIso()
      db.notifications.filter((n) => n.key === `draft-${draft.id}`).forEach((n) => (n.read = true))

      // Today's scheduled visit for this beneficiary is now documented → mark completed.
      const todays = db.visits.find((v) => v.beneficiaryId === b.id && v.status === 'scheduled' && v.scheduledDate <= today())
      if (todays) { todays.status = 'completed'; todays.completedAt = nowIso(); todays.notes = 'Documented via reviewed voice note'; clearVisitAlerts(todays.id) }

      const nextDate = byType.get('ASHA_DIARY')?.nextVisitDate ?? byType.get('VHR')?.nextVisitDate
      let visit: Visit | undefined
      let task = undefined as undefined | (typeof db.tasks)[number]
      if (nextDate) {
        visit = scheduleVisit(b, ss.userId, nextDate, `Follow-up visit (${draft.extraction.fields.find((f) => f.key === 'purpose')?.value ?? 'home visit'})`)
        const vhr = allowedTypes.has('VHR') ? ensureRecord(b.id, 'VHR') : undefined
        if (vhr) { vhr.fields.nextVisitDate = { value: nextDate, source: 'asha_recorded', updatedAt: nowIso(), updatedBy: ss.userId, viaVoiceReview: true }; vhr.fields.followUpStatus = { value: 'Follow-up scheduled', source: 'asha_recorded', updatedAt: nowIso(), updatedBy: ss.userId } }
        task = { id: newId('TSK'), beneficiaryId: b.id, ashaUserId: ss.userId, title: `Follow-up visit for ${b.name} on ${formatDate(nextDate)}`, dueDate: nextDate, priority: draft.extraction.urgentFlags.length ? 'high' : 'normal', status: 'open', origin: 'voice_documentation', createdAt: nowIso() }
        db.tasks.push(task)
        notify(ss.userId, { key: `fu-${task.id}`, title: `Follow-up scheduled: ${b.name} (${b.id})`, body: `Next visit on ${formatDate(nextDate)}. Created from your approved visit note.`, priority: 'reminder', link: { screen: 'beneficiary', id: b.id }, relatedBeneficiaryId: b.id, sensitive: true })
      }
      if (draft.extraction.urgentFlags.length) {
        db.tasks.push({ id: newId('TSK'), beneficiaryId: b.id, ashaUserId: ss.userId, title: `Urgent: ensure prompt professional assessment for ${b.name} (${draft.extraction.urgentFlags.join('; ')})`, priority: 'high', status: 'open', origin: 'urgent_flag', dueDate: today(), createdAt: nowIso() })
        notify(ss.userId, { key: `urgent-${draft.id}`, title: `High-priority concern reported: ${b.name}`, body: 'Danger signs were mentioned. Advise prompt professional assessment / 108. Not a diagnosis.', priority: 'urgent', link: { screen: 'beneficiary', id: b.id }, relatedBeneficiaryId: b.id, sensitive: true })
      }
      audit(ss.userId, 'VOICE_DRAFT_APPROVED', 'DocumentationDraft', draft.id, `${saved} fields saved after human review`)
      return { saved, diaryEntryId, visit, task }
    },

    discardDraft(s: Session | null, input: { draftId: string }) {
      const ss = requireRole(s, 'asha')
      const d = db.drafts.find((x) => x.id === input.draftId && x.ashaUserId === ss.userId)
      if (!d) throw notFound('Draft not found.')
      d.status = 'discarded'
      d.decidedAt = nowIso()
      db.notifications.filter((n) => n.key === `draft-${d.id}`).forEach((n) => (n.read = true))
      audit(ss.userId, 'VOICE_DRAFT_DISCARDED', 'DocumentationDraft', d.id)
      return { ok: true }
    },

    listVisits(s: Session | null) {
      const ss = requireRole(s, 'asha')
      const ids = new Set(ashaBeneficiaries(ss.userId).map((b) => b.id))
      return db.visits.filter((v) => ids.has(v.beneficiaryId)).map((v) => ({ ...v, displayStatus: displayStatus(v), beneficiaryName: benName(v.beneficiaryId) })).sort((a, c) => a.scheduledDate.localeCompare(c.scheduledDate))
    },

    completeVisit(s: Session | null, input: { visitId: string; notes: string; nextVisitDate?: string }) {
      const ss = requireRole(s, 'asha')
      const v = db.visits.find((x) => x.id === input.visitId)
      if (!v) throw notFound('Visit not found.')
      const b = getBen(ss, v.beneficiaryId)
      if (v.status === 'completed') throw invalid('Visit already completed.')
      v.status = 'completed'
      v.completedAt = nowIso()
      v.notes = input.notes
      clearVisitAlerts(v.id)
      db.diary.push({ id: newId('DIA'), beneficiaryId: b.id, ashaUserId: ss.userId, createdAt: nowIso(), source: 'visit_completion', fields: { visitDateTime: today(), purpose: v.purpose, activities: input.notes || 'Visit completed', followUpRequired: input.nextVisitDate ? 'Yes' : 'No', ...(input.nextVisitDate ? { nextVisitDate: input.nextVisitDate } : {}) } })
      let next: Visit | undefined
      if (input.nextVisitDate) {
        next = scheduleVisit(b, ss.userId, input.nextVisitDate, v.purpose)
        const vhr = ensureRecord(b.id, 'VHR')
        vhr.fields.nextVisitDate = { value: input.nextVisitDate, source: 'asha_recorded', updatedAt: nowIso(), updatedBy: ss.userId }
      }
      audit(ss.userId, 'VISIT_COMPLETED', 'Visit', v.id)
      return { visit: v, next }
    },

    rescheduleVisit(s: Session | null, input: { visitId: string; newDate: string; reason?: string }) {
      const ss = requireRole(s, 'asha')
      const v = db.visits.find((x) => x.id === input.visitId)
      if (!v) throw notFound('Visit not found.')
      const b = getBen(ss, v.beneficiaryId)
      if (!input.newDate) throw invalid('Choose a new date.')
      v.rescheduledFrom = v.scheduledDate
      v.scheduledDate = input.newDate
      v.notes = input.reason ? `Rescheduled: ${input.reason}` : 'Rescheduled'
      notifyCitizenOf(b, { key: `cit-resched-${v.id}-${input.newDate}`, title: 'Your visit date has changed', body: `New date: ${formatDate(input.newDate)}.`, priority: 'reminder', link: { screen: 'appointments' }, sensitive: true })
      audit(ss.userId, 'VISIT_RESCHEDULED', 'Visit', v.id, `${v.rescheduledFrom} -> ${input.newDate}`)
      return v
    },

    createVisit(s: Session | null, input: { beneficiaryId: string; date: string; purpose: string }) {
      const ss = requireRole(s, 'asha')
      const b = getBen(ss, input.beneficiaryId)
      if (!input.date || !input.purpose) throw invalid('Date and purpose are required.')
      const v = scheduleVisit(b, ss.userId, input.date, input.purpose)
      audit(ss.userId, 'VISIT_CREATED', 'Visit', v.id)
      return v
    },

    listTasks(s: Session | null) {
      const ss = requireRole(s, 'asha')
      const ids = new Set(ashaBeneficiaries(ss.userId).map((b) => b.id))
      return db.tasks.filter((t) => ids.has(t.beneficiaryId)).map((t) => ({ ...t, beneficiaryName: benName(t.beneficiaryId) }))
    },
    createTask(s: Session | null, input: { beneficiaryId: string; title: string; dueDate?: string; priority?: 'normal' | 'high' }) {
      const ss = requireRole(s, 'asha')
      const b = getBen(ss, input.beneficiaryId)
      if (!input.title?.trim()) throw invalid('Task title is required.')
      const t = { id: newId('TSK'), beneficiaryId: b.id, ashaUserId: ss.userId, title: input.title.trim(), dueDate: input.dueDate, priority: input.priority ?? 'normal', status: 'open' as const, origin: 'manual', createdAt: nowIso() }
      db.tasks.push(t)
      audit(ss.userId, 'TASK_CREATED', 'FollowUpTask', t.id)
      return t
    },
    completeTask(s: Session | null, input: { taskId: string }) {
      const ss = requireRole(s, 'asha')
      const t = db.tasks.find((x) => x.id === input.taskId)
      if (!t) throw notFound('Task not found.')
      getBen(ss, t.beneficiaryId)
      t.status = 'done'
      audit(ss.userId, 'TASK_COMPLETED', 'FollowUpTask', t.id)
      return t
    },

    // ===== Documents =====
    listDocuments(s: Session | null, input: { beneficiaryId?: string }) {
      const ss = requireSession(s)
      if (ss.role === 'citizen') {
        const b = citizenBeneficiary(ss.userId)
        return b ? db.documents.filter((d) => d.beneficiaryId === b.id) : []
      }
      if (input.beneficiaryId) return db.documents.filter((d) => d.beneficiaryId === getBen(ss, input.beneficiaryId!).id)
      const ids = new Set(ashaBeneficiaries(ss.userId).map((b) => b.id))
      return db.documents.filter((d) => ids.has(d.beneficiaryId)).map((d) => ({ ...d, beneficiaryName: benName(d.beneficiaryId) }))
    },
    updateDocument(s: Session | null, input: { documentId: string; status: DocumentStatus; fileName?: string; fileSize?: number }) {
      const ss = requireSession(s)
      const d = db.documents.find((x) => x.id === input.documentId)
      if (!d) throw notFound('Document not found.')
      getBen(ss, d.beneficiaryId)
      const allowed: DocumentStatus[] = ss.role === 'asha' ? ['missing', 'received', 'needs_verification', 'uploaded'] : ['uploaded']
      if (!allowed.includes(input.status)) throw forbidden('You cannot set this document status.')
      d.status = input.status
      if (input.fileName) { d.fileName = input.fileName.slice(0, 120); d.fileSize = input.fileSize }
      d.updatedAt = nowIso()
      d.updatedBy = ss.userId
      audit(ss.userId, 'DOCUMENT_UPDATED', 'DocumentChecklist', d.id, input.status)
      return d
    },
    addDocument(s: Session | null, input: { beneficiaryId: string; name: string; purpose: string }) {
      const ss = requireRole(s, 'asha')
      const b = getBen(ss, input.beneficiaryId)
      if (!input.name?.trim()) throw invalid('Document name is required.')
      const d: DocumentItem = { id: newId('DOC'), beneficiaryId: b.id, name: input.name.trim(), purpose: input.purpose?.trim() || 'General', status: 'missing', updatedAt: nowIso(), updatedBy: ss.userId }
      db.documents.push(d)
      return d
    },

    // ===== Water inspection =====
    listWater(s: Session | null) {
      const ss = requireRole(s, 'asha')
      return db.water.filter((w) => w.ashaUserId === ss.userId).sort((a, c) => c.createdAt.localeCompare(a.createdAt))
    },
    createWater(s: Session | null, input: { householdId: string; waterSource: string; storageMethod: string; cleanlinessConcerns: string; observations: string; guidanceProvided: boolean; followUpDate?: string; inspectionDate?: string }) {
      const ss = requireRole(s, 'asha')
      const h = db.households.find((x) => x.id === input.householdId)
      if (!h) throw notFound('Household not found.')
      if (!ashaAreas(ss.userId).includes(h.areaId)) throw forbidden('This household is not in your authorised area.')
      if (!input.waterSource || !input.storageMethod) throw invalid('Water source and storage method are required.')
      const w = { id: newId('WTR'), householdId: h.id, ashaUserId: ss.userId, inspectionDate: input.inspectionDate || today(), waterSource: input.waterSource, storageMethod: input.storageMethod, cleanlinessConcerns: input.cleanlinessConcerns ?? '', observations: input.observations ?? '', guidanceProvided: !!input.guidanceProvided, followUpDate: input.followUpDate || undefined, createdAt: nowIso() }
      db.water.push(w)
      audit(ss.userId, 'WATER_INSPECTION', 'WaterInspection', w.id)
      return w
    },

    // ===== Assistance requests =====
    listRequests(s: Session | null) {
      const ss = requireSession(s)
      const list = ss.role === 'asha' ? db.requests.filter((r) => r.ashaUserId === ss.userId) : db.requests.filter((r) => r.citizenUserId === ss.userId)
      return list.map((r) => ({ ...r, beneficiaryName: r.beneficiaryId ? benName(r.beneficiaryId) : userById(r.citizenUserId)?.name })).sort((a, c) => c.createdAt.localeCompare(a.createdAt))
    },
    createAssistanceRequest(s: Session | null, input: { category: string; description: string; contactMethod: AssistanceRequest['contactMethod']; consentToShare: boolean; confirmed: boolean; relatedSchemeId?: string; createdVia?: AssistanceRequest['createdVia'] }) {
      const ss = requireRole(s, 'citizen')
      if (!input.confirmed) throw invalid('Please confirm before sending the request.')
      if (!input.consentToShare) throw invalid('Consent is needed to share these details with your ASHA worker.')
      if (!input.category) throw invalid('Choose a request category.')
      return createRequestInternal(ss.userId, { category: input.category, description: input.description ?? '', contactMethod: input.contactMethod ?? 'phone_call', createdVia: input.createdVia ?? 'app', relatedSchemeId: input.relatedSchemeId })
    },
    updateRequestStatus(s: Session | null, input: { requestId: string; status: RequestStatus; note?: string }) {
      const ss = requireRole(s, 'asha')
      const r = db.requests.find((x) => x.id === input.requestId)
      if (!r) throw notFound('Request not found.')
      if (r.ashaUserId !== ss.userId) throw forbidden('This request is not assigned to you.')
      if (!REQUEST_STATUS_TEXT[input.status]) throw invalid('Unknown status.')
      r.status = input.status
      r.history.push({ status: input.status, at: nowIso(), by: ss.userId, note: input.note })
      notify(r.citizenUserId, { key: `req-status-${r.id}-${input.status}`, title: `Your ASHA assistance request: ${REQUEST_STATUS_TEXT[input.status]}`, body: input.note ? input.note : 'Open the app to track your request.', priority: 'info', link: { screen: 'requests' }, sensitive: false })
      audit(ss.userId, 'REQUEST_STATUS', 'AssistanceRequest', r.id, input.status)
      return r
    },

    // ===== Citizen =====
    citizenOverview(s: Session | null) {
      const ss = requireRole(s, 'citizen')
      refreshNotifications(ss.userId)
      const u = userById(ss.userId)!
      const b = citizenBeneficiary(ss.userId)
      const asha = b?.assignedAshaUserId ? userById(b.assignedAshaUserId) : undefined
      const visits = b ? db.visits.filter((v) => v.beneficiaryId === b.id).map((v) => ({ ...v, displayStatus: displayStatus(v) })) : []
      const records = b ? db.records.filter((r) => r.beneficiaryId === b.id) : []
      const diary = b ? db.diary.filter((d) => d.beneficiaryId === b.id) : []
      const timeline = [
        ...diary.map((d) => ({ at: d.createdAt, kind: 'ASHA visit', text: d.fields.purpose ?? 'Home visit', source: 'asha_recorded' as Provenance })),
        ...visits.filter((v) => v.status === 'completed').map((v) => ({ at: v.completedAt ?? v.scheduledDate, kind: 'Visit completed', text: v.purpose, source: 'asha_recorded' as Provenance })),
        ...db.selfReports.filter((r) => r.userId === ss.userId).map((r) => ({ at: r.createdAt, kind: 'You reported', text: r.text, source: 'self_reported' as Provenance })),
        ...db.requests.filter((r) => r.citizenUserId === ss.userId).map((r) => ({ at: r.createdAt, kind: 'Assistance request', text: `${r.category} — ${REQUEST_STATUS_TEXT[r.status]}`, source: 'self_reported' as Provenance })),
      ].sort((a, c) => c.at.localeCompare(a.at))
      return {
        user: publicUser(u),
        profile: citizenProfile(ss.userId),
        beneficiary: b,
        household: b ? db.households.find((h) => h.id === b.householdId) : undefined,
        assignedAsha: asha ? { name: asha.name, workerId: ashaProfile(asha.id)?.workerId } : undefined,
        recordTypes: b ? recordTypesFor(b.category) : [],
        records,
        diary,
        visits: visits.sort((a, c) => a.scheduledDate.localeCompare(c.scheduledDate)),
        nextAppointment: nextAppointmentFor(ss.userId),
        documents: b ? db.documents.filter((d) => d.beneficiaryId === b.id) : [],
        requests: db.requests.filter((r) => r.citizenUserId === ss.userId),
        consents: db.consents.filter((c) => c.userId === ss.userId),
        selfReports: db.selfReports.filter((r) => r.userId === ss.userId),
        timeline,
        unread: db.notifications.filter((n) => n.userId === ss.userId && !n.read).length,
      }
    },
    setConsent(s: Session | null, input: { type: ConsentType; granted: boolean }) {
      const ss = requireRole(s, 'citizen')
      let c = db.consents.find((x) => x.userId === ss.userId && x.type === input.type)
      if (!c) { c = { id: newId('CON'), userId: ss.userId, type: input.type, granted: false, updatedAt: nowIso() }; db.consents.push(c) }
      c.granted = !!input.granted
      c.updatedAt = nowIso()
      if (input.type === 'share_self_reports_with_asha') db.selfReports.filter((r) => r.userId === ss.userId).forEach((r) => (r.shared = c!.granted && r.shared))
      audit(ss.userId, 'CONSENT_CHANGED', 'ConsentRecord', c.id, `${input.type}=${c.granted}`)
      return c
    },
    addSelfReport(s: Session | null, input: { text: string; share: boolean }) {
      const ss = requireRole(s, 'citizen')
      const text = String(input.text ?? '').trim().slice(0, 500)
      if (!text) throw invalid('Please write what you want to report.')
      const b = citizenBeneficiary(ss.userId)
      const canShare = !!input.share && consent(ss.userId, 'share_self_reports_with_asha')
      const r = { id: newId('SLF'), userId: ss.userId, beneficiaryId: b?.id, text, shared: canShare, createdAt: nowIso() }
      db.selfReports.push(r)
      const urgent = classifyIntent(text) === 'emergency'
      if (canShare && b?.assignedAshaUserId) {
        notify(b.assignedAshaUserId, { key: `self-${r.id}`, title: urgent ? `High-priority concern reported: ${b.name}` : `New self-reported information: ${b.name}`, body: urgent ? 'The citizen reported a possible danger sign. Please contact them promptly.' : 'Open the profile to view the shared information.', priority: urgent ? 'urgent' : 'info', link: { screen: 'beneficiary', id: b.id }, relatedBeneficiaryId: b.id, sensitive: true })
      }
      audit(ss.userId, 'SELF_REPORT', 'SelfReport', r.id, canShare ? 'shared' : 'private')
      return { report: r, urgent, sharedWithAsha: canShare, shareBlockedByConsent: !!input.share && !canShare }
    },

    listSchemes(s: Session | null) {
      const ss = requireSession(s)
      const relevant = ss.role === 'citizen' ? relevantSchemes(ss.userId) : SCHEMES.map((x) => ({ ...x, reasons: [] as string[] }))
      const relevantIds = new Set(relevant.map((r) => r.id))
      const latest = db.assessments.filter((a) => a.userId === ss.userId).sort((a, c) => c.createdAt.localeCompare(a.createdAt))[0]
      return {
        schemes: [...relevant, ...SCHEMES.filter((x) => !relevantIds.has(x.id)).map((x) => ({ ...x, reasons: [] as string[] }))],
        latestAssessment: latest,
      }
    },
    eligibilityPrefill(s: Session | null) {
      const ss = requireRole(s, 'citizen')
      return { answers: eligibilityPrefill(ss.userId) }
    },
    nextEligibilityQuestion(_s: Session | null, input: { answers: Answers; schemeIds?: string[] }) {
      requireSession(_s)
      return { question: nextQuestion(input.answers ?? {}, input.schemeIds) }
    },
    runEligibility(s: Session | null, input: { answers: Answers; schemeIds?: string[] }) {
      const ss = requireSession(s)
      const a = runAssessment(ss.userId, input.answers ?? {}, input.schemeIds, ss.role === 'asha' ? 'asha' : 'app')
      if (ss.role === 'citizen') refreshNotifications(ss.userId)
      return a
    },

    askAssistant(s: Session | null, input: { text: string; channel: 'health' | 'maternal'; lang: Lang }) {
      const ss = requireSession(s)
      const text = String(input.text ?? '').trim().slice(0, 1000)
      if (!text) throw invalid('Please type or say your question.')
      const reply = routeAssistantMessage(text, input.lang ?? 'en', input.channel ?? 'health')
      db.privateMessages.push({ id: newId('MSG'), userId: ss.userId, channel: input.channel, role: 'user', text, createdAt: nowIso() })
      db.privateMessages.push({ id: newId('MSG'), userId: ss.userId, channel: input.channel, role: 'assistant', text: reply.text, intent: reply.intent, sources: reply.sources, urgent: reply.urgent, createdAt: nowIso() })
      return reply
    },
    listPrivateMessages(s: Session | null, input: { channel: 'health' | 'maternal' }) {
      const ss = requireSession(s)
      return db.privateMessages.filter((m) => m.userId === ss.userId && m.channel === input.channel)
    },
    clearPrivateMessages(s: Session | null, input: { channel: 'health' | 'maternal' }) {
      const ss = requireSession(s)
      db.privateMessages = db.privateMessages.filter((m) => !(m.userId === ss.userId && m.channel === input.channel))
      return { ok: true }
    },

    // ===== Calling assistant =====
    startCall(s: Session | null) {
      const ss = requireRole(s, 'citizen')
      const call = createCallSession(newId('CALL'), ss.userId, nowIso(), 'demo_simulator')
      db.calls.push(call)
      audit(ss.userId, 'CALL_STARTED', 'CallSession', call.id, 'demo_simulator')
      return call
    },
    callTurn(s: Session | null, input: { callId: string; text: string }) {
      const ss = requireRole(s, 'citizen')
      const idx = db.calls.findIndex((c) => c.id === input.callId && c.userId === ss.userId)
      if (idx < 0) throw notFound('Call not found.')
      const next = engineTurn(db.calls[idx], String(input.text ?? '').slice(0, 500), {
        assess: (answers) => { const a = runAssessment(ss.userId, answers, undefined, 'call'); return { results: a.results, assessmentId: a.id } },
        createRequest: (description) => createRequestInternal(ss.userId, { category: 'Call assistant follow-up', description, contactMethod: 'phone_call', createdVia: 'call' }).id,
        schemeName: (id) => SCHEMES.find((x) => x.id === id)?.shortName ?? id,
        nextAppointment: () => { const d = nextAppointmentFor(ss.userId); return d ? formatDate(d) : undefined },
      }, nowIso())
      db.calls[idx] = next
      return next
    },
    endCall(s: Session | null, input: { callId: string }) {
      const ss = requireRole(s, 'citizen')
      const idx = db.calls.findIndex((c) => c.id === input.callId && c.userId === ss.userId)
      if (idx < 0) throw notFound('Call not found.')
      const ended: CallSession = engineEnd(db.calls[idx], nowIso())
      const retain = consent(ss.userId, 'call_transcript_retention')
      const assessment = db.assessments.find((a) => a.id === ended.assessmentId)
      const summary = {
        id: newId('CSUM'), callId: ended.id, userId: ss.userId, language: ended.language,
        intents: ended.intents.filter((i) => i !== 'unknown'),
        schemesDiscussed: (assessment?.results ?? []).map((r) => ({ schemeId: r.schemeId, status: r.status })),
        requestId: ended.requestId, transcriptRetained: retain,
        durationSeconds: Math.max(0, Math.round((Date.parse(ended.endedAt!) - Date.parse(ended.startedAt)) / 1000)), createdAt: nowIso(),
      }
      db.callSummaries.push(summary)
      // Retention control: the transcript is purged from storage unless the citizen opted in.
      db.calls[idx] = retain ? ended : { ...ended, transcript: [] }
      audit(ss.userId, 'CALL_ENDED', 'CallSession', ended.id, `transcriptRetained=${retain}`)
      return { call: ended, summary }
    },
    listCallSummaries(s: Session | null) {
      const ss = requireRole(s, 'citizen')
      return db.callSummaries.filter((c) => c.userId === ss.userId).sort((a, c) => c.createdAt.localeCompare(a.createdAt))
    },

    // ===== Notifications =====
    listNotifications(s: Session | null) {
      const ss = requireSession(s)
      refreshNotifications(ss.userId)
      return db.notifications.filter((n) => n.userId === ss.userId).sort((a, c) => c.createdAt.localeCompare(a.createdAt))
    },
    markNotificationRead(s: Session | null, input: { id: string }) {
      const ss = requireSession(s)
      const n = db.notifications.find((x) => x.id === input.id && x.userId === ss.userId)
      if (!n) throw notFound('Notification not found.')
      n.read = true
      return n
    },
    markAllNotificationsRead(s: Session | null) {
      const ss = requireSession(s)
      db.notifications.filter((n) => n.userId === ss.userId).forEach((n) => (n.read = true))
      return { ok: true }
    },

    // ===== Audit =====
    listAudit(s: Session | null) {
      const ss = requireSession(s)
      return db.audit.filter((a) => a.actorUserId === ss.userId).slice(-100).reverse()
    },
  }
}

export type SakhiService = ReturnType<typeof createService>
export type ServiceMethod = keyof SakhiService
