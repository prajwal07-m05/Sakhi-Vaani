import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, ASHA, CITIZEN, LAKSHMI_TRANSCRIPT } from './helpers'
import { recordTypesFor } from '../database/schemas/recordSchemas'
import { ROUTES } from '../core/contract'
import { addDays, isoDate } from '../core/util'

test('demo accounts log in and roles are enforced at login', () => {
  const { svc } = fresh()
  assert.equal(svc.login(null, { email: 'asha@demo.com', password: 'Asha@123', role: 'asha' }).user.name, 'Meera')
  assert.equal(svc.login(null, { email: 'citizen@demo.com', password: 'Citizen@123', role: 'citizen' }).user.name, 'Lakshmi')
  assert.throws(() => svc.login(null, { email: 'asha@demo.com', password: 'wrong', role: 'asha' }), /Incorrect/)
  assert.throws(() => svc.login(null, { email: 'citizen@demo.com', password: 'Citizen@123', role: 'asha' }), /registered as a citizen/)
})

test('exactly two primary demo accounts are seeded, and passwords are hashed', () => {
  const { db } = fresh()
  assert.equal(db.users.length, 2)
  for (const u of db.users) assert.ok(!u.passwordHash.includes('@123'))
})

test('role-based access: citizen cannot use ASHA endpoints; ASHA limited to assigned area', () => {
  const { svc } = fresh()
  assert.throws(() => svc.ashaDashboard(CITIZEN), (e: { status: number }) => e.status === 403)
  assert.throws(() => svc.getBeneficiaryProfile(ASHA, { id: 'SYN-901' }), (e: { status: number }) => e.status === 403)
  assert.throws(() => svc.citizenOverview(ASHA), (e: { status: number }) => e.status === 403)
  assert.throws(() => svc.ashaDashboard(null), (e: { status: number }) => e.status === 401)
  assert.ok(!svc.searchBeneficiaries(ASHA, { q: 'Outside' }).length)
})

test('shared beneficiary: Meera finds Lakshmi (SYN-001), linked to the citizen account', () => {
  const { svc } = fresh()
  const byName = svc.searchBeneficiaries(ASHA, { q: 'lakshmi' })
  const byId = svc.searchBeneficiaries(ASHA, { q: 'SYN-001' })
  assert.equal(byName[0].id, 'SYN-001')
  assert.equal(byId[0].id, 'SYN-001')
  assert.equal(svc.searchBeneficiaries(ASHA, { q: 'H-012' }).some((b) => b.id === 'SYN-001'), true)
  assert.equal(svc.citizenOverview(CITIZEN).beneficiary?.id, 'SYN-001')
})

test('dashboard stats are derived from seeded synthetic data', () => {
  const { svc } = fresh()
  const s = svc.ashaDashboard(ASHA).stats
  assert.equal(s.households, 25)
  assert.equal(s.beneficiaries, 48)
  assert.equal(s.todaysVisits, 5)
  assert.equal(s.completed, 2)
  assert.equal(s.overdue, 1)
})

test('record types are selected deterministically by category', () => {
  assert.deepEqual(recordTypesFor('pregnant'), ['VHR', 'ASHA_DIARY', 'MATERNAL'])
  assert.deepEqual(recordTypesFor('newborn'), ['VHR', 'ASHA_DIARY', 'HBNC'])
  assert.deepEqual(recordTypesFor('child'), ['VHR', 'ASHA_DIARY', 'IMMUNISATION'])
  assert.deepEqual(recordTypesFor('postnatal'), ['VHR', 'ASHA_DIARY', 'POSTNATAL'])
  assert.deepEqual(recordTypesFor('elderly'), ['VHR', 'ASHA_DIARY', 'ELDERLY'])
  const { svc } = fresh()
  assert.deepEqual(svc.getBeneficiaryProfile(ASHA, { id: 'SYN-003' }).recordTypes, ['VHR', 'ASHA_DIARY', 'HBNC'])
  assert.deepEqual(svc.getBeneficiaryProfile(ASHA, { id: 'SYN-005' }).recordTypes, ['VHR', 'ASHA_DIARY', 'ELDERLY'])
})

test('voice documentation: extraction maps fields, flags missing info, never invents BP', () => {
  const { svc } = fresh()
  const { draft } = svc.processTranscript(ASHA, { beneficiaryId: 'SYN-001', transcript: LAKSHMI_TRANSCRIPT, language: 'en', sttMode: 'demo_simulated' })
  const get = (rt: string, k: string) => draft.extraction.fields.find((f) => f.recordType === rt && f.key === k)
  assert.equal(get('MATERNAL', 'pregnancyStage')?.value, '7 months (reported)')
  assert.equal(get('ASHA_DIARY', 'reportedConcerns')?.value, 'Reported: discomfort')
  assert.equal(get('ASHA_DIARY', 'followUpRequired')?.value, 'Yes')
  assert.equal(get('ASHA_DIARY', 'nextVisitDate')?.needsConfirmation, true)
  assert.equal(get('MATERNAL', 'bp'), undefined)
  const msgs = draft.extraction.missing.map((m) => m.message).join(' | ')
  assert.match(msgs, /BP measurement has not been provided/)
  assert.match(msgs, /ANC visit details/)
  assert.match(msgs, /EDD/)
})

