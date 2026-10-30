import type { Lang } from '../../shared-types'

export interface KnowledgeSource {
  name: string
  url: string
}

export interface KnowledgeArticle {
  id: string
  topic: 'maternal' | 'newborn' | 'child' | 'elderly' | 'medicine' | 'general' | 'water'
  title: Record<Lang, string>
  summary: Record<Lang, string>
  points: string[]
  keywords: string[]
  sources: KnowledgeSource[]
}

const MCP: KnowledgeSource = { name: 'MoHFW Mother and Child Protection (MCP) Card', url: 'https://nhm.gov.in/' }
const NHM: KnowledgeSource = { name: 'National Health Mission, MoHFW', url: 'https://nhm.gov.in/' }
const WHO_BF: KnowledgeSource = { name: 'WHO — Breastfeeding', url: 'https://www.who.int/health-topics/breastfeeding' }
const UIP: KnowledgeSource = { name: 'MoHFW — Universal Immunization Programme', url: 'https://www.mohfw.gov.in/' }
const WHO_MED: KnowledgeSource = { name: 'WHO — Medication Without Harm', url: 'https://www.who.int/initiatives/medication-without-harm' }
const WHO_WATER: KnowledgeSource = { name: 'WHO — Drinking-water fact sheet', url: 'https://www.who.int/news-room/fact-sheets/detail/drinking-water' }

