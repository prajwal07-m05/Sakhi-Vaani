// SAKHI VANI — shared domain types used by the mobile client, backend API,
// AI services, voice services and calling services.

export type Role = 'asha' | 'citizen'
export type Lang = 'en' | 'hi' | 'kn'
export type BeneficiaryCategory = 'pregnant' | 'newborn' | 'child' | 'postnatal' | 'elderly' | 'general'
export type RecordType = 'VHR' | 'ASHA_DIARY' | 'MATERNAL' | 'HBNC' | 'IMMUNISATION' | 'POSTNATAL' | 'ELDERLY'

/** Where a value came from. Never treat anything except professionally_verified as clinical fact. */
export type Provenance =
  | 'beneficiary_reported'
  | 'self_reported'
  | 'asha_recorded'
  | 'measured'
  | 'professionally_verified'
  | 'system'

export interface FieldValue {
  value: string
  source: Provenance
  updatedAt: string
  updatedBy: string
  /** true when the value was captured by voice and then reviewed + approved by the ASHA worker */
  viaVoiceReview?: boolean
}

export interface Session {
  userId: string
  role: Role
}

export interface User {
  id: string
  role: Role
  email: string
  passwordHash: string
  name: string
  phone?: string
  language: Lang
  createdAt: string
  synthetic: boolean
}

export interface AshaWorkerProfile {
  userId: string
  workerId: string
  village: string
  state: string
  assignedAreaIds: string[]
}

export interface CitizenProfile {
  userId: string
  beneficiaryId?: string
  age?: number
  dob?: string
  gender?: 'female' | 'male' | 'other' | 'undisclosed'
  village: string
  state: string
}

export interface Area {
  id: string
  village: string
  district: string
  state: string
}

export interface Household {
  id: string
  areaId: string
  address: string
  headName: string
  familyInfo?: string
  waterSource?: string
  synthetic: boolean
}

export interface Beneficiary {
  id: string
  householdId: string
  areaId: string
  name: string
  age?: number
  ageLabel?: string
  dob?: string
  gender?: 'female' | 'male' | 'other' | 'undisclosed'
  category: BeneficiaryCategory
  assignedAshaUserId?: string
  linkedUserId?: string
  motherBeneficiaryId?: string
  phone?: string
  synthetic: boolean
  createdAt: string
}

export interface HealthRecord {
  id: string
  beneficiaryId: string
  type: Exclude<RecordType, 'ASHA_DIARY'>
  fields: Record<string, FieldValue>
  updatedAt: string
}

export interface DiaryEntry {
  id: string
  beneficiaryId: string
  ashaUserId: string
  createdAt: string
  fields: Record<string, string>
  source: 'manual' | 'voice_reviewed' | 'visit_completion'
  draftId?: string
}

export type SttMode = 'browser_speech' | 'demo_simulated' | 'typed' | 'provider'

export interface ExtractedField {
  recordType: RecordType
  key: string
  label: string
  value: string
  evidence: string
  confidence: 'high' | 'medium' | 'low'
  source: Provenance
  needsConfirmation?: boolean
}

export interface MissingItem {
  recordType: RecordType
  key: string
  label: string
  message: string
}

export interface ExtractionResult {
  fields: ExtractedField[]
  missing: MissingItem[]
  urgentFlags: string[]
  notes: string[]
  engine: 'rule_based' | 'gemini_validated'
  beneficiaryNameMentioned: boolean
}

export interface DocumentationDraft {
  id: string
  beneficiaryId: string
  ashaUserId: string
  transcript: string
  language: Lang
  sttMode: SttMode
  extraction: ExtractionResult
  status: 'pending_review' | 'approved' | 'discarded'
  createdAt: string
  decidedAt?: string
}

export interface Visit {
  id: string
  beneficiaryId: string
  ashaUserId: string
  scheduledDate: string // YYYY-MM-DD
  purpose: string
  status: 'scheduled' | 'completed' | 'cancelled'
  completedAt?: string
  notes?: string
  rescheduledFrom?: string
  createdAt: string
}
export type VisitDisplayStatus = 'scheduled' | 'completed' | 'cancelled' | 'overdue'

export interface FollowUpTask {
  id: string
  beneficiaryId: string
  ashaUserId: string
  title: string
  dueDate?: string
  priority: 'normal' | 'high'
  status: 'open' | 'done'
  origin: string
  createdAt: string
}

export type DocumentStatus = 'missing' | 'received' | 'needs_verification' | 'uploaded'
export interface DocumentItem {
  id: string
  beneficiaryId: string
  name: string
  purpose: string
  status: DocumentStatus
  fileName?: string
  fileSize?: number
  updatedAt: string
  updatedBy?: string
}

export interface WaterInspection {
  id: string
  householdId: string
  ashaUserId: string
  inspectionDate: string
  waterSource: string
  storageMethod: string
  cleanlinessConcerns: string
  observations: string
  guidanceProvided: boolean
  followUpDate?: string
  createdAt: string
}