test('voice documentation: nothing is saved until approved; approval saves, creates follow-up + notification', () => {
  const { svc, db } = fresh()
  const before = JSON.stringify(db.records.find((r) => r.beneficiaryId === 'SYN-001' && r.type === 'MATERNAL'))
  const diaryBefore = db.diary.length
  const { draft } = svc.processTranscript(ASHA, { beneficiaryId: 'SYN-001', transcript: LAKSHMI_TRANSCRIPT, language: 'en', sttMode: 'typed' })
  assert.equal(JSON.stringify(db.records.find((r) => r.beneficiaryId === 'SYN-001' && r.type === 'MATERNAL')), before)
  assert.equal(db.diary.length, diaryBefore)
  assert.throws(() => svc.approveDraft(ASHA, { draftId: draft.id, confirmed: false, fields: draft.extraction.fields }), /Human approval/)
  const res = svc.approveDraft(ASHA, { draftId: draft.id, confirmed: true, fields: draft.extraction.fields })
  assert.ok(res.saved > 5)
  assert.ok(res.visit && res.task)
  assert.equal(db.diary.length, diaryBefore + 1)
  assert.equal(db.records.find((r) => r.beneficiaryId === 'SYN-001' && r.type === 'MATERNAL')!.fields.pregnancyStage.viaVoiceReview, true)
  assert.ok(svc.listNotifications(ASHA).some((n) => n.title.startsWith('Follow-up scheduled: Lakshmi')))
  assert.throws(() => svc.approveDraft(ASHA, { draftId: draft.id, confirmed: true, fields: [] }), /already been decided/)
})

test('Hindi and Kannada demo transcripts extract pregnancy stage and follow-up', () => {
  const { svc } = fresh()
  const hi = svc.processTranscript(ASHA, { beneficiaryId: 'SYN-001', transcript: 'आज मैं लक्ष्मी से मिली। वह सात महीने की गर्भवती है। उसने कुछ असुविधा बताई और अगले हफ्ते फॉलो-अप की ज़रूरत है।', language: 'hi', sttMode: 'demo_simulated' }).draft
  assert.ok(hi.extraction.fields.some((f) => f.key === 'pregnancyStage' && f.value.startsWith('7')))
  assert.ok(hi.extraction.fields.some((f) => f.key === 'followUpRequired'))
  const kn = svc.processTranscript(ASHA, { beneficiaryId: 'SYN-001', transcript: 'ಇಂದು ನಾನು ಲಕ್ಷ್ಮಿ ಅವರನ್ನು ಭೇಟಿ ಮಾಡಿದೆ. ಅವರು ಏಳು ತಿಂಗಳ ಗರ್ಭಿಣಿ. ಮುಂದಿನ ವಾರ ಮತ್ತೆ ಭೇಟಿ ಬೇಕು.', language: 'kn', sttMode: 'demo_simulated' }).draft
  assert.ok(kn.extraction.fields.some((f) => f.key === 'pregnancyStage' && f.value.startsWith('7')))
})

test('danger signs produce urgent flags, not diagnoses', () => {
  const { svc } = fresh()
  const d = svc.processTranscript(ASHA, { beneficiaryId: 'SYN-001', transcript: 'Today Lakshmi reported bleeding and severe headache.', language: 'en', sttMode: 'typed' }).draft
  assert.ok(d.extraction.urgentFlags.length >= 2)
  assert.ok(!JSON.stringify(d.extraction).toLowerCase().includes('diagnosed'))
})

test('missed visits become overdue automatically and are counted', () => {
  const now = new Date()
  const { svc } = fresh(now)
  const visits = svc.listVisits(ASHA)
  const ravi = visits.find((v) => v.id === 'VIS-006')!
  assert.equal(ravi.displayStatus, 'overdue')
  const later = fresh(now, new Date(now.getTime() + 2 * 86400000))
  assert.equal(later.svc.listVisits(ASHA).find((v) => v.id === 'VIS-001')!.displayStatus, 'overdue')
})

test('visit completion writes diary and schedules next visit; reschedule notifies citizen', () => {
  const { svc, db } = fresh()
  const next = addDays(isoDate(new Date()), 10)
  const r = svc.completeVisit(ASHA, { visitId: 'VIS-001', notes: 'Counselled on nutrition', nextVisitDate: next })
  assert.equal(r.visit.status, 'completed')
  assert.equal(r.next?.scheduledDate, next)
  assert.ok(db.diary.some((d) => d.source === 'visit_completion'))
  svc.rescheduleVisit(ASHA, { visitId: r.next!.id, newDate: addDays(next, 2) })
  assert.ok(svc.listNotifications(CITIZEN).some((n) => n.title === 'Your visit date has changed'))
})

