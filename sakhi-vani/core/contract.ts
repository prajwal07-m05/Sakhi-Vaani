import type { ServiceMethod } from './service'

/**
 * REST contract shared by the Express backend and the mobile client's HTTP adapter.
 * Path params (":id") are filled from the input object; remaining fields go in the
 * query string (GET) or JSON body (POST/PATCH).
 */
 const ROUTES: Record<ServiceMethod, { method: 'GET' | 'POST' | 'PATCH'; path: string; public?: boolean }> = {
  login: { method: 'POST', path: '/api/auth/login', public: true },
  registerAsha: { method: 'POST', path: '/api/auth/register/asha', public: true },
  registerCitizen: { method: 'POST', path: '/api/auth/register/citizen', public: true },
  me: { method: 'GET', path: '/api/me' },
  setLanguage: { method: 'PATCH', path: '/api/me/language' },

  ashaDashboard: { method: 'GET', path: '/api/asha/dashboard' },
  searchBeneficiaries: { method: 'GET', path: '/api/asha/beneficiaries' },
  listHouseholds: { method: 'GET', path: '/api/asha/households' },
  getBeneficiaryProfile: { method: 'GET', path: '/api/asha/beneficiaries/:id' },
  updateRecord: { method: 'PATCH', path: '/api/asha/beneficiaries/:beneficiaryId/records/:type' },
  addDiaryEntry: { method: 'POST', path: '/api/asha/beneficiaries/:beneficiaryId/diary' },
  processTranscript: { method: 'POST', path: '/api/asha/beneficiaries/:beneficiaryId/voice-drafts' },
  approveDraft: { method: 'POST', path: '/api/asha/voice-drafts/:draftId/approve' },
  discardDraft: { method: 'POST', path: '/api/asha/voice-drafts/:draftId/discard' },
  listVisits: { method: 'GET', path: '/api/asha/visits' },
  completeVisit: { method: 'POST', path: '/api/asha/visits/:visitId/complete' },
  rescheduleVisit: { method: 'POST', path: '/api/asha/visits/:visitId/reschedule' },
  createVisit: { method: 'POST', path: '/api/asha/visits' },
  listTasks: { method: 'GET', path: '/api/asha/tasks' },
  createTask: { method: 'POST', path: '/api/asha/tasks' },
  completeTask: { method: 'POST', path: '/api/asha/tasks/:taskId/complete' },
  listWater: { method: 'GET', path: '/api/asha/water-inspections' },
  createWater: { method: 'POST', path: '/api/asha/water-inspections' },
  addDocument: { method: 'POST', path: '/api/asha/documents' },
  updateRequestStatus: { method: 'POST', path: '/api/asha/requests/:requestId/status' },

  listDocuments: { method: 'GET', path: '/api/documents' },
  updateDocument: { method: 'PATCH', path: '/api/documents/:documentId' },
  listRequests: { method: 'GET', path: '/api/requests' },
  createAssistanceRequest: { method: 'POST', path: '/api/requests' },

  citizenOverview: { method: 'GET', path: '/api/citizen/overview' },
  setConsent: { method: 'PATCH', path: '/api/citizen/consents/:type' },
  addSelfReport: { method: 'POST', path: '/api/citizen/self-reports' },
  listSchemes: { method: 'GET', path: '/api/schemes' },
  eligibilityPrefill: { method: 'GET', path: '/api/eligibility/prefill' },
  nextEligibilityQuestion: { method: 'POST', path: '/api/eligibility/next-question' },
  runEligibility: { method: 'POST', path: '/api/eligibility/assess' },
  askAssistant: { method: 'POST', path: '/api/assistant/messages' },
  listPrivateMessages: { method: 'GET', path: '/api/assistant/messages' },
  clearPrivateMessages: { method: 'POST', path: '/api/assistant/messages/clear' },
  startCall: { method: 'POST', path: '/api/calls' },
  callTurn: { method: 'POST', path: '/api/calls/:callId/turns' },
  endCall: { method: 'POST', path: '/api/calls/:callId/end' },
  listCallSummaries: { method: 'GET', path: '/api/calls/summaries' },

  listNotifications: { method: 'GET', path: '/api/notifications' },
  markNotificationRead: { method: 'POST', path: '/api/notifications/:id/read' },
  markAllNotificationsRead: { method: 'POST', path: '/api/notifications/read-all' },
  listAudit: { method: 'GET', path: '/api/audit' },
}

export function pathParams(path: string): string[] {
  return (path.match(/:(\w+)/g) ?? []).map((p) => p.slice(1))
}
