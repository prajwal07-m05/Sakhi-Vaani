import type { Beneficiary, BeneficiaryCategory, Database, DocumentItem, FieldValue, HealthRecord, Household, Visit } from '../../shared-types'
import { addDays, isoDate, nextDayOfMonth } from '../../core/util'

/**
 * Builds the synthetic demo database. ALL DATA IS SYNTHETIC — no real people, no Aadhaar numbers.
 * Dates are generated relative to `now` so that "today's visits", overdue visits and reminders
 * always make sense when the demo is run.
 */
export function buildSeed(now: Date, hashPassword: (pw: string) => string): Database {
  const today = isoDate(now)
  const ts = now.toISOString()
  const ASHA = 'USR-ASHA-001'
  const CIT = 'USR-CIT-001'
  const AREA = 'AREA-DV-01'
  const OTHER_AREA = 'AREA-OV-01'

  const db: Database = {
    meta: { version: 1, seededAt: ts },
    users: [
      { id: ASHA, role: 'asha', email: 'asha@demo.com', passwordHash: hashPassword('Asha@123'), name: 'Meera', phone: undefined, language: 'en', createdAt: ts, synthetic: true },
      { id: CIT, role: 'citizen', email: 'citizen@demo.com', passwordHash: hashPassword('Citizen@123'), name: 'Lakshmi', language: 'en', createdAt: ts, synthetic: true },
    ],
    ashaProfiles: [{ userId: ASHA, workerId: 'ASHA-DEMO-001', village: 'Demo Village', state: 'Karnataka', assignedAreaIds: [AREA] }],
    citizenProfiles: [{ userId: CIT, beneficiaryId: 'SYN-001', age: 25, gender: 'female', village: 'Demo Village', state: 'Karnataka' }],
    areas: [
      { id: AREA, village: 'Demo Village', district: 'Demo District', state: 'Karnataka' },
      { id: OTHER_AREA, village: 'Other Demo Village', district: 'Demo District', state: 'Karnataka' },
    ],
    households: [],
    beneficiaries: [],
    records: [],
    diary: [],
    drafts: [],
    visits: [],
    tasks: [],
    documents: [],
    water: [],
    assessments: [],
    requests: [],
    notifications: [],
    calls: [],
    callSummaries: [],
    consents: [
      { id: 'CON-001', userId: CIT, type: 'share_records_with_asha', granted: true, updatedAt: ts },
      { id: 'CON-002', userId: CIT, type: 'share_self_reports_with_asha', granted: false, updatedAt: ts },
      { id: 'CON-003', userId: CIT, type: 'notifications', granted: true, updatedAt: ts },
      { id: 'CON-004', userId: CIT, type: 'call_transcript_retention', granted: false, updatedAt: ts },
    ],
    audit: [],
    selfReports: [],
    privateMessages: [],
  }

  const heads = ['Ramesh', 'Suresh', 'Mahesh', 'Ganesh', 'Prakash', 'Nagaraj', 'Shivanna', 'Krishnappa', 'Venkatesh', 'Manjunath', 'Raju', 'Somanna', 'Basavaraj', 'Hanumantha', 'Mallesh', 'Chandrappa', 'Lokesh', 'Siddappa', 'Puttaswamy', 'Kumar', 'Mohan', 'Dinesh', 'Girish', 'Harish', 'Jagadish']
  for (let i = 1; i <= 25; i++) {
    const id = `H-${String(i).padStart(3, '0')}`
    db.households.push({ id, areaId: AREA, address: `Ward ${((i - 1) % 4) + 1}, House ${i}, Demo Village`, headName: `${heads[i - 1]} (demo)`, familyInfo: 'Synthetic household — demo data', synthetic: true })
  }
  db.households.push({ id: 'H-901', areaId: OTHER_AREA, address: 'House 1, Other Demo Village', headName: 'Outside-area household (demo)', synthetic: true })

  const mk = (b: Partial<Beneficiary> & Pick<Beneficiary, 'id' | 'name' | 'householdId' | 'category'>): Beneficiary => ({
    areaId: AREA,
    assignedAshaUserId: ASHA,
    synthetic: true,
    createdAt: ts,
    ...b,
  })

  const babyDob = addDays(today, -6)
  db.beneficiaries.push(
    mk({ id: 'SYN-001', name: 'Lakshmi', age: 25, gender: 'female', householdId: 'H-012', category: 'pregnant', linkedUserId: CIT }),
    mk({ id: 'SYN-002', name: 'Kavya', age: 27, gender: 'female', householdId: 'H-007', category: 'postnatal' }),
    mk({ id: 'SYN-003', name: 'Baby of Kavya', ageLabel: '6 days', dob: babyDob, gender: 'female', householdId: 'H-007', category: 'newborn', motherBeneficiaryId: 'SYN-002' }),
    mk({ id: 'SYN-004', name: 'Ravi', ageLabel: '14 months', dob: addDays(today, -425), gender: 'male', householdId: 'H-003', category: 'child' }),
    mk({ id: 'SYN-005', name: 'Basavaraj', age: 72, gender: 'male', householdId: 'H-018', category: 'elderly' }),
    mk({ id: 'SYN-006', name: 'Shanthi', age: 22, gender: 'female', householdId: 'H-021', category: 'pregnant' }),
    mk({ id: 'SYN-007', name: 'Gowramma', age: 68, gender: 'female', householdId: 'H-018', category: 'elderly' }),
    mk({ id: 'SYN-008', name: 'Anil', ageLabel: '20 months', dob: addDays(today, -610), gender: 'male', householdId: 'H-012', category: 'child' }),
  )
  const firstNames = ['Asha', 'Bhavya', 'Chetan', 'Deepa', 'Eshwar', 'Farida', 'Geetha', 'Hemanth', 'Indira', 'Jyothi', 'Kiran', 'Latha', 'Madhu', 'Nandini', 'Omkar', 'Pavithra', 'Rekha', 'Sahana', 'Tejas', 'Usha', 'Varun', 'Yamuna', 'Arjun', 'Bindu', 'Chaitra', 'Divya', 'Ganga', 'Harsha', 'Ishwarya', 'Jayanth', 'Kamala', 'Lalitha', 'Mamatha', 'Naveen', 'Pooja', 'Roopa', 'Sunil', 'Tara', 'Vani', 'Yashodha']
  for (let i = 9; i <= 48; i++) {
    const n = firstNames[i - 9]
    const hh = `H-${String(((i * 7) % 25) + 1).padStart(3, '0')}`
    db.beneficiaries.push(mk({ id: `SYN-${String(i).padStart(3, '0')}`, name: n, age: 18 + ((i * 13) % 45), householdId: hh, category: 'general' }))
  }
  // Outside Meera's area — used to prove area-based authorisation.
  db.beneficiaries.push({ id: 'SYN-901', name: 'Outside-area beneficiary', age: 30, householdId: 'H-901', areaId: OTHER_AREA, category: 'general', synthetic: true, createdAt: ts })

  const fv = (value: string, source: FieldValue['source'] = 'asha_recorded'): FieldValue => ({ value, source, updatedAt: ts, updatedBy: ASHA })
  const rec = (beneficiaryId: string, type: HealthRecord['type'], fields: Record<string, FieldValue>): HealthRecord => ({ id: `REC-${beneficiaryId}-${type}`, beneficiaryId, type, fields, updatedAt: ts })
  const nextPmsma = nextDayOfMonth(addDays(today, 1), 9)

  db.records.push(
    // Lakshmi — EDD deliberately missing so the system raises "EDD needs confirmation".
    rec('SYN-001', 'VHR', {
      householdId: fv('H-012'), nameAge: fv('Lakshmi, 25'), villageAddress: fv('Ward 3, House 12, Demo Village'),
      pregnancyStatus: fv('Pregnant', 'beneficiary_reported'), pregnancyMonth: fv('7 months (reported)', 'beneficiary_reported'),
      householdStatus: fv('Resident'), familyInfo: fv('Lives with husband and son Anil (SYN-008). Synthetic demo data.'),
      followUpStatus: fv('Follow-up required'), nextVisitDate: fv(today), requiredDocuments: fv('MCP card, bank account details, BPL ration card (if applicable)'),
      missingInformation: fv('EDD to be confirmed from facility records'),
    }),
    rec('SYN-001', 'MATERNAL', {
      pregnancyStatus: fv('Pregnant', 'beneficiary_reported'), pregnancyStage: fv('7 months (reported)', 'beneficiary_reported'),
      ancVisits: fv('ANC 1 and ANC 2 recorded on MCP card (demo)', 'professionally_verified'),
      reportedSymptoms: fv('None reported at last visit', 'beneficiary_reported'),
      nextAppointment: fv(nextPmsma), followUpStatus: fv('Follow-up required'),
    }),
    rec('SYN-006', 'VHR', { householdId: fv('H-021'), nameAge: fv('Shanthi, 22'), villageAddress: fv('Ward 1, House 21, Demo Village'), pregnancyStatus: fv('Pregnant', 'beneficiary_reported'), pregnancyMonth: fv('4 months (reported)', 'beneficiary_reported'), nextVisitDate: fv(today) }),
    rec('SYN-006', 'MATERNAL', { pregnancyStatus: fv('Pregnant', 'beneficiary_reported'), pregnancyStage: fv('4 months (reported)', 'beneficiary_reported'), ancVisits: fv('ANC 1 recorded (demo)', 'professionally_verified') }),
    rec('SYN-002', 'VHR', { householdId: fv('H-007'), nameAge: fv('Kavya, 27'), villageAddress: fv('Ward 3, House 7, Demo Village'), pregnancyStatus: fv('Postnatal', 'beneficiary_reported'), nextVisitDate: fv(addDays(today, 1)) }),
    rec('SYN-002', 'POSTNATAL', { deliveryDate: fv(babyDob, 'beneficiary_reported'), visitDetails: fv(`Day-3 home visit done on ${addDays(babyDob, 3)} (demo)`), recoveryReported: fv('Reports feeling tired; no other concerns shared', 'beneficiary_reported'), nextVisitDate: fv(addDays(babyDob, 7)) }),
    rec('SYN-003', 'VHR', { householdId: fv('H-007'), nameAge: fv('Baby of Kavya, 6 days'), villageAddress: fv('Ward 3, House 7, Demo Village'), nextVisitDate: fv(addDays(babyDob, 7)) }),
    rec('SYN-003', 'HBNC', { babyId: fv('NB-SYN-003 (temporary newborn ID)'), dob: fv(babyDob, 'beneficiary_reported'), motherBeneficiaryId: fv('SYN-002'), birthInfo: fv('Institutional delivery reported (demo)', 'beneficiary_reported'), homeVisitDates: fv(`Day 3: ${addDays(babyDob, 3)} (done)`), feedingReported: fv('Breastfeeding reported', 'beneficiary_reported') }),
    rec('SYN-004', 'VHR', { householdId: fv('H-003'), nameAge: fv('Ravi, 14 months'), villageAddress: fv('Ward 2, House 3, Demo Village'), nextVisitDate: fv(addDays(today, -3)) }),
    rec('SYN-004', 'IMMUNISATION', { dob: fv(`${addDays(today, -425)} (14 months)`, 'beneficiary_reported'), history: fv('Birth, 6, 10, 14-week doses recorded on MCP card (demo). 9-month doses: confirm from MCP card.', 'professionally_verified'), missedFollowUps: fv('Immunisation session follow-up missed — confirm with ANM'), nextVisit: fv(addDays(today, -3)) }),
    rec('SYN-005', 'VHR', { householdId: fv('H-018'), nameAge: fv('Basavaraj, 72'), villageAddress: fv('Ward 2, House 18, Demo Village'), nextVisitDate: fv(today) }),
    rec('SYN-005', 'ELDERLY', { reportedConcerns: fv('Reports knee pain while walking', 'beneficiary_reported'), medicationReported: fv('Says he takes a tablet prescribed at PHC; name not known', 'beneficiary_reported'), assistanceNeeds: fv('Needs help to travel to PHC'), nextVisitDate: fv(today) }),
  )

  db.diary.push(
    { id: 'DIA-001', beneficiaryId: 'SYN-001', ashaUserId: ASHA, createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(), source: 'manual', fields: { visitDateTime: addDays(today, -30), purpose: 'Antenatal home visit', counselling: 'Nutrition and rest; importance of ANC visits', reportedConcerns: 'None reported', followUpRequired: 'Yes', nextVisitDate: addDays(today, -14) } },
    { id: 'DIA-002', beneficiaryId: 'SYN-001', ashaUserId: ASHA, createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(), source: 'manual', fields: { visitDateTime: addDays(today, -14), purpose: 'Antenatal home visit', servicesProvided: 'Reminded about IFA tablets given at facility', reportedConcerns: 'None reported', followUpRequired: 'Yes', nextVisitDate: today } },
    { id: 'DIA-003', beneficiaryId: 'SYN-002', ashaUserId: ASHA, createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(), source: 'manual', fields: { visitDateTime: addDays(babyDob, 3), purpose: 'Postnatal and HBNC day-3 visit', counselling: 'Breastfeeding and keeping baby warm', followUpRequired: 'Yes', nextVisitDate: addDays(babyDob, 7) } },
  )

  const visit = (id: string, beneficiaryId: string, scheduledDate: string, purpose: string, status: Visit['status'] = 'scheduled'): Visit => ({
    id, beneficiaryId, ashaUserId: ASHA, scheduledDate, purpose, status, createdAt: ts,
    ...(status === 'completed' ? { completedAt: ts, notes: 'Completed (demo)' } : {}),
  })
  db.visits.push(
    visit('VIS-001', 'SYN-001', today, 'Antenatal home visit — 7th month follow-up'),
    visit('VIS-002', 'SYN-006', today, 'Antenatal home visit'),
    visit('VIS-003', 'SYN-005', today, 'Elderly care follow-up'),
    visit('VIS-004', 'SYN-007', today, 'Elderly care check-in', 'completed'),
    visit('VIS-005', 'SYN-012', today, 'General household visit', 'completed'),
    visit('VIS-006', 'SYN-004', addDays(today, -3), 'Immunisation follow-up'),
    visit('VIS-007', 'SYN-002', addDays(babyDob, 7), 'Postnatal home visit (day 7)'),
    visit('VIS-008', 'SYN-003', addDays(babyDob, 7), 'HBNC home visit (day 7)'),
    visit('VIS-009', 'SYN-001', addDays(today, 14), 'Antenatal home visit'),
    visit('VIS-010', 'SYN-008', addDays(today, 5), 'Child growth check'),
  )

  db.tasks.push(
    { id: 'TSK-001', beneficiaryId: 'SYN-001', ashaUserId: ASHA, title: 'Confirm EDD from facility records', priority: 'high', status: 'open', origin: 'record_completeness', dueDate: addDays(today, 2), createdAt: ts },
    { id: 'TSK-002', beneficiaryId: 'SYN-004', ashaUserId: ASHA, title: 'Check missed immunisation with ANM', priority: 'high', status: 'open', origin: 'missed_visit', dueDate: today, createdAt: ts },
  )

  const doc = (id: string, beneficiaryId: string, name: string, purpose: string, status: DocumentItem['status']): DocumentItem => ({ id, beneficiaryId, name, purpose, status, updatedAt: ts, updatedBy: ASHA, ...(status !== 'missing' ? { fileName: status === 'uploaded' ? 'demo-sample.pdf' : undefined } : {}) })
  db.documents.push(
    doc('DOC-001', 'SYN-001', 'MCP card', 'Maternal care, PMSMA, JSY, PMMVY', 'received'),
    doc('DOC-002', 'SYN-001', 'Bank account details', 'JSY / PMMVY direct benefit transfer', 'missing'),
    doc('DOC-003', 'SYN-001', 'Identity proof', 'Scheme registration', 'needs_verification'),
    doc('DOC-004', 'SYN-001', 'BPL ration card (if applicable)', 'JSY / PMMVY category proof', 'missing'),
    doc('DOC-005', 'SYN-003', 'Birth registration', 'Newborn records', 'missing'),
    doc('DOC-006', 'SYN-004', 'MCP card (child section)', 'Immunisation', 'received'),
    doc('DOC-007', 'SYN-005', 'Ration card', 'AB-ArK / PM-JAY', 'missing'),
  )

  return db
}

export type { Household, BeneficiaryCategory }
