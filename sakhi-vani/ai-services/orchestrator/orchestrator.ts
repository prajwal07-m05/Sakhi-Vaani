import type { Lang } from '../../shared-types'
import { EMERGENCY_GUIDANCE } from '../../database/demo-data/knowledge'
import { localise, retrieveArticles, articleById } from '../retrieval/evidenceRetrieval'

 type Intent = 'emergency' | 'scheme' | 'asha_assistance' | 'appointment' | 'medicine' | 'maternal' | 'health_info' | 'greeting' | 'end' | 'unknown'

const INTENT_WORDS: Array<[Intent, string[]]> = [
  ['emergency', ['bleeding', 'unconscious', 'fits', 'convulsion', 'not breathing', "can't breathe", 'cannot breathe', 'chest pain', 'severe pain', 'emergency', 'baby not moving', 'खून आ', 'बेहोश', 'दौरे', 'सांस नहीं', 'ರಕ್ತಸ್ರಾವ', 'ಪ್ರಜ್ಞೆ ತಪ್ಪ', 'ಸೆಳವು', 'ತುರ್ತು']],
  ['end', ['bye', 'goodbye', 'end call', 'that is all', "that's all", 'nothing else', 'बस इतना', 'और कुछ नहीं', 'ಅಷ್ಟೇ', 'ಸಾಕು']],
  ['asha_assistance', ['asha', 'speak to my', 'talk to my', 'health worker', 'आशा', 'ಆಶಾ']],
  ['scheme', ['scheme', 'yojana', 'government', 'benefit', 'eligible', 'eligibility', 'योजना', 'सरकारी', 'ಯೋಜನೆ', 'ಸರ್ಕಾರ']],
  ['appointment', ['appointment', 'next visit', 'when is my', 'reminder', 'अपॉइंटमेंट', 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್']],
  ['medicine', ['medicine', 'tablet', 'dose', 'drug', 'pill', 'syrup', 'दवा', 'गोली', 'ಔಷಧ', 'ಮಾತ್ರೆ']],
  ['maternal', ['pregnan', 'antenatal', 'anc', 'delivery', 'breastfeed', 'गर्भ', 'प्रसव', 'ಗರ್ಭ', 'ಹೆರಿಗೆ']],
  ['greeting', ['hello', ' hi ', 'namaste', 'namaskara', 'नमस्ते', 'ನಮಸ್ಕಾರ']],
]

/** Intent identification (deterministic keyword NLU; an LLM adapter may refine this on the backend). */
export function classifyIntent(text: string): Intent {
  const t = ` ${text.toLowerCase()} `
  for (const [intent, words] of INTENT_WORDS) if (words.some((w) => t.includes(w))) return intent
  return retrieveArticles(text, 1).length ? 'health_info' : 'unknown'
}

export interface AssistantReply {
  intent: Intent
  text: string
  sources: Array<{ name: string; url: string }>
  urgent: boolean
  suggestedActions: Array<'open_schemes' | 'request_asha' | 'call_108' | 'view_appointments'>
  agentsInvoked: string[]
}

const T = {
  emergency: {
    en: `This may need urgent medical attention. Please call ${EMERGENCY_GUIDANCE.ambulance} (ambulance) or ${EMERGENCY_GUIDANCE.emergency} now, or go to the nearest health facility. I cannot assess this — please do not wait.`,
    hi: `इसके लिए तुरंत चिकित्सा देखभाल की ज़रूरत हो सकती है। अभी ${EMERGENCY_GUIDANCE.ambulance} (एम्बुलेंस) या ${EMERGENCY_GUIDANCE.emergency} पर कॉल करें, या नज़दीकी स्वास्थ्य केंद्र जाएँ। इंतज़ार न करें।`,
    kn: `ಇದಕ್ಕೆ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಗಮನ ಬೇಕಾಗಬಹುದು. ಈಗಲೇ ${EMERGENCY_GUIDANCE.ambulance} (ಆಂಬುಲೆನ್ಸ್) ಅಥವಾ ${EMERGENCY_GUIDANCE.emergency} ಗೆ ಕರೆ ಮಾಡಿ, ಅಥವಾ ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಿ. ಕಾಯಬೇಡಿ.`,
  },
  scheme: {
    en: 'I can help you explore government health schemes that may apply to you. Open "Government Health Schemes" or start "Check My Eligibility" — I will ask a few simple questions, one at a time.',
    hi: 'मैं आपके लिए संभावित सरकारी स्वास्थ्य योजनाएँ खोजने में मदद कर सकती हूँ। "सरकारी स्वास्थ्य योजनाएँ" खोलें या "मेरी पात्रता जांचें" शुरू करें।',
    kn: 'ನಿಮಗೆ ಅನ್ವಯವಾಗಬಹುದಾದ ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲು ನಾನು ಸಹಾಯ ಮಾಡಬಹುದು. "ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ಯೋಜನೆಗಳು" ತೆರೆಯಿರಿ ಅಥವಾ "ನನ್ನ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ" ಆರಂಭಿಸಿ.',
  },
  asha: {
    en: 'I can create an assistance request for your assigned ASHA worker. Tap "Request ASHA Assistance" — the request is only sent after you confirm.',
    hi: 'मैं आपकी आशा कार्यकर्ता के लिए सहायता अनुरोध बना सकती हूँ। "आशा सहायता का अनुरोध" दबाएँ — आपकी पुष्टि के बाद ही भेजा जाएगा।',
    kn: 'ನಿಮ್ಮ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಗೆ ಸಹಾಯ ವಿನಂತಿ ರಚಿಸಬಹುದು. "ಆಶಾ ಸಹಾಯ ವಿನಂತಿ" ಒತ್ತಿ — ನೀವು ದೃಢೀಕರಿಸಿದ ನಂತರವೇ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.',
  },
  appointment: {
    en: 'You can see your upcoming visits and follow-ups under "My Appointments and Reminders".',
    hi: 'आप अपनी आने वाली मुलाकातें "मेरी अपॉइंटमेंट और रिमाइंडर" में देख सकते हैं।',
    kn: 'ನಿಮ್ಮ ಮುಂದಿನ ಭೇಟಿಗಳನ್ನು "ನನ್ನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು ಮತ್ತು ಜ್ಞಾಪನೆಗಳು" ನಲ್ಲಿ ನೋಡಬಹುದು.',
  },
  medicineNote: {
    en: 'For which medicine to take, how much, or whether to stop or change one, please ask your doctor, ANM or pharmacist. I cannot prescribe or change medicines.',
    hi: 'कौन सी दवा, कितनी मात्रा, या दवा बंद/बदलने के लिए कृपया अपने डॉक्टर, एएनएम या फार्मासिस्ट से पूछें। मैं दवा नहीं लिख सकती।',
    kn: 'ಯಾವ ಔಷಧ, ಎಷ್ಟು ಪ್ರಮಾಣ, ಅಥವಾ ನಿಲ್ಲಿಸುವುದು/ಬದಲಿಸುವುದು ಕುರಿತು ನಿಮ್ಮ ವೈದ್ಯರು, ಎಎನ್‌ಎಂ ಅಥವಾ ಔಷಧಿಕಾರರನ್ನು ಕೇಳಿ. ನಾನು ಔಷಧ ಸೂಚಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.',
  },
  disclaimer: {
    en: 'This is general information, not medical advice. For personal concerns, please consult your ANM or doctor.',
    hi: 'यह सामान्य जानकारी है, चिकित्सा सलाह नहीं। व्यक्तिगत चिंता के लिए अपने एएनएम या डॉक्टर से मिलें।',
    kn: 'ಇದು ಸಾಮಾನ್ಯ ಮಾಹಿತಿ, ವೈದ್ಯಕೀಯ ಸಲಹೆಯಲ್ಲ. ವೈಯಕ್ತಿಕ ಕಾಳಜಿಗಳಿಗೆ ನಿಮ್ಮ ಎಎನ್‌ಎಂ ಅಥವಾ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
  },
  unknown: {
    en: 'I am not sure I understood. You can ask about pregnancy care, child vaccines, medicine safety, government schemes, or ask for your ASHA worker.',
    hi: 'मुझे ठीक से समझ नहीं आया। आप गर्भावस्था देखभाल, बच्चों के टीके, दवा सुरक्षा, सरकारी योजनाएँ, या आशा कार्यकर्ता के बारे में पूछ सकते हैं।',
    kn: 'ನನಗೆ ಸರಿಯಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ. ಗರ್ಭಾವಸ್ಥೆಯ ಆರೈಕೆ, ಮಕ್ಕಳ ಲಸಿಕೆ, ಔಷಧ ಸುರಕ್ಷತೆ, ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಅಥವಾ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯ ಬಗ್ಗೆ ಕೇಳಬಹುದು.',
  },
  greeting: {
    en: 'Namaskara! I am SAKHI VANI. How can I help you today?',
    hi: 'नमस्ते! मैं सखी वाणी हूँ। आज मैं आपकी क्या मदद कर सकती हूँ?',
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ಸಖಿ ವಾಣಿ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
  },
}

export function t(key: keyof typeof T, lang: Lang): string {
  return T[key][lang] ?? T[key].en
}

/**
 * Orchestrator: classifies intent and routes to the Healthcare Information Agent,
 * Maternal Support Agent, Scheme Discovery Agent or assistance flow.
 * `agentsInvoked` lists only the components that actually ran for this request.
 */
export function routeAssistantMessage(text: string, lang: Lang, channel: 'health' | 'maternal'): AssistantReply {
  const agents = ['Orchestrator']
  const intent = classifyIntent(text)
  if (intent === 'emergency') {
    agents.push('Healthcare Information Agent (urgent guidance)')
    return { intent, text: t('emergency', lang), sources: [{ name: 'Emergency Response Support System — 112', url: 'https://112.gov.in/' }], urgent: true, suggestedActions: ['call_108', 'request_asha'], agentsInvoked: agents }
  }
  if (intent === 'scheme') { agents.push('Scheme Discovery Agent'); return { intent, text: t('scheme', lang), sources: [], urgent: false, suggestedActions: ['open_schemes'], agentsInvoked: agents } }
  if (intent === 'asha_assistance') return { intent, text: t('asha', lang), sources: [], urgent: false, suggestedActions: ['request_asha'], agentsInvoked: agents }
  if (intent === 'appointment') { agents.push('Follow-up Service'); return { intent, text: t('appointment', lang), sources: [], urgent: false, suggestedActions: ['view_appointments'], agentsInvoked: agents } }
  if (intent === 'greeting' || intent === 'end') return { intent, text: t('greeting', lang), sources: [], urgent: false, suggestedActions: [], agentsInvoked: agents }

  agents.push('Evidence Retrieval Service')
  let articles = retrieveArticles(text, 2)
  if (intent === 'medicine') {
    const med = articleById('medicine-safety')!
    articles = [med, ...articles.filter((a) => a.id !== med.id)].slice(0, 2)
    agents.push('Healthcare Information Agent (medicine safety)')
  } else if (intent === 'maternal' || channel === 'maternal') {
    agents.push('Maternal Support Agent')
    if (!articles.length && intent === 'maternal') articles = [articleById('anc-prep')!]
  } else if (articles.length) {
    agents.push('Healthcare Information Agent')
  }
  if (!articles.length) return { intent: 'unknown', text: t('unknown', lang), sources: [], urgent: false, suggestedActions: [], agentsInvoked: agents }

  const parts = articles.map((a) => {
    const l = localise(a, lang)
    return `${l.title}\n${l.summary}${lang === 'en' ? '\n• ' + a.points.slice(0, 4).join('\n• ') : ''}`
  })
  if (intent === 'medicine') parts.push(t('medicineNote', lang))
  parts.push(t('disclaimer', lang))
  const sources = Array.from(new Map(articles.flatMap((a) => a.sources).map((s) => [s.name, s])).values())
  return { intent, text: parts.join('\n\n'), sources, urgent: false, suggestedActions: [], agentsInvoked: agents }
}
