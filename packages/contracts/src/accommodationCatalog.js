// packages/contracts/src/accommodationCatalog.js
//
// Two catalogues of accommodations, kept apart because they answer
// different questions and have different privacy rules:
//
//   workplaceAccommodations  - what an EMPLOYER offers. Published to
//                              candidates, so it is not private.
//   interviewAccommodations  - what an APPLICANT asks for. Private, and
//                              never requires a diagnosis or proof.
//
// Shape matches supportCatalog so everything a multi-choice question
// renders comes through one code path.
//
// Every Amharic string below is a first draft. A native speaker must
// review it (needsReview: true).

export const workplaceAccommodations = [
  {
    key: 'step_free_access',
    en: 'Step-free access',
    am: 'ደረጃ የሌለው መግቢያ',
    simpleLabel: { en: 'No stairs', am: 'ደረጃ የለም' },
    icon: 'accessibility',
    needsReview: true,
  },
  {
    key: 'accessible_restroom',
    en: 'Accessible restroom',
    am: 'ተደራሽ መጸዳጃ ቤት',
    simpleLabel: { en: 'A toilet you can use', am: 'ሊጠቀሙበት የሚችሉ መጸዳጃ ቤት' },
    icon: 'door-open',
    needsReview: true,
  },
  {
    key: 'screen_reader_software',
    en: 'Screen reader software',
    am: 'የማያ ገጽ አንባቢ ሶፍትዌር',
    simpleLabel: { en: 'The computer reads the screen', am: 'ኮምፒውተሩ ማያ ገጹን ያነባል' },
    icon: 'monitor',
    needsReview: true,
  },
  {
    key: 'sign_language_interpreter',
    en: 'Sign language interpreter',
    am: 'የምልክት ቋንቋ አስተርጓሚ',
    simpleLabel: { en: 'Sign language help', am: 'የምልክት ቋንቋ እርዳታ' },
    icon: 'hand',
    needsReview: true,
  },
  {
    key: 'flexible_hours',
    en: 'Flexible working hours',
    am: 'ተለዋዋጭ የሥራ ሰዓት',
    simpleLabel: { en: 'You can choose your hours', am: 'ሰዓትዎን መምረጥ ይችላሉ' },
    icon: 'clock',
    needsReview: true,
  },
  {
    key: 'remote_or_hybrid',
    en: 'Remote or hybrid work',
    am: 'ከቤት ሆኖ ወይም ቅይጥ ሥራ',
    simpleLabel: { en: 'You can work from home', am: 'ከቤትዎ ሆነው መሥራት ይችላሉ' },
    icon: 'house',
    needsReview: true,
  },
  {
    key: 'quiet_workspace',
    en: 'Quiet workspace',
    am: 'ጸጥ ያለ የሥራ ቦታ',
    simpleLabel: { en: 'A quiet place to work', am: 'ጸጥ ያለ የሥራ ቦታ' },
    icon: 'armchair',
    needsReview: true,
  },
  {
    key: 'assistive_technology',
    en: 'Assistive technology provided',
    am: 'የድጋፍ ቴክኖሎጂ ይቀርባል',
    simpleLabel: { en: 'Special tools are provided', am: 'ልዩ መሣሪያዎች ይሰጣሉ' },
    icon: 'headphones',
    needsReview: true,
  },
  {
    key: 'transport_support',
    en: 'Transport support',
    am: 'የትራንስፖርት ድጋፍ',
    simpleLabel: { en: 'Help getting to work', am: 'ወደ ሥራ ለመድረስ እርዳታ' },
    icon: 'car',
    needsReview: true,
  },
  {
    key: 'onboarding_buddy',
    en: 'A colleague to help you settle in',
    am: 'እንዲላመዱ የሚረዳ የሥራ ባልደረባ',
    simpleLabel: { en: 'Someone helps you start', am: 'ለመጀመር የሚረዳዎት ሰው' },
    icon: 'users',
    needsReview: true,
  },
];

export const WORKPLACE_ACCOMMODATION_KEYS = workplaceAccommodations.map(
  (item) => item.key
);

export const interviewAccommodations = [
  {
    key: 'extra_time',
    en: 'Extra time in the interview',
    am: 'በቃለ መጠይቁ ተጨማሪ ጊዜ',
    simpleLabel: { en: 'More time to answer', am: 'ለመመለስ ተጨማሪ ጊዜ' },
    icon: 'timer',
    needsReview: true,
  },
  {
    key: 'questions_in_advance',
    en: 'The questions sent to me beforehand',
    am: 'ጥያቄዎቹ አስቀድመው ይላኩልኝ',
    simpleLabel: { en: 'Send questions early', am: 'ጥያቄዎቹን ቀድመው ይላኩ' },
    icon: 'mail',
    needsReview: true,
  },
  {
    key: 'interpreter',
    en: 'A sign language interpreter',
    am: 'የምልክት ቋንቋ አስተርጓሚ',
    simpleLabel: { en: 'Sign language help', am: 'የምልክት ቋንቋ እርዳታ' },
    icon: 'hand',
    needsReview: true,
  },
  {
    key: 'accessible_venue',
    en: 'A step-free interview place',
    am: 'ደረጃ የሌለው የቃለ መጠይቅ ቦታ',
    simpleLabel: { en: 'A place with no stairs', am: 'ደረጃ የሌለበት ቦታ' },
    icon: 'accessibility',
    needsReview: true,
  },
  {
    key: 'remote_interview',
    en: 'An interview by phone or video',
    am: 'በስልክ ወይም በቪዲዮ ቃለ መጠይቅ',
    simpleLabel: { en: 'Talk by phone instead', am: 'በስልክ እንነጋገር' },
    icon: 'phone',
    needsReview: true,
  },
  {
    key: 'written_questions',
    en: 'The questions in writing',
    am: 'ጥያቄዎቹ በጽሑፍ',
    simpleLabel: { en: 'Written questions', am: 'የተጻፉ ጥያቄዎች' },
    icon: 'file-text',
    needsReview: true,
  },
  {
    key: 'support_person',
    en: 'Someone with me for support',
    am: 'ለድጋፍ አብሮኝ የሚሆን ሰው',
    simpleLabel: { en: 'A person with me', am: 'አብሮኝ የሚሆን ሰው' },
    icon: 'user-round',
    needsReview: true,
  },
  {
    key: 'breaks',
    en: 'Breaks during the interview',
    am: 'በቃለ መጠይቁ ጊዜ እረፍቶች',
    simpleLabel: { en: 'Time to rest', am: 'ለማረፍ ጊዜ' },
    icon: 'coffee',
    needsReview: true,
  },
  {
    key: 'quiet_room',
    en: 'A quiet room',
    am: 'ጸጥ ያለ ክፍል',
    simpleLabel: { en: 'A quiet room', am: 'ጸጥ ያለ ክፍል' },
    icon: 'armchair',
    needsReview: true,
  },
];

export const INTERVIEW_ACCOMMODATION_KEYS = interviewAccommodations.map(
  (item) => item.key
);