test('ASHA notification rules: overdue, record update (EDD), HBNC due', () => {
  const { svc } = fresh()
  const titles = svc.listNotifications(ASHA).map((n) => n.title)
  assert.ok(titles.some((t) => t.startsWith('Follow-up overdue: Ravi (SYN-004)')))
  assert.ok(titles.some((t) => t === 'Record update required: Maternal Health Record'))
  assert.ok(titles.some((t) => t.startsWith('HBNC')))
})

test('documents: citizen may only upload; never officially verified', () => {
  const { svc } = fresh()
  assert.throws(() => svc.updateDocument(CITIZEN, { documentId: 'DOC-002', status: 'received' }), (e: { status: number }) => e.status === 403)
  assert.equal(svc.updateDocument(CITIZEN, { documentId: 'DOC-002', status: 'uploaded', fileName: 'x.pdf' }).status, 'uploaded')
  assert.equal(svc.updateDocument(ASHA, { documentId: 'DOC-002', status: 'needs_verification' }).status, 'needs_verification')
  assert.throws(() => svc.updateDocument(CITIZEN, { documentId: 'DOC-005', status: 'uploaded' }), (e: { status: number }) => e.status === 403)
})

test('assistance request lifecycle: confirm required, ASHA notified, status change notifies citizen', () => {
  const { svc } = fresh()
  assert.throws(() => svc.createAssistanceRequest(CITIZEN, { category: 'Documents', description: '', contactMethod: 'phone_call', consentToShare: true, confirmed: false }))
  assert.throws(() => svc.createAssistanceRequest(CITIZEN, { category: 'Documents', description: '', contactMethod: 'phone_call', consentToShare: false, confirmed: true }))
  const r = svc.createAssistanceRequest(CITIZEN, { category: 'Help with a government scheme', description: 'PMMVY documents', contactMethod: 'home_visit', consentToShare: true, confirmed: true })
  assert.equal(r.ashaUserId, 'USR-ASHA-001')
  assert.ok(svc.listNotifications(ASHA).some((n) => n.title === 'New assistance request'))
  assert.equal(svc.ashaDashboard(ASHA).stats.newRequests, 1)
  svc.updateRequestStatus(ASHA, { requestId: r.id, status: 'ASSIGNED' })
  assert.equal(svc.listRequests(CITIZEN)[0].status, 'ASSIGNED')
  assert.ok(svc.listNotifications(CITIZEN).some((n) => n.title.includes('Assigned')))
  assert.throws(() => svc.updateRequestStatus(CITIZEN, { requestId: r.id, status: 'COMPLETED' }), (e: { status: number }) => e.status === 403)
})

test('privacy: private messages and unshared self-reports never reach the ASHA profile', () => {
  const { svc } = fresh()
  svc.askAssistant(CITIZEN, { text: 'I feel anxious about delivery', channel: 'maternal', lang: 'en' })
  const r = svc.addSelfReport(CITIZEN, { text: 'mild back pain', share: true })
  assert.equal(r.sharedWithAsha, false)
  assert.equal(r.shareBlockedByConsent, true)
  const profile = svc.getBeneficiaryProfile(ASHA, { id: 'SYN-001' })
  assert.equal(profile.selfReports.length, 0)
  assert.ok(!JSON.stringify(profile).includes('anxious'))
  assert.equal(svc.listPrivateMessages(ASHA, { channel: 'maternal' }).length, 0)
  svc.setConsent(CITIZEN, { type: 'share_self_reports_with_asha', granted: true })
  svc.addSelfReport(CITIZEN, { text: 'tired today', share: true })
  assert.equal(svc.getBeneficiaryProfile(ASHA, { id: 'SYN-001' }).selfReports.length, 1)
})

test('assistant: medicine questions redirect dosing to professionals; emergencies get urgent guidance', () => {
  const { svc } = fresh()
  const med = svc.askAssistant(CITIZEN, { text: 'Can I stop my tablets?', channel: 'health', lang: 'en' })
  assert.equal(med.intent, 'medicine')
  assert.match(med.text, /cannot prescribe/)
  const em = svc.askAssistant(CITIZEN, { text: 'There is heavy bleeding', channel: 'health', lang: 'en' })
  assert.equal(em.urgent, true)
  assert.match(em.text, /108/)
})

test('REST contract has unique method+path pairs', () => {
  const keys = Object.values(ROUTES).map((r) => `${r.method} ${r.path}`)
  assert.equal(new Set(keys).size, keys.length)
})
