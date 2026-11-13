// packages/contracts/src/fieldCatalog.js
// The list of fields a partner can use in a form.
// Every Amharic text below is a first draft. A native speaker must review it (needsReview: true).

export const SUPPORTED_LANGUAGES = ['en', 'am'];

export const IDENTITY_ROUTES = [
  {
    key: 'kebele_id',
    label: { en: 'Kebele ID', am: 'የቀበሌ መታወቂያ' },
    simpleLabel: { en: 'Kebele ID card', am: 'የቀበሌ መታወቂያ ካርድ' },
    icon: 'id-card',
    needsNumber: true,
  },
  {
    key: 'passport',
    label: { en: 'Passport', am: 'ፓስፖርት' },
    simpleLabel: { en: 'Passport book', am: 'ፓስፖርት' },
    icon: 'passport',
    needsNumber: true,
  },
  {
    key: 'refugee_id',
    label: { en: 'Refugee ID', am: 'የስደተኛ መታወቂያ' },
    simpleLabel: { en: 'Refugee ID card', am: 'የስደተኛ መታወቂያ ካርድ' },
    icon: 'refugee-card',
    needsNumber: true,
  },
  {
    key: 'other_document',
    label: { en: 'Another document', am: 'ሌላ ሰነድ' },
    simpleLabel: { en: 'Another paper', am: 'ሌላ ወረቀት' },
    icon: 'file',
    needsNumber: false,
  },
  {
    key: 'partner_referral',
    label: { en: 'Refer me through a partner', am: 'በአጋር ድርጅት በኩል ይላኩኝ' },
    simpleLabel: { en: 'A partner helps me', am: 'አጋር ድርጅት ይርዳኝ' },
    icon: 'handshake',
    needsNumber: false,
  },
  {
    key: 'no_document',
    label: { en: 'I have no document', am: 'ምንም ሰነድ የለኝም' },
    simpleLabel: { en: 'I have no papers', am: 'ምንም ወረቀት የለኝም' },
    icon: 'no-document',
    needsNumber: false,
    alwaysAvailable: true,
  },
];

export const LEVEL_OPTIONS = [
  {
    key: 'beginner',
    label: { en: 'Beginner', am: 'ጀማሪ' },
    simpleLabel: { en: 'Just starting', am: 'አሁን እየጀመርኩ ነው' },
  },
  {
    key: 'intermediate',
    label: { en: 'Intermediate', am: 'መካከለኛ' },
    simpleLabel: { en: 'Some knowledge', am: 'ትንሽ አውቃለሁ' },
  },
  {
    key: 'advanced',
    label: { en: 'Advanced', am: 'ከፍተኛ' },
    simpleLabel: { en: 'Good knowledge', am: 'በደንብ አውቃለሁ' },
  },
];

export const fieldCatalog = {
  name: {
    key: 'name',
    type: 'text',
    label: { en: 'Full name', am: 'ሙሉ ስም' },
    simpleLabel: { en: 'Your name', am: 'ስምዎ' },
    icon: 'user',
    autocomplete: 'name',
    rules: { minLength: 1, maxLength: 100 },
    sensitive: false,
    private: false,
    voiceInput: true,
    needsReview: true,
  },
  location: {
    key: 'location',
    type: 'text',
    label: { en: 'City or town', am: 'ከተማ ወይም አካባቢ' },
    simpleLabel: { en: 'Where you live', am: 'የሚኖሩበት ቦታ' },
    icon: 'map-pin',
    autocomplete: 'address-level2',
    rules: { minLength: 1, maxLength: 100 },
    sensitive: true,
    private: false,
    voiceInput: true,
    needsReview: true,
  },
  address: {
    key: 'address',
    type: 'text',
    label: { en: 'Address', am: 'አድራሻ' },
    simpleLabel: { en: 'Your home place', am: 'የቤትዎ አድራሻ' },
    icon: 'home',
    autocomplete: 'street-address',
    rules: { minLength: 1, maxLength: 200 },
    sensitive: true,
    private: false,
    voiceInput: true,
    needsReview: true,
  },
  documentId: {
    key: 'documentId',
    type: 'text',
    label: { en: 'ID number', am: 'የመታወቂያ ቁጥር' },
    simpleLabel: { en: 'Number on your ID', am: 'በመታወቂያዎ ላይ ያለ ቁጥር' },
    icon: 'hash',
    autocomplete: 'off',
    rules: { minLength: 1, maxLength: 50 },
    sensitive: true,
    private: false,
    voiceInput: true,
    needsReview: true,
  },
  currentLevel: {
    key: 'currentLevel',
    type: 'choice',
    label: { en: 'Current level', am: 'አሁን ያሉበት ደረጃ' },
    simpleLabel: { en: 'How much do you know now?', am: 'አሁን ምን ያህል ያውቃሉ?' },
    icon: 'level',
    options: LEVEL_OPTIONS,
    optionsEditable: true,
    sensitive: false,
    private: false,
    voiceInput: true,
    needsReview: true,
  },
  identityRoute: {
    key: 'identityRoute',
    type: 'identityRoute',
    label: { en: 'How can we identify you?', am: 'እርስዎን እንዴት መለየት እንችላለን?' },
    simpleLabel: { en: 'Which paper do you have?', am: 'የትኛው ወረቀት አለዎት?' },
    icon: 'id-card',
    options: IDENTITY_ROUTES,
    noDeadEnd: true,
    sensitive: true,
    private: false,
    voiceInput: true,
    needsReview: true,
  },
  supportNeeds: {
    key: 'supportNeeds',
    type: 'multiChoice',
    label: { en: 'What support do you need?', am: 'ምን ድጋፍ ይፈልጋሉ?' },
    simpleLabel: { en: 'What help do you want?', am: 'ምን እርዳታ ይፈልጋሉ?' },
    notice: {
      en: 'You do not need to tell us about a disability or show any medical proof.',
      am: 'ስለ አካል ጉዳት መናገር ወይም የሕክምና ማስረጃ ማሳየት አያስፈልግዎትም።',
    },
    icon: 'help',
    optionsFrom: 'supportCatalog',
    skippable: true,
    sensitive: true,
    private: true,
    voiceInput: true,
    needsReview: true,
  },
  consent: {
    key: 'consent',
    type: 'consent',
    label: { en: 'Your permission', am: 'የእርስዎ ፈቃድ' },
    simpleLabel: { en: 'Is it OK?', am: 'ይስማማሉ?' },
    consentText: {
      en: 'I agree that this organisation can register me and share my answers with the service.',
      am: 'ይህ ድርጅት እኔን እንዲመዘግበኝ እና መልሶቼን ለአገልግሎቱ እንዲያጋራ እስማማለሁ።',
    },
    icon: 'check',
    sensitive: false,
    private: false,
    voiceInput: true,
    needsReview: true,
  },
  phone: {
    key: 'phone',
    type: 'phone',
    label: { en: 'Phone number', am: 'ስልክ ቁጥር' },
    simpleLabel: { en: 'Your phone number', am: 'የስልክ ቁጥርዎ' },
    icon: 'phone',
    autocomplete: 'tel',
    rules: { pattern: '^\\+?[0-9 ]{7,15}$' },
    sensitive: true,
    private: false,
    voiceInput: true,
    needsReview: true,
  },
};

export const FIELD_KEYS = Object.keys(fieldCatalog);

export function getField(key) {
  return fieldCatalog[key] ?? null;
}