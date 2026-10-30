import type { Answers, CallSession, Lang, SchemeAssessment, SchemeStatus } from '../../shared-types'
import { nextQuestion, parseAnswer, parseYesNo, questionFor } from '../../ai-services/eligibility/engine'
import { classifyIntent, routeAssistantMessage, t as orchT } from '../../ai-services/orchestrator/orchestrator'
import { localise, retrieveArticles } from '../../ai-services/retrieval/evidenceRetrieval'

/**
 * Calling Assistant conversation engine. Provider-agnostic: used by the in-app DEMO CALL SIMULATOR
 * and by telephony webhooks (Exotel or another provider) once STT/TTS + a number are configured.
 * Eligibility uses the same deterministic engine as the app. Requests are created only after an
 * explicit "yes" confirmation.
 */
export interface CallDeps {
  assess(answers: Answers): { results: SchemeAssessment[]; assessmentId: string }
  createRequest(description: string, relatedSchemeId?: string): string
  schemeName(id: string): string
  nextAppointment(): string | undefined
}

const MAX_ELIGIBILITY_QUESTIONS = 7

const M: Record<string, Record<Lang, string>> = {
  chooseLang: {
    en: 'Welcome to SAKHI VANI. For English say English. हिंदी के लिए हिंदी बोलें। ಕನ್ನಡಕ್ಕಾಗಿ ಕನ್ನಡ ಎನ್ನಿ.',
    hi: 'Welcome to SAKHI VANI. For English say English. हिंदी के लिए हिंदी बोलें। ಕನ್ನಡಕ್ಕಾಗಿ ಕನ್ನಡ ಎನ್ನಿ.',
    kn: 'Welcome to SAKHI VANI. For English say English. हिंदी के लिए हिंदी बोलें। ಕನ್ನಡಕ್ಕಾಗಿ ಕನ್ನಡ ಎನ್ನಿ.',
  },
  greet: {
    en: 'Namaskara! I am the SAKHI VANI assistant. I can help with government health schemes, general health information, or connect you with your ASHA worker. How can I help you?',
    hi: 'नमस्ते! मैं सखी वाणी सहायक हूँ। मैं सरकारी स्वास्थ्य योजनाओं, सामान्य स्वास्थ्य जानकारी, या आपकी आशा कार्यकर्ता से जुड़ने में मदद कर सकती हूँ। मैं आपकी क्या मदद करूँ?',
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ಸಖಿ ವಾಣಿ ಸಹಾಯಕಿ. ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ಯೋಜನೆಗಳು, ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ಮಾಹಿತಿ ಅಥವಾ ನಿಮ್ಮ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಲು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
  },
  schemeStart: {
    en: 'I can help you explore schemes that may apply to you. I will ask a few short questions.',
    hi: 'मैं आपके लिए संभावित योजनाएँ खोजने में मदद कर सकती हूँ। मैं कुछ छोटे सवाल पूछूँगी।',
    kn: 'ನಿಮಗೆ ಅನ್ವಯವಾಗಬಹುದಾದ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಕೆಲವು ಸಣ್ಣ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳುತ್ತೇನೆ.',
  },
  retry: {
    en: 'Sorry, I did not catch that. Please say yes, no, or not sure.',
    hi: 'माफ़ कीजिए, समझ नहीं आया। कृपया हाँ, नहीं, या पता नहीं बोलें।',
    kn: 'ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೌದು, ಇಲ್ಲ ಅಥವಾ ಗೊತ್ತಿಲ್ಲ ಎನ್ನಿ.',
  },
  resultIntro: {
    en: 'Thank you. Based on the official rules stored in SAKHI VANI, here is what I found. This is not an approval — final eligibility is decided by the department.',
    hi: 'धन्यवाद। सखी वाणी में संग्रहीत आधिकारिक नियमों के आधार पर यह परिणाम है। यह स्वीकृति नहीं है — अंतिम पात्रता विभाग तय करता है।',
    kn: 'ಧನ್ಯವಾದಗಳು. ಸಖಿ ವಾಣಿಯಲ್ಲಿರುವ ಅಧಿಕೃತ ನಿಯಮಗಳ ಆಧಾರದ ಮೇಲೆ ಫಲಿತಾಂಶ ಇಲ್ಲಿದೆ. ಇದು ಅನುಮೋದನೆಯಲ್ಲ — ಅಂತಿಮ ಅರ್ಹತೆಯನ್ನು ಇಲಾಖೆ ನಿರ್ಧರಿಸುತ್ತದೆ.',
  },
  offerAsha: {
    en: 'Would you like me to create a request for your ASHA worker to help you with documents and the application? Please say yes or no.',
    hi: 'क्या आप चाहती हैं कि मैं दस्तावेज़ों और आवेदन में मदद के लिए आपकी आशा कार्यकर्ता को अनुरोध भेजूँ? कृपया हाँ या नहीं बोलें।',
    kn: 'ದಾಖಲೆಗಳು ಮತ್ತು ಅರ್ಜಿಗೆ ಸಹಾಯ ಮಾಡಲು ನಿಮ್ಮ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಗೆ ವಿನಂತಿ ರಚಿಸಲೇ? ದಯವಿಟ್ಟು ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎನ್ನಿ.',
  },
  confirmAsha: {
    en: 'Would you like me to create an assistance request for your assigned ASHA worker? Please say yes or no.',
    hi: 'क्या मैं आपकी आशा कार्यकर्ता के लिए सहायता अनुरोध बनाऊँ? कृपया हाँ या नहीं बोलें।',
    kn: 'ನಿಮ್ಮ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಗೆ ಸಹಾಯ ವಿನಂತಿ ರಚಿಸಲೇ? ದಯವಿಟ್ಟು ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎನ್ನಿ.',
  },
  created: {
    en: 'Your request has been created and your ASHA worker has been notified. Reference: {id}.',
    hi: 'आपका अनुरोध बन गया है और आपकी आशा कार्यकर्ता को सूचना दे दी गई है। संदर्भ: {id}।',
    kn: 'ನಿಮ್ಮ ವಿನಂತಿ ರಚನೆಯಾಗಿದೆ ಮತ್ತು ನಿಮ್ಮ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಗೆ ತಿಳಿಸಲಾಗಿದೆ. ಉಲ್ಲೇಖ: {id}.',
  },
  notCreated: {
    en: 'Okay, I have not created any request.',
    hi: 'ठीक है, मैंने कोई अनुरोध नहीं बनाया।',
    kn: 'ಸರಿ, ನಾನು ಯಾವುದೇ ವಿನಂತಿ ರಚಿಸಿಲ್ಲ.',
  },
  anythingElse: {
    en: 'Is there anything else I can help you with? You can say "that is all" to end the call.',
    hi: 'क्या मैं और कुछ मदद कर सकती हूँ? कॉल खत्म करने के लिए "बस इतना" बोलें।',
    kn: 'ಇನ್ನೇನಾದರೂ ಸಹಾಯ ಬೇಕೇ? ಕರೆ ಮುಗಿಸಲು "ಅಷ್ಟೇ" ಎನ್ನಿ.',
  },
  bye: {
    en: 'Thank you for calling SAKHI VANI. Take care. Goodbye.',
    hi: 'सखी वाणी को कॉल करने के लिए धन्यवाद। अपना ख्याल रखें। नमस्ते।',
    kn: 'ಸಖಿ ವಾಣಿಗೆ ಕರೆ ಮಾಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ಆರೋಗ್ಯವಾಗಿರಿ. ವಿದಾಯ.',
  },
  appt: {
    en: 'Your next recorded appointment or visit is on {date}. Please check the app for details.',
    hi: 'आपकी अगली दर्ज मुलाकात {date} को है। विवरण के लिए ऐप देखें।',
    kn: 'ನಿಮ್ಮ ಮುಂದಿನ ದಾಖಲಾದ ಭೇಟಿ {date} ರಂದು. ವಿವರಗಳಿಗೆ ಆಪ್ ನೋಡಿ.',
  },
  noAppt: {
    en: 'I could not find an upcoming appointment in your record. Your ASHA worker can help schedule one.',
    hi: 'आपके रिकॉर्ड में कोई आने वाली मुलाकात नहीं मिली। आपकी आशा कार्यकर्ता मदद कर सकती हैं।',
    kn: 'ನಿಮ್ಮ ದಾಖಲೆಯಲ್ಲಿ ಮುಂದಿನ ಭೇಟಿ ಕಂಡುಬಂದಿಲ್ಲ. ನಿಮ್ಮ ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ಸಹಾಯ ಮಾಡಬಹುದು.',
  },
  missingInfo: {
    en: 'Information still needed: {items}.',
    hi: 'अभी भी ज़रूरी जानकारी: {items}।',
    kn: 'ಇನ್ನೂ ಬೇಕಾದ ಮಾಹಿತಿ: {items}.',
  },
}