export type SchemeLevel = 'central' | 'karnataka'
export interface Scheme {
  id: string
  name: string
  shortName: string
  level: SchemeLevel
  audience: Array<'pregnant' | 'postnatal' | 'newborn' | 'child' | 'elderly' | 'general'>
  purpose: string
  benefits: string[]
  intendedBeneficiaries: string
  eligibilitySummary: string[]
  documents: string[]
  applicationProcess: string[]
  officialUrl: string
  sourceName: string
  lastReviewed: string
  verificationStatus: 'verified' | 'needs_verification'
  verificationNote: string
}

export type Answer = string | number
export type Answers = Record<string, Answer>

export type Criterion =
  | { id: string; label: string; kind: 'equals'; key: string; value: string }
  | { id: string; label: string; kind: 'gte' | 'lte'; key: string; value: number }
  | { id: string; label: string; kind: 'anyOf'; criteria: Criterion[] }

export interface EligibilityRule {
  schemeId: string
  criteria: Criterion[]
  ruleNote: string
}

export interface EligibilityQuestion {
  key: string
  kind: 'yesno' | 'number' | 'state'
  text: Record<Lang, string>
}

export type CriterionOutcome = 'met' | 'not_met' | 'unknown'
export type SchemeStatus = 'potentially_eligible' | 'more_info_required' | 'criteria_not_met'
export interface SchemeAssessment {
  schemeId: string
  status: SchemeStatus
  criteria: Array<{ id: string; label: string; outcome: CriterionOutcome }>
  missingKeys: string[]
}

export interface EligibilityAssessment {
  id: string
  userId: string
  answers: Answers
  results: SchemeAssessment[]
  channel: 'app' | 'call' | 'asha'
  createdAt: string
}

export type RequestStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'FOLLOW_UP_SCHEDULED' | 'COMPLETED' | 'REFERRED'
export interface AssistanceRequest {
  id: string
  citizenUserId: string
  beneficiaryId?: string
  ashaUserId?: string
  category: string
  description: string
  contactMethod: 'phone_call' | 'home_visit' | 'in_app'
  consentToShare: boolean
  status: RequestStatus
  createdVia: 'app' | 'call' | 'eligibility'
  relatedSchemeId?: string
  history: Array<{ status: RequestStatus; at: string; by: string; note?: string }>
  createdAt: string
}

export type NotificationPriority = 'info' | 'reminder' | 'attention' | 'urgent'
export interface AppNotification {
  id: string
  userId: string
  key: string
  title: string
  body: string
  priority: NotificationPriority
  createdAt: string
  read: boolean
  link?: { screen: string; id?: string }
  relatedBeneficiaryId?: string
  relatedSchemeId?: string
  /** sensitive notifications must not show details on a lock screen */
  sensitive: boolean
}

export type CallState = 'language' | 'listening' | 'eligibility' | 'confirm_request' | 'ended'
export interface CallTurn {
  speaker: 'assistant' | 'caller' | 'system'
  text: string
  at: string
}
export interface CallSession {
  id: string
  userId: string
  provider: 'demo_simulator' | 'exotel' | 'other'
  language: Lang
  state: CallState
  answers: Answers
  pendingQuestionKey?: string
  intents: string[]
  transcript: CallTurn[]
  assessmentId?: string
  requestId?: string
  startedAt: string
  endedAt?: string
}
export interface CallSummary {
  id: string
  callId: string
  userId: string
  language: Lang
  intents: string[]
  schemesDiscussed: Array<{ schemeId: string; status: SchemeStatus }>
  requestId?: string
  transcriptRetained: boolean
  durationSeconds: number
  createdAt: string
}

export type ConsentType =
  | 'share_records_with_asha'
  | 'share_self_reports_with_asha'
  | 'notifications'
  | 'call_transcript_retention'
export interface ConsentRecord {
  id: string
  userId: string
  type: ConsentType
  granted: boolean
  updatedAt: string
}

export interface AuditLog {
  id: string
  at: string
  actorUserId: string
  action: string
  entity: string
  entityId: string
  detail?: string
}

export interface SelfReport {
  id: string
  userId: string
  beneficiaryId?: string
  text: string
  shared: boolean
  createdAt: string
}

/** Private assistant conversations — never exposed through ASHA endpoints. */
export interface PrivateMessage {
  id: string
  userId: string
  channel: 'health' | 'maternal'
  role: 'user' | 'assistant'
  text: string
  intent?: string
  sources?: Array<{ name: string; url: string }>
  urgent?: boolean
  createdAt: string
}

export interface Database {
  meta: { version: number; seededAt: string }
  users: User[]
  ashaProfiles: AshaWorkerProfile[]
  citizenProfiles: CitizenProfile[]
  areas: Area[]
  households: Household[]
  beneficiaries: Beneficiary[]
  records: HealthRecord[]
  diary: DiaryEntry[]
  drafts: DocumentationDraft[]
  visits: Visit[]
  tasks: FollowUpTask[]
  documents: DocumentItem[]
  water: WaterInspection[]
  assessments: EligibilityAssessment[]
  requests: AssistanceRequest[]
  notifications: AppNotification[]
  calls: CallSession[]
  callSummaries: CallSummary[]
  consents: ConsentRecord[]
  audit: AuditLog[]
  selfReports: SelfReport[]
  privateMessages: PrivateMessage[]
}
