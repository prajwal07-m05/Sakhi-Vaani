import type { EligibilityQuestion, EligibilityRule, Scheme } from '../../shared-types'

// IMPORTANT: Scheme content below was compiled from publicly documented information on the
// official programme websites. It has NOT been re-verified live by this build. Every scheme is
// therefore marked `needs_verification` until a team member checks the official URL and updates
// `lastReviewed` + `verificationStatus`. Do not present these as current benefits without that check.
const REVIEW_NOTE =
  'Compiled from the official programme website; benefits, amounts and criteria must be re-checked on the official link before relying on them.'
const LAST_REVIEWED = 'Pending team verification'

export const SCHEMES: Scheme[] = [
  {
    id: 'pmsma',
    name: 'Pradhan Mantri Surakshit Matritva Abhiyan',
    shortName: 'PMSMA',
    level: 'central',
    audience: ['pregnant'],
    purpose: 'Assured, comprehensive and quality antenatal care for pregnant women in the second and third trimester.',
    benefits: [
      'Free antenatal check-up at designated government health facilities on the 9th of every month',
      'Check-up by a doctor / specialist, with basic investigations as available at the facility',
    ],
    intendedBeneficiaries: 'Pregnant women in the 2nd or 3rd trimester (from 4th month of pregnancy).',
    eligibilitySummary: ['Currently pregnant', 'In second or third trimester'],
    documents: ['Mother and Child Protection (MCP) card, if available', 'Previous check-up reports, if any'],
    applicationProcess: [
      'No application form is needed.',
      'Visit the designated government facility on the 9th of the month (or the next working day if the 9th is a holiday).',
      'Your ASHA worker can tell you the nearest PMSMA facility.',
    ],
    officialUrl: 'https://pmsma.mohfw.gov.in/',
    sourceName: 'Ministry of Health and Family Welfare — PMSMA portal',
    lastReviewed: LAST_REVIEWED,
    verificationStatus: 'needs_verification',
    verificationNote: REVIEW_NOTE,
  },
  {
    id: 'jssk',
    name: 'Janani Shishu Suraksha Karyakram',
    shortName: 'JSSK',
    level: 'central',
    audience: ['pregnant', 'postnatal', 'newborn'],
    purpose: 'Eliminate out-of-pocket expenses for pregnant women and sick infants using public health institutions.',
    benefits: [
      'Free delivery, including caesarean section, at public health institutions',
      'Free drugs, diagnostics, diet and blood (as entitled)',
      'Free transport from home to facility, between facilities and back home',
      'Entitlements also cover sick infants as per programme guidelines',
    ],
    intendedBeneficiaries: 'All pregnant women delivering in public health institutions, and sick infants.',
    eligibilitySummary: ['Pregnant (or a sick infant)', 'Uses a public health institution'],
    documents: ['MCP card, if available', 'No income certificate is required as per programme description'],
    applicationProcess: [
      'No separate application. Entitlements apply when you use a government health facility.',
      'For free transport, call the state ambulance / referral transport number (102 / 108 as operated in your state).',
    ],
    officialUrl: 'https://nhm.gov.in/',
    sourceName: 'National Health Mission (MoHFW)',
    lastReviewed: LAST_REVIEWED,
    verificationStatus: 'needs_verification',
    verificationNote: REVIEW_NOTE,
  },
  {
    id: 'jsy',
    name: 'Janani Suraksha Yojana',
    shortName: 'JSY',
    level: 'central',
    audience: ['pregnant', 'postnatal'],
    purpose: 'Promote institutional delivery through conditional cash assistance (safe motherhood intervention under NHM).',
    benefits: [
      'Cash assistance for institutional delivery; amount differs by state category and rural/urban area',
      'Karnataka is listed as a High Performing State (HPS) in programme documents — amounts and conditions must be checked on the official source',
    ],
    intendedBeneficiaries: 'In High Performing States: pregnant women from BPL / SC / ST households (age criteria apply) delivering in a government or accredited facility.',
    eligibilitySummary: ['Pregnant', 'Age 19 years or above (HPS criterion)', 'BPL or SC/ST household (HPS criterion)', 'Plans delivery in a government / accredited facility'],
    documents: ['MCP card', 'BPL ration card or SC/ST certificate', 'Bank account details (for direct benefit transfer)', 'Identity proof'],
    applicationProcess: [
      'Register your pregnancy with the ASHA / ANM.',
      'Deliver at a government or accredited health facility.',
      'Submit documents at the facility; payment is processed by the health department.',
    ],
    officialUrl: 'https://nhm.gov.in/',
    sourceName: 'National Health Mission (MoHFW) — JSY guidelines',
    lastReviewed: LAST_REVIEWED,
    verificationStatus: 'needs_verification',
    verificationNote: REVIEW_NOTE,
  },
  {
    id: 'pmmvy',
    name: 'Pradhan Mantri Matru Vandana Yojana',
    shortName: 'PMMVY',
    level: 'central',
    audience: ['pregnant', 'postnatal'],
    purpose: 'Maternity benefit to partly compensate for wage loss and improve health-seeking behaviour of pregnant and lactating mothers.',
    benefits: [
      'Cash benefit in instalments for the first child, paid by direct benefit transfer',
      'Under PMMVY 2.0, an additional benefit is described for a second child if the child is a girl',
      'Exact amounts and instalment conditions must be checked on the official portal',
    ],
    intendedBeneficiaries: 'Pregnant women and lactating mothers meeting the programme criteria (excluding regular government employees).',
    eligibilitySummary: [
      'Pregnant or lactating',
      'Not in regular employment with Central / State Government or PSU',
      'Belongs to one of the listed categories (e.g. BPL ration card, SC/ST, PM-JAY card holder, and others listed on the portal)',
      'First child (or second child who is a girl, under PMMVY 2.0)',
    ],
    documents: ['Identity proof as required by the portal', 'Bank / post office account details', 'MCP card', 'Category proof (e.g. BPL ration card, SC/ST certificate, PM-JAY card)'],
    applicationProcess: [
      'Register through the Anganwadi worker / ASHA, or via the official PMMVY portal.',
      'Submit the required forms and documents.',
      'Track payment status on the official portal.',
    ],
    officialUrl: 'https://pmmvy.wcd.gov.in/',
    sourceName: 'Ministry of Women and Child Development — PMMVY portal',
    lastReviewed: LAST_REVIEWED,
    verificationStatus: 'needs_verification',
    verificationNote: REVIEW_NOTE,
  },
  {
    id: 'pmjay',
    name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana',
    shortName: 'AB PM-JAY',
    level: 'central',
    audience: ['general', 'elderly', 'pregnant', 'postnatal', 'child', 'newborn'],
    purpose: 'Health cover for secondary and tertiary care hospitalisation for eligible families.',
    benefits: [
      'Cashless hospitalisation cover per eligible family per year at empanelled hospitals (cover amount as published on the official site)',
      'Coverage for senior citizens aged 70+ has been announced under the scheme — check current status on the official site',
    ],
    intendedBeneficiaries: 'Families identified through SECC / state databases, and other groups added by the government.',
    eligibilitySummary: ['Family listed as eligible in PM-JAY database, OR', 'Senior citizen aged 70 years or above (as per expanded coverage — verify)'],
    documents: ['Identity proof', 'Ration card / family ID', 'Registered mobile number'],
    applicationProcess: [
      'Check eligibility on the official beneficiary portal or at an empanelled hospital / Common Service Centre.',
      'Complete identity verification and obtain the Ayushman card.',
      'Use the card at empanelled hospitals for eligible treatment.',
    ],
    officialUrl: 'https://pmjay.gov.in/',
    sourceName: 'National Health Authority — PM-JAY',
    lastReviewed: LAST_REVIEWED,
    verificationStatus: 'needs_verification',
    verificationNote: REVIEW_NOTE,
  },
  {
    id: 'abark',
    name: 'Ayushman Bharat – Arogya Karnataka',
    shortName: 'AB-ArK',
    level: 'karnataka',
    audience: ['general', 'elderly', 'pregnant', 'postnatal', 'child', 'newborn'],
    purpose: 'Karnataka state health assurance scheme integrated with AB PM-JAY, administered by Suvarna Arogya Suraksha Trust (SAST).',
    benefits: [
      'Treatment at empanelled hospitals for listed procedures, on referral',
      'Benefit level described as differing between eligible (BPL) households and general (APL) households (co-payment) — verify current rules',
    ],
    intendedBeneficiaries: 'Residents of Karnataka, with different benefit levels by household category.',
    eligibilitySummary: ['Resident of Karnataka', 'Household category (BPL / APL) determines benefit level'],
    documents: ['Ration card (BPL / APL)', 'Identity proof', 'Referral from government facility, where required'],
    applicationProcess: [
      'Visit a government health facility for referral where required.',
      'Register at an empanelled hospital with your ration card and ID.',
      'Check details on the official SAST website.',
    ],
    officialUrl: 'https://sast.karnataka.gov.in/',
    sourceName: 'Suvarna Arogya Suraksha Trust, Government of Karnataka',
    lastReviewed: LAST_REVIEWED,
    verificationStatus: 'needs_verification',
    verificationNote: REVIEW_NOTE,
  },
]