const STATUS: Record<SchemeStatus, Record<Lang, string>> = {
  potentially_eligible: { en: 'may be eligible', hi: 'संभवतः पात्र', kn: 'ಅರ್ಹರಾಗಿರಬಹುದು' },
  more_info_required: { en: 'more information needed', hi: 'और जानकारी चाहिए', kn: 'ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕು' },
  criteria_not_met: { en: 'criteria not currently met', hi: 'मानदंड अभी पूरे नहीं', kn: 'ಮಾನದಂಡ ಈಗ ಪೂರೈಸಿಲ್ಲ' },
}

const KEY_LABEL: Record<string, Record<Lang, string>> = {
  pregnant: { en: 'pregnancy status', hi: 'गर्भावस्था की स्थिति', kn: 'ಗರ್ಭಧಾರಣೆ ಸ್ಥಿತಿ' },
  state: { en: 'state', hi: 'राज्य', kn: 'ರಾಜ್ಯ' },
  pregnancyMonths: { en: 'month of pregnancy', hi: 'गर्भावस्था का महीना', kn: 'ಗರ್ಭಧಾರಣೆಯ ತಿಂಗಳು' },
  age: { en: 'age', hi: 'उम्र', kn: 'ವಯಸ್ಸು' },
  plansPublicFacility: { en: 'delivery facility plan', hi: 'प्रसव स्थान', kn: 'ಹೆರಿಗೆ ಸ್ಥಳ' },
  bplCard: { en: 'BPL card', hi: 'बीपीएल कार्ड', kn: 'ಬಿಪಿಎಲ್ ಕಾರ್ಡ್' },
  scSt: { en: 'SC/ST category', hi: 'एससी/एसटी वर्ग', kn: 'ಎಸ್‌ಸಿ/ಎಸ್‌ಟಿ ವರ್ಗ' },
  pmjayListed: { en: 'Ayushman card', hi: 'आयुष्मान कार्ड', kn: 'ಆಯುಷ್ಮಾನ್ ಕಾರ್ಡ್' },
  govtEmployee: { en: 'employment type', hi: 'नौकरी का प्रकार', kn: 'ಉದ್ಯೋಗದ ಪ್ರಕಾರ' },
  firstChild: { en: 'whether this is the first child', hi: 'पहला बच्चा है या नहीं', kn: 'ಮೊದಲ ಮಗುವೇ' },
}