// General educational content only. Points are written conservatively; translations of
// summaries require review by native speakers before production use.
export const KNOWLEDGE: KnowledgeArticle[] = [
  {
    id: 'anc-prep',
    topic: 'maternal',
    title: { en: 'Preparing for your antenatal check-up', hi: 'प्रसवपूर्व जांच की तैयारी', kn: 'ಪ್ರಸವಪೂರ್ವ ತಪಾಸಣೆಗೆ ತಯಾರಿ' },
    summary: {
      en: 'Carry your MCP card and old reports, note any problems you want to discuss, and attend every check-up your health worker schedules.',
      hi: 'अपना एमसीपी कार्ड और पुरानी रिपोर्ट साथ रखें, जो परेशानियाँ बतानी हैं उन्हें लिख लें, और हर तय जांच पर जाएँ।',
      kn: 'ನಿಮ್ಮ ಎಂಸಿಪಿ ಕಾರ್ಡ್ ಮತ್ತು ಹಳೆಯ ವರದಿಗಳನ್ನು ತೆಗೆದುಕೊಂಡು ಹೋಗಿ, ಹೇಳಬೇಕಾದ ತೊಂದರೆಗಳನ್ನು ಬರೆದುಕೊಳ್ಳಿ, ಮತ್ತು ನಿಗದಿತ ಪ್ರತಿಯೊಂದು ತಪಾಸಣೆಗೆ ಹೋಗಿ.',
    },
    points: [
      'Carry your Mother and Child Protection (MCP) card and any previous reports.',
      'Write down symptoms or questions you want to ask so you do not forget them.',
      'Government guidance recommends at least four antenatal check-ups; follow the schedule given by your ANM / doctor.',
      'Free antenatal check-ups are offered at designated government facilities on the 9th of every month under PMSMA.',
      'Ask your ASHA worker about transport and which facility to visit.',
    ],
    keywords: ['antenatal', 'anc', 'check-up', 'checkup', 'prepare', 'जांच', 'ತಪಾಸಣೆ', 'appointment'],
    sources: [MCP, { name: 'PMSMA — MoHFW', url: 'https://pmsma.mohfw.gov.in/' }],
  },
  {
    id: 'pregnancy-danger',
    topic: 'maternal',
    title: { en: 'Warning signs during pregnancy', hi: 'गर्भावस्था में खतरे के संकेत', kn: 'ಗರ್ಭಾವಸ್ಥೆಯ ಅಪಾಯದ ಚಿಹ್ನೆಗಳು' },
    summary: {
      en: 'Bleeding, severe headache or blurred vision, fits, high fever, severe stomach pain, swelling of face or hands, leaking water or reduced baby movement need immediate medical care.',
      hi: 'खून आना, तेज़ सिरदर्द या धुंधला दिखना, दौरे, तेज़ बुखार, पेट में तेज़ दर्द, चेहरे या हाथों में सूजन, पानी गिरना या बच्चे की हलचल कम होना — तुरंत अस्पताल जाएँ।',
      kn: 'ರಕ್ತಸ್ರಾವ, ತೀವ್ರ ತಲೆನೋವು ಅಥವಾ ಮಸುಕಾದ ದೃಷ್ಟಿ, ಸೆಳವು, ಹೆಚ್ಚು ಜ್ವರ, ತೀವ್ರ ಹೊಟ್ಟೆನೋವು, ಮುಖ ಅಥವಾ ಕೈಗಳ ಊತ, ನೀರು ಸೋರುವುದು ಅಥವಾ ಮಗುವಿನ ಚಲನೆ ಕಡಿಮೆಯಾದರೆ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಆರೈಕೆ ಪಡೆಯಿರಿ.',
    },
    points: [
      'Vaginal bleeding',
      'Severe headache or blurred vision',
      'Fits / convulsions',
      'High fever',
      'Severe abdominal pain',
      'Swelling of face or hands',
      'Leaking of water',
      'Reduced or no movement of the baby',
      'If any of these happen, go to the nearest health facility or call 108 immediately. Do not wait.',
    ],
    keywords: ['danger', 'warning', 'signs', 'swelling', 'movement', 'खतरे', 'ಅಪಾಯ'],
    sources: [MCP],
  },
  {
    id: 'pregnancy-nutrition',
    topic: 'maternal',
    title: { en: 'Food, water and rest in pregnancy', hi: 'गर्भावस्था में भोजन, पानी और आराम', kn: 'ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ಆಹಾರ, ನೀರು ಮತ್ತು ವಿಶ್ರಾಂತಿ' },
    summary: {
      en: 'Eat a variety of foods with an extra meal, drink safe water, rest, and take iron/folic acid and calcium tablets as given by your health worker.',
      hi: 'तरह-तरह का भोजन और एक अतिरिक्त भोजन लें, सुरक्षित पानी पिएँ, आराम करें, और स्वास्थ्य कार्यकर्ता द्वारा दी गई आयरन/फोलिक एसिड व कैल्शियम गोलियाँ लें।',
      kn: 'ವಿವಿಧ ಆಹಾರ ಮತ್ತು ಹೆಚ್ಚುವರಿ ಊಟ ಸೇವಿಸಿ, ಸುರಕ್ಷಿತ ನೀರು ಕುಡಿಯಿರಿ, ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ, ಮತ್ತು ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತೆ ನೀಡಿದ ಕಬ್ಬಿಣ/ಫೋಲಿಕ್ ಆಮ್ಲ ಮತ್ತು ಕ್ಯಾಲ್ಸಿಯಂ ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ.',
    },
    points: [
      'Eat a variety of foods: cereals, pulses, vegetables, fruits, milk / dairy, and eggs or meat if you eat them.',
      'Take an extra meal each day during pregnancy.',
      'Take IFA (iron and folic acid) and calcium tablets exactly as given by your ANM / doctor.',
      'Drink safe drinking water and rest during the day.',
      'Avoid tobacco and alcohol.',
    ],
    keywords: ['food', 'diet', 'nutrition', 'eat', 'hydration', 'iron', 'ifa', 'भोजन', 'ಆಹಾರ'],
    sources: [MCP, NHM],
  },
  {
    id: 'delivery-prep',
    topic: 'maternal',
    title: { en: 'Getting ready for delivery', hi: 'प्रसव की तैयारी', kn: 'ಹೆರಿಗೆಗೆ ಸಿದ್ಧತೆ' },
    summary: {
      en: 'Decide the facility early, keep transport numbers (102/108), documents, some money and a companion ready.',
      hi: 'अस्पताल पहले से तय करें, वाहन नंबर (102/108), दस्तावेज़, कुछ पैसे और एक साथी तैयार रखें।',
      kn: 'ಆಸ್ಪತ್ರೆಯನ್ನು ಮೊದಲೇ ನಿರ್ಧರಿಸಿ, ವಾಹನ ಸಂಖ್ಯೆಗಳು (102/108), ದಾಖಲೆಗಳು, ಸ್ವಲ್ಪ ಹಣ ಮತ್ತು ಜೊತೆಗಾರರನ್ನು ಸಿದ್ಧವಾಗಿಡಿ.',
    },
    points: [
      'Choose the health facility for delivery in advance with your ASHA worker.',
      'Keep ambulance / referral transport numbers handy (108; 102 where operated).',
      'Keep your MCP card, ID and bank details together.',
      'Under JSSK, delivery at public health institutions is free, including transport, as per programme guidelines.',
    ],
    keywords: ['delivery', 'birth', 'labour', 'transport', 'प्रसव', 'ಹೆರಿಗೆ'],
    sources: [NHM, MCP],
  },
  {
    id: 'postnatal-care',
    topic: 'maternal',
    title: { en: 'Care after delivery', hi: 'प्रसव के बाद देखभाल', kn: 'ಹೆರಿಗೆಯ ನಂತರದ ಆರೈಕೆ' },
    summary: {
      en: 'Rest, eat well and keep postnatal visits. Heavy bleeding, fever, foul-smelling discharge, severe pain or breast redness need prompt care.',
      hi: 'आराम करें, अच्छा भोजन लें और प्रसवोत्तर जांच करवाएँ। ज़्यादा खून, बुखार, बदबूदार स्राव, तेज़ दर्द या स्तन में लाली हो तो तुरंत इलाज लें।',
      kn: 'ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ, ಚೆನ್ನಾಗಿ ತಿನ್ನಿರಿ ಮತ್ತು ಪ್ರಸವೋತ್ತರ ಭೇಟಿಗಳನ್ನು ತಪ್ಪಿಸಬೇಡಿ. ಹೆಚ್ಚು ರಕ್ತಸ್ರಾವ, ಜ್ವರ, ದುರ್ವಾಸನೆಯ ಸ್ರಾವ, ತೀವ್ರ ನೋವು ಅಥವಾ ಸ್ತನದ ಕೆಂಪು ಇದ್ದರೆ ತಕ್ಷಣ ಆರೈಕೆ ಪಡೆಯಿರಿ.',
    },
    points: [
      'Your ASHA worker will make home visits after delivery; keep these visits.',
      'Seek care promptly for heavy bleeding, fever, foul-smelling discharge, severe abdominal pain, breast pain or redness.',
      'Feeling very sad or unable to cope is common and treatable — tell your health worker.',
    ],
    keywords: ['postnatal', 'after delivery', 'recovery', 'प्रसव के बाद', 'ಹೆರಿಗೆಯ ನಂತರ'],
    sources: [MCP],
  },
  {
    id: 'breastfeeding',
    topic: 'newborn',
    title: { en: 'Breastfeeding basics', hi: 'स्तनपान की मूल बातें', kn: 'ಸ್ತನ್ಯಪಾನದ ಮೂಲ ಮಾಹಿತಿ' },
    summary: {
      en: 'Start breastfeeding within the first hour, give the first milk (colostrum), and give only breast milk for the first six months.',
      hi: 'जन्म के पहले घंटे में स्तनपान शुरू करें, पहला दूध (कोलोस्ट्रम) दें, और पहले छह महीने केवल माँ का दूध दें।',
      kn: 'ಹುಟ್ಟಿದ ಮೊದಲ ಗಂಟೆಯೊಳಗೆ ಸ್ತನ್ಯಪಾನ ಆರಂಭಿಸಿ, ಮೊದಲ ಹಾಲು (ಕೊಲೊಸ್ಟ್ರಮ್) ನೀಡಿ, ಮತ್ತು ಮೊದಲ ಆರು ತಿಂಗಳು ಕೇವಲ ಎದೆಹಾಲು ನೀಡಿ.',
    },
    points: [
      'Begin breastfeeding within the first hour after birth.',
      'Colostrum (the first yellowish milk) is good for the baby.',
      'Exclusive breastfeeding for the first 6 months — no water, honey or other feeds unless advised by a doctor.',
      'If feeding is painful or the baby is not feeding well, ask your ASHA / ANM.',
    ],
    keywords: ['breastfeed', 'breastfeeding', 'breast', 'feeding', 'milk', 'colostrum', 'स्तनपान', 'ಸ್ತನ್ಯಪಾನ', 'ಹಾಲು'],
    sources: [WHO_BF, MCP],
  },
  {
    id: 'newborn-care',
    topic: 'newborn',
    title: { en: 'Newborn care and danger signs', hi: 'नवजात देखभाल और खतरे के संकेत', kn: 'ನವಜಾತ ಶಿಶು ಆರೈಕೆ ಮತ್ತು ಅಪಾಯದ ಚಿಹ್ನೆಗಳು' },
    summary: {
      en: 'Keep the baby warm, keep the cord clean and dry, breastfeed often. Not feeding, fast breathing, fits, very hot or cold body, or yellow palms/soles need urgent care.',
      hi: 'बच्चे को गर्म रखें, नाल साफ और सूखी रखें, बार-बार स्तनपान कराएँ। दूध न पीना, तेज़ साँस, दौरे, बहुत गर्म या ठंडा शरीर, या पीली हथेलियाँ/तलवे — तुरंत इलाज।',
      kn: 'ಮಗುವನ್ನು ಬೆಚ್ಚಗಿಡಿ, ಹೊಕ್ಕಳುಬಳ್ಳಿ ಸ್ವಚ್ಛ ಮತ್ತು ಒಣಗಿರಲಿ, ಆಗಾಗ ಹಾಲುಣಿಸಿ. ಹಾಲು ಕುಡಿಯದಿರುವುದು, ವೇಗದ ಉಸಿರಾಟ, ಸೆಳವು, ತುಂಬಾ ಬಿಸಿ ಅಥವಾ ತಣ್ಣನೆಯ ದೇಹ, ಹಳದಿ ಅಂಗೈ/ಅಂಗಾಲು — ತುರ್ತು ಆರೈಕೆ.',
    },
    points: [
      'Keep the baby warm (skin-to-skin contact helps).',
      'Keep the cord clean and dry; do not apply anything on it.',
      'ASHA workers make Home Based Newborn Care (HBNC) visits in the first weeks.',
      'Urgent care is needed if the baby is not feeding, breathing fast, has fits, feels very hot or cold, or has yellow palms and soles.',
    ],
    keywords: ['newborn', 'baby', 'cord', 'warm', 'hbnc', 'नवजात', 'ನವಜಾತ', 'ಮಗು'],
    sources: [MCP, NHM],
  },
  {
    id: 'immunisation',
    topic: 'child',
    title: { en: 'Childhood vaccines', hi: 'बच्चों का टीकाकरण', kn: 'ಮಕ್ಕಳ ಲಸಿಕೆ' },
    summary: {
      en: 'Vaccines under the Universal Immunization Programme are free at government facilities. Follow the dates written on your MCP card.',
      hi: 'सार्वभौमिक टीकाकरण कार्यक्रम के टीके सरकारी केंद्रों पर मुफ्त हैं। एमसीपी कार्ड पर लिखी तारीखों का पालन करें।',
      kn: 'ಸಾರ್ವತ್ರಿಕ ಲಸಿಕಾ ಕಾರ್ಯಕ್ರಮದ ಲಸಿಕೆಗಳು ಸರ್ಕಾರಿ ಕೇಂದ್ರಗಳಲ್ಲಿ ಉಚಿತ. ಎಂಸಿಪಿ ಕಾರ್ಡ್‌ನಲ್ಲಿ ಬರೆದ ದಿನಾಂಕಗಳನ್ನು ಪಾಲಿಸಿ.',
    },
    points: [
      'Vaccines are given at birth, 6, 10 and 14 weeks, 9–12 months and 16–24 months as per the national schedule.',
      'Always take the MCP card to the vaccination session.',
      'If a dose was missed, the ANM will advise when to give it — do not skip the rest.',
    ],
    keywords: ['vaccine', 'vaccines', 'vaccination', 'immunisation', 'immunization', 'टीका', 'ಲಸಿಕೆ'],
    sources: [UIP, MCP],
  },
  {
    id: 'elderly-checks',
    topic: 'elderly',
    title: { en: 'Health checks for older adults', hi: 'बुज़ुर्गों के लिए स्वास्थ्य जांच', kn: 'ಹಿರಿಯರಿಗೆ ಆರೋಗ್ಯ ತಪಾಸಣೆ' },
    summary: {
      en: 'Regular BP and sugar screening is available at government health centres. Take medicines exactly as your doctor prescribed.',
      hi: 'सरकारी स्वास्थ्य केंद्रों पर नियमित बीपी और शुगर जांच उपलब्ध है। दवाएँ ठीक वैसे लें जैसे डॉक्टर ने लिखी हैं।',
      kn: 'ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳಲ್ಲಿ ನಿಯಮಿತ ಬಿಪಿ ಮತ್ತು ಸಕ್ಕರೆ ತಪಾಸಣೆ ಲಭ್ಯವಿದೆ. ವೈದ್ಯರು ಬರೆದಂತೆಯೇ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಿ.',
    },
    points: [
      'Screening for common conditions such as high BP and diabetes is offered for adults at Ayushman Arogya Mandir / health centres.',
      'Take prescribed medicines regularly; do not stop them without asking your doctor.',
      'Chest pain, sudden weakness on one side, difficulty speaking or breathing need emergency care — call 108.',
    ],
    keywords: ['elderly', 'old', 'bp', 'blood pressure', 'sugar', 'diabetes', 'बुज़ुर्ग', 'ಹಿರಿಯ'],
    sources: [NHM],
  },
  {
    id: 'medicine-safety',
    topic: 'medicine',
    title: { en: 'Using medicines safely', hi: 'दवाओं का सुरक्षित उपयोग', kn: 'ಔಷಧಿಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಬಳಸುವುದು' },
    summary: {
      en: 'Take medicines only as prescribed, never change or stop them on your own, and ask a doctor or pharmacist about doses — especially in pregnancy or breastfeeding.',
      hi: 'दवाएँ केवल डॉक्टर के अनुसार लें, खुद से न बदलें न बंद करें, और खुराक के बारे में डॉक्टर या फार्मासिस्ट से पूछें — खासकर गर्भावस्था या स्तनपान में।',
      kn: 'ವೈದ್ಯರು ಸೂಚಿಸಿದಂತೆ ಮಾತ್ರ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಿ, ನೀವಾಗಿಯೇ ಬದಲಿಸಬೇಡಿ ಅಥವಾ ನಿಲ್ಲಿಸಬೇಡಿ, ಮತ್ತು ಪ್ರಮಾಣದ ಬಗ್ಗೆ ವೈದ್ಯರು ಅಥವಾ ಔಷಧಿಕಾರರನ್ನು ಕೇಳಿ — ವಿಶೇಷವಾಗಿ ಗರ್ಭಾವಸ್ಥೆ ಅಥವಾ ಸ್ತನ್ಯಪಾನದಲ್ಲಿ.',
    },
    points: [
      "Follow your clinician's prescription. Do not change the dose or stop a medicine without asking them.",
      'Tell the doctor if you are pregnant or breastfeeding before taking any medicine.',
      'Check the expiry date; store medicines in a cool, dry place away from children.',
      'Do not share your medicines with others.',
      'Difficulty breathing, swelling of face or lips, or a severe rash after a medicine needs emergency care.',
    ],
    keywords: ['medicine', 'medicines', 'tablet', 'tablets', 'dose', 'drug', 'pill', 'syrup', 'दवा', 'गोली', 'ಔಷಧ', 'ಮಾತ್ರೆ'],
    sources: [WHO_MED],
  },
  {
    id: 'water-storage',
    topic: 'water',
    title: { en: 'Safe drinking water at home', hi: 'घर पर सुरक्षित पीने का पानी', kn: 'ಮನೆಯಲ್ಲಿ ಸುರಕ್ಷಿತ ಕುಡಿಯುವ ನೀರು' },
    summary: {
      en: 'Store water in clean covered containers, use a ladle, and boil or treat water if unsure. Only laboratory testing can confirm water is safe.',
      hi: 'पानी साफ ढके बर्तन में रखें, करछी से निकालें, और संदेह हो तो उबालें या शुद्ध करें। पानी सुरक्षित है या नहीं, यह केवल जांच से पता चलता है।',
      kn: 'ನೀರನ್ನು ಸ್ವಚ್ಛ ಮುಚ್ಚಿದ ಪಾತ್ರೆಯಲ್ಲಿ ಇಡಿ, ಸೌಟು ಬಳಸಿ, ಸಂದೇಹವಿದ್ದರೆ ಕುದಿಸಿ ಅಥವಾ ಶುದ್ಧೀಕರಿಸಿ. ನೀರು ಸುರಕ್ಷಿತವೇ ಎಂದು ಪರೀಕ್ಷೆಯಿಂದ ಮಾತ್ರ ತಿಳಿಯುತ್ತದೆ.',
    },
    points: ['Use clean, covered containers.', 'Use a ladle with a handle; do not dip hands.', 'Clean containers regularly.', 'Boil or chlorinate water when unsure.', 'Visual checks cannot prove water is microbiologically safe.'],
    keywords: ['water', 'drinking', 'storage', 'पानी', 'ನೀರು'],
    sources: [WHO_WATER],
  },
]