/** Deterministic eligibility rules. AI must never change these. */
export const ELIGIBILITY_RULES: EligibilityRule[] = [
  {
    schemeId: 'pmsma',
    ruleNote: 'Encodes the published intended beneficiaries: pregnant women in 2nd/3rd trimester.',
    criteria: [
      { id: 'pmsma-preg', label: 'Currently pregnant', kind: 'equals', key: 'pregnant', value: 'yes' },
      { id: 'pmsma-tri', label: 'Pregnancy is 4 months or more (2nd/3rd trimester)', kind: 'gte', key: 'pregnancyMonths', value: 4 },
    ],
  },
  {
    schemeId: 'jssk',
    ruleNote: 'Entitlements apply to pregnant women using public health institutions.',
    criteria: [
      { id: 'jssk-preg', label: 'Currently pregnant', kind: 'equals', key: 'pregnant', value: 'yes' },
      { id: 'jssk-pub', label: 'Plans to use a government health facility', kind: 'equals', key: 'plansPublicFacility', value: 'yes' },
    ],
  },
  {
    schemeId: 'jsy',
    ruleNote: 'High Performing State (HPS) criteria as described in JSY guidelines; Karnataka is listed as HPS. Verify current guidelines.',
    criteria: [
      { id: 'jsy-preg', label: 'Currently pregnant', kind: 'equals', key: 'pregnant', value: 'yes' },
      { id: 'jsy-age', label: 'Age 19 years or above', kind: 'gte', key: 'age', value: 19 },
      {
        id: 'jsy-cat',
        label: 'BPL card holder or SC/ST household',
        kind: 'anyOf',
        criteria: [
          { id: 'jsy-bpl', label: 'BPL ration card', kind: 'equals', key: 'bplCard', value: 'yes' },
          { id: 'jsy-scst', label: 'SC/ST household', kind: 'equals', key: 'scSt', value: 'yes' },
        ],
      },
      { id: 'jsy-inst', label: 'Plans delivery in a government / accredited facility', kind: 'equals', key: 'plansPublicFacility', value: 'yes' },
    ],
  },
  {
    schemeId: 'pmmvy',
    ruleNote: 'Subset of PMMVY 2.0 criteria; the full list of eligible categories is on the official portal.',
    criteria: [
      { id: 'pmmvy-preg', label: 'Currently pregnant', kind: 'equals', key: 'pregnant', value: 'yes' },
      { id: 'pmmvy-gov', label: 'Not a regular government / PSU employee', kind: 'equals', key: 'govtEmployee', value: 'no' },
      {
        id: 'pmmvy-cat',
        label: 'Belongs to a listed category (BPL, SC/ST or PM-JAY card)',
        kind: 'anyOf',
        criteria: [
          { id: 'pmmvy-bpl', label: 'BPL ration card', kind: 'equals', key: 'bplCard', value: 'yes' },
          { id: 'pmmvy-scst', label: 'SC/ST household', kind: 'equals', key: 'scSt', value: 'yes' },
          { id: 'pmmvy-pmjay', label: 'PM-JAY / Ayushman card', kind: 'equals', key: 'pmjayListed', value: 'yes' },
        ],
      },
      { id: 'pmmvy-first', label: 'This is the first child (second girl child also covered — confirm with ASHA)', kind: 'equals', key: 'firstChild', value: 'yes' },
    ],
  },
  {
    schemeId: 'pmjay',
    ruleNote: 'Eligibility is determined by the official PM-JAY database; this check only identifies potential relevance.',
    criteria: [
      {
        id: 'pmjay-any',
        label: 'Family listed in PM-JAY database, or aged 70+',
        kind: 'anyOf',
        criteria: [
          { id: 'pmjay-list', label: 'Family listed / has Ayushman card', kind: 'equals', key: 'pmjayListed', value: 'yes' },
          { id: 'pmjay-70', label: 'Aged 70 years or above', kind: 'gte', key: 'age', value: 70 },
        ],
      },
    ],
  },
  {
    schemeId: 'abark',
    ruleNote: 'Residency check only; benefit level depends on household category.',
    criteria: [{ id: 'abark-ka', label: 'Lives in Karnataka', kind: 'equals', key: 'state', value: 'karnataka' }],
  },
]