function fill(s: string, vars: Record<string, string>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

export function parseLanguage(text: string): Lang | undefined {
  const s = text.toLowerCase()
  if (s.includes('kannada') || s.includes('ಕನ್ನಡ') || s.trim() === '3') return 'kn'
  if (s.includes('hindi') || s.includes('हिंदी') || s.includes('हिन्दी') || s.trim() === '2') return 'hi'
  if (s.includes('english') || s.trim() === '1') return 'en'
  return undefined
}

export function createCallSession(id: string, userId: string, nowIso: string, provider: CallSession['provider'] = 'demo_simulator'): CallSession {
  return {
    id, userId, provider, language: 'en', state: 'language', answers: {}, intents: [],
    transcript: [{ speaker: 'assistant', text: M.chooseLang.en, at: nowIso }], startedAt: nowIso,
  }
}

/** Advance the conversation by one caller utterance. Returns a new session object. */
export function callTurn(prev: CallSession, input: string, deps: CallDeps, nowIso: string): CallSession {
  const call: CallSession = { ...prev, answers: { ...prev.answers }, intents: [...prev.intents], transcript: [...prev.transcript] }
  const say = (text: string) => call.transcript.push({ speaker: 'assistant', text, at: nowIso })
  const L = () => call.language
  const text = input.trim()
  if (call.state === 'ended') return call
  call.transcript.push({ speaker: 'caller', text, at: nowIso })

  if (call.state === 'language') {
    const lang = parseLanguage(text)
    if (!lang) { say(M.chooseLang.en); return call }
    call.language = lang
    call.state = 'listening'
    say(M.greet[lang])
    return call
  }

  if (call.state === 'eligibility' && call.pendingQuestionKey) {
    const q = questionFor(call.pendingQuestionKey)!
    const ans = parseAnswer(q, text)
    if (ans === undefined) { say(`${M.retry[L()]} ${q.text[L()]}`); return call }
    call.answers[q.key] = ans
    askNextOrFinish(call, deps, say)
    return call
  }

  if (call.state === 'confirm_request') {
    const yn = parseYesNo(text)
    if (yn === 'yes') {
      const scheme = call.intents.includes('scheme') && call.assessmentId ? 'eligibility follow-up' : 'general'
      const id = deps.createRequest(
        scheme === 'general' ? 'Caller asked to speak with their ASHA worker (via SAKHI VANI call).' : 'Caller asked for help with scheme documents / application after an eligibility check on a SAKHI VANI call.',
      )
      call.requestId = id
      say(fill(M.created[L()], { id }))
    } else if (yn === 'no') {
      say(M.notCreated[L()])
    } else { say(M.retry[L()]); return call }
    call.state = 'listening'
    say(M.anythingElse[L()])
    return call
  }

  // listening
  const intent = classifyIntent(text)
  if (!call.intents.includes(intent)) call.intents.push(intent)
  switch (intent) {
    case 'end':
      return endCall(call, nowIso)
    case 'emergency':
      say(orchT('emergency', L()))
      return call
    case 'scheme': {
      say(M.schemeStart[L()])
      const yn = text.toLowerCase()
      if (/pregnan|गर्भवती|ಗರ್ಭಿಣಿ/.test(yn) && call.answers.pregnant === undefined) call.answers.pregnant = 'yes'
      call.state = 'eligibility'
      askNextOrFinish(call, deps, say)
      return call
    }
    case 'asha_assistance':
      call.state = 'confirm_request'
      say(M.confirmAsha[L()])
      return call
    case 'appointment': {
      const d = deps.nextAppointment()
      say(d ? fill(M.appt[L()], { date: d }) : M.noAppt[L()])
      say(M.anythingElse[L()])
      return call
    }
    case 'unknown':
    case 'greeting':
      say(intent === 'greeting' ? M.greet[L()] : orchT('unknown', L()))
      return call
    default: {
      // Voice responses use the short summary only + a safety note.
      const art = retrieveArticles(text, 1)[0]
      if (art) {
        const l = localise(art, L())
        say(`${l.summary} ${intent === 'medicine' ? orchT('medicineNote', L()) : ''} ${orchT('disclaimer', L())}`.replace(/\s+/g, ' ').trim())
        say(`Source: ${art.sources.map((s) => s.name).join('; ')}`)
      } else {
        say(routeAssistantMessage(text, L(), 'health').text)
      }
      say(M.anythingElse[L()])
      return call
    }
  }
}

function askNextOrFinish(call: CallSession, deps: CallDeps, say: (t: string) => void) {
  const asked = Object.keys(call.answers).length
  const q = asked < MAX_ELIGIBILITY_QUESTIONS ? nextQuestion(call.answers, undefined, true) : null
  if (q) {
    call.pendingQuestionKey = q.key
    say(q.text[call.language])
    return
  }
  call.pendingQuestionKey = undefined
  const { results, assessmentId } = deps.assess(call.answers)
  call.assessmentId = assessmentId
  const lang = call.language
  const lines = results
    .filter((r) => r.status !== 'criteria_not_met')
    .map((r) => `${deps.schemeName(r.schemeId)}: ${STATUS[r.status][lang]}`)
  const notMet = results.filter((r) => r.status === 'criteria_not_met').map((r) => deps.schemeName(r.schemeId))
  say(M.resultIntro[lang])
  say(lines.length ? lines.join('. ') + '.' : STATUS.criteria_not_met[lang])
  if (notMet.length) say(`${STATUS.criteria_not_met[lang]}: ${notMet.join(', ')}.`)
  const missing = Array.from(new Set(results.flatMap((r) => r.missingKeys))).map((k) => KEY_LABEL[k]?.[lang] ?? k)
  if (missing.length) say(fill(M.missingInfo[lang], { items: missing.join(', ') }))
  call.state = 'confirm_request'
  say(M.offerAsha[lang])
}

export function endCall(call: CallSession, nowIso: string): CallSession {
  const c = { ...call, transcript: [...call.transcript] }
  if (c.state !== 'ended') {
    c.transcript.push({ speaker: 'assistant', text: M.bye[c.language], at: nowIso })
    c.state = 'ended'
    c.endedAt = nowIso
  }
  return c
}

export const CALL_STATUS_TEXT = STATUS