/** Emergency numbers operated in Karnataka; confirm local availability. */
export const EMERGENCY_GUIDANCE = {
  ambulance: '108',
  emergency: '112',
  note: '108 (ambulance) and 112 (emergency response) are operated in Karnataka. If you cannot call, go to the nearest health facility immediately.',
}

/** National Immunization Schedule (UIP) reference for infants — verify against the current MoHFW schedule. */
export const UIP_SCHEDULE = {
  source: UIP,
  verificationStatus: 'needs_verification' as const,
  rows: [
    { age: 'At birth', vaccines: 'BCG, OPV-0, Hepatitis B birth dose' },
    { age: '6 weeks', vaccines: 'OPV-1, Pentavalent-1, Rotavirus-1, fIPV-1, PCV-1' },
    { age: '10 weeks', vaccines: 'OPV-2, Pentavalent-2, Rotavirus-2' },
    { age: '14 weeks', vaccines: 'OPV-3, Pentavalent-3, Rotavirus-3, fIPV-2, PCV-2' },
    { age: '9–12 months', vaccines: 'Measles-Rubella-1, PCV booster, JE-1 (endemic districts), Vitamin A (1st dose)' },
    { age: '16–24 months', vaccines: 'Measles-Rubella-2, DPT booster-1, OPV booster, JE-2 (endemic districts), Vitamin A (2nd dose)' },
  ],
}

/** HBNC home visit days (institutional delivery) as described in HBNC operational guidelines — verify locally. */
export const HBNC_VISIT_DAYS = [3, 7, 14, 21, 28, 42]