export const ELIGIBILITY_QUESTIONS: EligibilityQuestion[] = [
  { key: 'pregnant', kind: 'yesno', text: { en: 'Are you currently pregnant?', hi: 'क्या आप अभी गर्भवती हैं?', kn: 'ನೀವು ಈಗ ಗರ್ಭಿಣಿಯಾಗಿದ್ದೀರಾ?' } },
  { key: 'state', kind: 'state', text: { en: 'Which state do you live in?', hi: 'आप किस राज्य में रहती/रहते हैं?', kn: 'ನೀವು ಯಾವ ರಾಜ್ಯದಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?' } },
  { key: 'pregnancyMonths', kind: 'number', text: { en: 'Which month of pregnancy are you in?', hi: 'आपकी गर्भावस्था का कौन सा महीना चल रहा है?', kn: 'ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆಯ ಎಷ್ಟನೇ ತಿಂಗಳು?' } },
  { key: 'age', kind: 'number', text: { en: 'What is your age in years?', hi: 'आपकी उम्र कितने साल है?', kn: 'ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು ವರ್ಷ?' } },
  { key: 'plansPublicFacility', kind: 'yesno', text: { en: 'Do you plan to use a government hospital or health centre for delivery?', hi: 'क्या आप प्रसव के लिए सरकारी अस्पताल या स्वास्थ्य केंद्र जाना चाहती हैं?', kn: 'ಹೆರಿಗೆಗೆ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ಅಥವಾ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಲು ಯೋಜಿಸಿದ್ದೀರಾ?' } },
  { key: 'bplCard', kind: 'yesno', text: { en: 'Does your family have a BPL ration card?', hi: 'क्या आपके परिवार के पास बीपीएल राशन कार्ड है?', kn: 'ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ ಇದೆಯೇ?' } },
  { key: 'scSt', kind: 'yesno', text: { en: 'Does your family belong to SC or ST category?', hi: 'क्या आपका परिवार एससी या एसटी वर्ग से है?', kn: 'ನಿಮ್ಮ ಕುಟುಂಬ ಎಸ್‌ಸಿ ಅಥವಾ ಎಸ್‌ಟಿ ವರ್ಗಕ್ಕೆ ಸೇರಿದೆಯೇ?' } },
  { key: 'pmjayListed', kind: 'yesno', text: { en: 'Does your family have an Ayushman (PM-JAY) card?', hi: 'क्या आपके परिवार के पास आयुष्मान (PM-JAY) कार्ड है?', kn: 'ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಆಯುಷ್ಮಾನ್ (PM-JAY) ಕಾರ್ಡ್ ಇದೆಯೇ?' } },
  { key: 'govtEmployee', kind: 'yesno', text: { en: 'Are you a regular government or PSU employee?', hi: 'क्या आप नियमित सरकारी या सार्वजनिक उपक्रम कर्मचारी हैं?', kn: 'ನೀವು ಖಾಯಂ ಸರ್ಕಾರಿ ಅಥವಾ ಸಾರ್ವಜನಿಕ ಉದ್ಯಮದ ನೌಕರರೇ?' } },
  { key: 'firstChild', kind: 'yesno', text: { en: 'Is this your first child?', hi: 'क्या यह आपका पहला बच्चा है?', kn: 'ಇದು ನಿಮ್ಮ ಮೊದಲ ಮಗುವೇ?' } },
  { key: 'hasDocuments', kind: 'yesno', text: { en: 'Do you have the required registration or supporting documents (such as MCP card, ID, bank account)?', hi: 'क्या आपके पास ज़रूरी पंजीकरण या दस्तावेज़ हैं (जैसे एमसीपी कार्ड, पहचान पत्र, बैंक खाता)?', kn: 'ನಿಮ್ಮ ಬಳಿ ಅಗತ್ಯ ನೋಂದಣಿ ಅಥವಾ ದಾಖಲೆಗಳು (ಎಂಸಿಪಿ ಕಾರ್ಡ್, ಗುರುತಿನ ಚೀಟಿ, ಬ್ಯಾಂಕ್ ಖಾತೆ) ಇವೆಯೇ?' } },
]
