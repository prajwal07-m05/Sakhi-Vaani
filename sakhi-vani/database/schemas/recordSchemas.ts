import type { BeneficiaryCategory, RecordType } from '../../shared-types'

export type FieldKind = 'text' | 'textarea' | 'date' | 'number' | 'select'
export type FieldNature = 'admin' | 'reported' | 'measurement' | 'verified' | 'observation'

export interface FieldDef {
  key: string
  label: string
  kind: FieldKind
  nature: FieldNature
  options?: string[]
  help?: string
  required?: 
  /** only show for these beneficiary categories */
  onlyFor?: BeneficiaryCategory[]
}

export interface RecordSchema {
  type: RecordType
  title: string
  purpose: string
  fields: FieldDef[]
}

const pregnancyCats: BeneficiaryCategory[] = ['pregnant', 'postnatal']

export const RECORD_SCHEMAS: Record<RecordType, RecordSchema> = {
  VHR: {
    type: 'VHR',
    title: 'Village Health Register',
    purpose: 'Household and beneficiary register entry maintained by the ASHA worker.',
    fields: [
      { key: 'householdId', label: 'Household ID', kind: 'text', nature: 'admin', required: true },
      { key: 'nameAge', label: 'Name and age', kind: 'text', nature: 'admin' },
      { key: 'villageAddress', label: 'Village and address', kind: 'text', nature: 'admin' },
      { key: 'pregnancyStatus', label: 'Pregnancy status', kind: 'select', nature: 'reported', options: ['Pregnant', 'Not pregnant', 'Postnatal', 'Not applicable'], onlyFor: pregnancyCats, required: true },
      { key: 'pregnancyMonth', label: 'Pregnancy month / stage', kind: 'text', nature: 'reported', onlyFor: ['pregnant'], required: true },
      { key: 'edd', label: 'Expected delivery date (if known)', kind: 'date', nature: 'reported', onlyFor: ['pregnant'], required: true },
      { key: 'householdStatus', label: 'Household status', kind: 'text', nature: 'admin' },
      { key: 'familyInfo', label: 'Relevant family information', kind: 'textarea', nature: 'admin' },
      { key: 'followUpStatus', label: 'Follow-up status', kind: 'select', nature: 'admin', options: ['No follow-up needed', 'Follow-up required', 'Follow-up scheduled', 'Referred'] },
      { key: 'nextVisitDate', label: 'Next visit date', kind: 'date', nature: 'admin', required: true },
      { key: 'requiredDocuments', label: 'Required documents', kind: 'textarea', nature: 'admin' },
      { key: 'missingInformation', label: 'Missing information', kind: 'textarea', nature: 'admin' },
    ],
  },
  ASHA_DIARY: {
    type: 'ASHA_DIARY',
    title: 'ASHA Diary',
    purpose: "Log of each home visit made by the ASHA worker.",
    fields: [
      { key: 'visitDateTime', label: 'Visit date and time', kind: 'text', nature: 'admin', required: true },
      { key: 'purpose', label: 'Purpose of visit', kind: 'text', nature: 'admin', required: true },
      { key: 'servicesProvided', label: 'Services provided', kind: 'textarea', nature: 'admin' },
      { key: 'counselling', label: 'Counselling provided', kind: 'textarea', nature: 'admin' },
      { key: 'activities', label: 'Activities completed', kind: 'textarea', nature: 'admin' },
      { key: 'reportedConcerns', label: 'Symptoms / concerns reported by beneficiary', kind: 'textarea', nature: 'reported' },
      { key: 'observations', label: 'ASHA observations (not a medical diagnosis)', kind: 'textarea', nature: 'observation' },
      { key: 'followUpRequired', label: 'Follow-up required', kind: 'select', nature: 'admin', options: ['Yes', 'No'] },
      { key: 'nextVisitDate', label: 'Next visit date', kind: 'date', nature: 'admin' },
      { key: 'referral', label: 'Referral information', kind: 'textarea', nature: 'admin' },
    ],
  },
  MATERNAL: {
    type: 'MATERNAL',
    title: 'Maternal Health Record',
    purpose: 'Pregnancy and antenatal care information. Measurements only if taken by an authorised person.',
    fields: [
      { key: 'pregnancyStatus', label: 'Pregnancy status', kind: 'select', nature: 'reported', options: ['Pregnant', 'Delivered', 'Not pregnant'], required: true },
      { key: 'lmp', label: 'Last menstrual period (LMP), if known', kind: 'date', nature: 'reported' },
      { key: 'edd', label: 'Expected date of delivery (EDD), if known', kind: 'date', nature: 'reported', required: true },
      { key: 'pregnancyStage', label: 'Pregnancy stage', kind: 'text', nature: 'reported', required: true },
      { key: 'ancVisits', label: 'Antenatal care (ANC) visits', kind: 'textarea', nature: 'reported', required: true },
      { key: 'bp', label: 'Blood pressure (if measured by authorised person)', kind: 'text', nature: 'measurement', help: 'Leave empty if not measured. Never estimate.' },
      { key: 'weight', label: 'Weight (if measured)', kind: 'text', nature: 'measurement' },
      { key: 'reportedSymptoms', label: 'Reported symptoms or concerns', kind: 'textarea', nature: 'reported' },
      { key: 'checkupInfo', label: 'Medical check-up information (from facility)', kind: 'textarea', nature: 'verified' },
      { key: 'referral', label: 'Referral details', kind: 'textarea', nature: 'admin' },
      { key: 'nextAppointment', label: 'Next appointment', kind: 'date', nature: 'admin', required: true },
      { key: 'followUpStatus', label: 'Follow-up status', kind: 'select', nature: 'admin', options: ['No follow-up needed', 'Follow-up required', 'Follow-up scheduled', 'Referred'] },
    ],
  },
  HBNC: {
    type: 'HBNC',
    title: 'HBNC Home Visit Record',
    purpose: 'Home Based Newborn Care visits for a newborn baby.',
    fields: [
      { key: 'babyId', label: "Baby's name or temporary newborn ID", kind: 'text', nature: 'admin', required: true },
      { key: 'dob', label: 'Date of birth', kind: 'date', nature: 'reported', required: true },
      { key: 'motherBeneficiaryId', label: "Mother's beneficiary ID", kind: 'text', nature: 'admin' },
      { key: 'birthInfo', label: 'Birth information (place, type, as reported)', kind: 'textarea', nature: 'reported' },
      { key: 'homeVisitDates', label: 'Newborn home visit dates', kind: 'textarea', nature: 'admin', required: true },
      { key: 'feedingReported', label: 'Feeding information reported', kind: 'textarea', nature: 'reported' },
      { key: 'reportedConcerns', label: 'Reported health concerns', kind: 'textarea', nature: 'reported' },
      { key: 'followUp', label: 'Follow-up details', kind: 'textarea', nature: 'admin' },
      { key: 'referral', label: 'Referral information', kind: 'textarea', nature: 'admin' },
      { key: 'documents', label: 'Relevant documents', kind: 'textarea', nature: 'admin' },
    ],
  },
  IMMUNISATION: {
    type: 'IMMUNISATION',
    title: 'Immunisation Record',
    purpose: 'Vaccines given as recorded on the MCP card / facility record. Follow the official UIP schedule.',
    fields: [
      { key: 'dob', label: 'Date of birth / age', kind: 'text', nature: 'reported', required: true },
      { key: 'history', label: 'Immunisation history (as recorded on MCP card)', kind: 'textarea', nature: 'verified', required: true },
      { key: 'growth', label: 'Growth monitoring (when available)', kind: 'textarea', nature: 'measurement' },
      { key: 'scheduledAppointments', label: 'Scheduled appointments', kind: 'textarea', nature: 'admin' },
      { key: 'missedFollowUps', label: 'Missed immunisation follow-ups', kind: 'textarea', nature: 'admin' },
      { key: 'reportedConcerns', label: 'Reported concerns', kind: 'textarea', nature: 'reported' },
      { key: 'nextVisit', label: 'Next visit', kind: 'date', nature: 'admin', required: true },
      { key: 'documents', label: 'Relevant documents', kind: 'textarea', nature: 'admin' },
    ],
  },
  POSTNATAL: {
    type: 'POSTNATAL',
    title: 'Postnatal Home Visit Record',
    purpose: "Postnatal care visits for the mother after delivery.",
    fields: [
      { key: 'deliveryDate', label: 'Delivery date (if known)', kind: 'date', nature: 'reported', required: true },
      { key: 'visitDetails', label: 'Postnatal visit details', kind: 'textarea', nature: 'admin', required: true },
      { key: 'recoveryReported', label: "Mother's reported recovery and concerns", kind: 'textarea', nature: 'reported' },
      { key: 'breastfeedingConcerns', label: 'Breastfeeding concerns (if voluntarily shared)', kind: 'textarea', nature: 'reported' },
      { key: 'newbornFollowUps', label: 'Newborn-related follow-ups', kind: 'textarea', nature: 'admin' },
      { key: 'referral', label: 'Referral information', kind: 'textarea', nature: 'admin' },
      { key: 'nextVisitDate', label: 'Next visit date', kind: 'date', nature: 'admin', required: true },
    ],
  },
  ELDERLY: {
    type: 'ELDERLY',
    title: 'Elderly Care Record',
    purpose: 'Reported concerns and measurements for an elderly beneficiary. Not a diagnosis.',
    fields: [
      { key: 'reportedConcerns', label: 'Reported health concerns', kind: 'textarea', nature: 'reported', required: true },
      { key: 'bp', label: 'BP (if measured)', kind: 'text', nature: 'measurement' },
      { key: 'diabetesInfo', label: 'Diabetes information (reported or professionally documented)', kind: 'textarea', nature: 'reported' },
      { key: 'followUpInfo', label: 'Existing follow-up information', kind: 'textarea', nature: 'admin' },
      { key: 'medicationReported', label: 'Medication information provided by beneficiary', kind: 'textarea', nature: 'reported' },
      { key: 'assistanceNeeds', label: 'Assistance requirements', kind: 'textarea', nature: 'admin' },
      { key: 'nextVisitDate', label: 'Next visit date', kind: 'date', nature: 'admin', required: true },
      { key: 'referral', label: 'Referral details', kind: 'textarea', nature: 'admin' },
    ],
  },
}

/** Deterministically select record types for a beneficiary category. */
export function recordTypesFor(category: BeneficiaryCategory): RecordType[] {
  switch (category) {
    case 'pregnant':
      return ['VHR', 'ASHA_DIARY', 'MATERNAL']
    case 'newborn':
      return ['VHR', 'ASHA_DIARY', 'HBNC']
    case 'child':
      return ['VHR', 'ASHA_DIARY', 'IMMUNISATION']
    case 'postnatal':
      return ['VHR', 'ASHA_DIARY', 'POSTNATAL']
    case 'elderly':
      return ['VHR', 'ASHA_DIARY', 'ELDERLY']
    default:
      return ['VHR', 'ASHA_DIARY']
  }
}

export function fieldsFor(type: RecordType, category: BeneficiaryCategory): FieldDef[] {
  return RECORD_SCHEMAS[type].fields.filter((f) => !f.onlyFor || f.onlyFor.includes(category))
}

export const CATEGORY_LABEL: Record<BeneficiaryCategory, string> = {
  pregnant: 'Pregnant woman',
  newborn: 'Newborn baby',
  child: 'Child under two',
  postnatal: 'Postnatal mother',
  elderly: 'Elderly',
  general: 'General',
}
