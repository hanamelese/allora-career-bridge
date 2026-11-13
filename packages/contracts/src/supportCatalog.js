
export const supportCatalog = [
  {
    key: 'readAloud',
    en: 'Read questions aloud',
    am: 'ጥያቄዎችን በድምፅ ማንበብ',
    simpleLabel: {
      en: 'Read to me',
      am: 'አንብብልኝ',
    },
    icon: 'volume-2',
  },
  {
    key: 'voiceInput',
    en: 'Voice input',
    am: 'በድምፅ መልስ መስጠት',
    simpleLabel: {
      en: 'Let me speak',
      am: 'በድምፅ ልናገር',
    },
    icon: 'mic',
  },
  {
    key: 'largeText',
    en: 'Large text',
    am: 'ትልቅ ፊደል',
    simpleLabel: {
      en: 'Bigger words',
      am: 'ትልቅ ፊደል',
    },
    icon: 'type',
  },
  {
    key: 'moreTime',
    en: 'More time',
    am: 'ተጨማሪ ጊዜ',
    simpleLabel: {
      en: 'Give me more time',
      am: 'ተጨማሪ ጊዜ ስጠኝ',
    },
    icon: 'clock',
  },
  {
    key: 'stepByStepHelp',
    en: 'Step-by-step help',
    am: 'ደረጃ በደረጃ እርዳታ',
    simpleLabel: {
      en: 'Help me step by step',
      am: 'ደረጃ በደረጃ እርዳኝ',
    },
    icon: 'list-ordered',
  },
  {
    key: 'humanHelp',
    en: 'A person to help me',
    am: 'የሚረዳኝ ሰው',
    simpleLabel: {
      en: 'I need a person to help',
      am: 'የሚረዳኝ ሰው እፈልጋለሁ',
    },
    icon: 'user-round',
  },
];

export const SUPPORT_KEYS = supportCatalog.map(
  (item) => item.key
);
