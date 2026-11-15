/* The Configure view: choosing a form's questions and settings. */
export default {
  page: {
    problemsHeading: 'This form cannot be published yet',
    accountTitle: 'Sign-in options',
    accountDescription: "The form's title, and the ways people can sign up or sign in.",
    fieldsTitle: 'Questions this form asks',
    fieldsDescription: (count) =>
      `${count} ${count === 1 ? 'question is' : 'questions are'} switched on. Questions marked "Always on" are needed for the form to work and cannot be removed.`,
    supportTitle: 'Support and accommodations',
    supportDescription:
      'Asked in a section of their own, marked private. Answers are never shared with employers, people are never asked for medical proof, and nobody has to say why they need something.',
    accommodationTitle: 'Workplace accessibility and accommodations',
    accommodationDescription:
      "Asked in a section of their own. Unlike a learner's support needs these answers are not private: candidates see them, so they can tell whether a job will work for them.",
    customTitle: 'Questions you added',
    customDescriptionAccount:
      'Your own questions are asked when someone creates an account, after the standard ones. Signing in only ever asks for an email address and password. They can be short written answers, a choice from a list, or yes and no.',
    customDescription:
      'Your own questions are asked after the standard ones. They can be short written answers, a choice from a list, or yes and no.',
    customEmptyTitle: 'You have not added any questions',
    customEmptyDescription:
      'Add one below if your organisation needs something the standard questions do not cover.',
    languageTitle: 'Language',
    identityTitle: 'How learners can identify themselves',
    identityDescription:
      'Choose which documents this form accepts. Learners without any of them still have a way through.',
  },

  /* Shared by the question rows. */
  field: {
    private: 'Private',
    alwaysOn: 'Always on',
    ask: 'Ask this question',
    required: 'An answer is required',
    detailsFile: 'Wording, upload restrictions and privacy',
    detailsVoice: 'Wording, privacy and voice',
    detailsCustom: 'Wording, privacy and options',
    wording: 'Question wording',
    english: 'English',
    amharic: 'Amharic',
    labelEnHelp: 'Leave blank to use the standard wording.',
    labelAmHelp: 'Leave blank to use the reviewed Amharic translation.',
    helpText: 'Help text',
    helpPlaceholder: 'Optional guidance shown under the question',
    fallsBackToEnglish: 'Falls back to English',
    uploadRestrictions: 'Upload restrictions',
    answerOptions: 'Answer options',
    privacyAndVoice: 'Privacy and voice',
    privacy: 'Privacy',
    alwaysPrivate:
      'Answers to this question are always private. They are never included in the answers shared with your organisation or with an employer.',
    keepPrivate: 'Keep answers to this question private',
    keepPrivateDescription:
      'Private answers are left out of the data shared with your organisation and with employers.',
    voiceAlways: 'Learners can always answer this question by speaking, as well as by typing.',
    voiceNever: 'This question cannot be answered by voice, so voice input is not offered for it.',
    addedByYou: 'added by your organisation',
    removeQuestion: (label) => `Remove the question "${label}"`,
  },

  options: {
    add: 'Add an option',
    remove: (label) => `Remove the option "${label}"`,
  },

  upload: {
    summary: (types, maxSizeMb) => `Applicants can upload a ${types} file, up to ${maxSizeMb} MB.`,
    or: 'or',
    maxSize: 'Largest file, in MB',
    maxSizeHelp: (max) => `From 1 to ${max}. Leave blank to allow the most, ${max} MB.`,
    kinds: 'Kinds of file accepted',
    atLeastOne: 'At least one kind of file must stay allowed.',
    note: 'Files are checked in the applicant’s browser and passed to your website with the other answers when they send the form. This system does not store them.',
  },

  custom: {
    types: {
      text: 'Short written answer',
      choice: 'Choose one from a list',
      yesNo: 'Yes or no',
    },
    errorNoEnglish: 'Write the question in English first. Amharic is optional.',
    errorNoLetters: 'Use at least one letter or number in the English question.',
    errorNoOptions: 'A question with a list of answers needs at least one option.',
    labelEn: 'Question in English',
    labelEnPlaceholder: 'For example: Preferred contact time',
    labelAm: 'Question in Amharic (optional)',
    labelAmHelp: 'Left blank, learners reading in Amharic see the English wording.',
    type: 'Kind of answer',
    options: 'Answer options',
    optionsHelp: 'One option per line.',
    required: 'An answer is required',
    private: 'Keep answers private',
    add: 'Add this question',
  },

  language: {
    label: 'Language the form opens in',
    english: 'English',
    amharic: 'Amharic (አማርኛ)',
    help: 'Learners can switch language at any point while filling the form in.',
  },

  identity: {
    alwaysOffered:
      'Always offered, and it leads to the referral step. A learner must never reach a dead end because they have no paperwork.',
  },

  account: {
    formTitle: 'Form title',
    formTitleHint: 'Sign up and sign in work the same way, so one form covers both. Choose which this one is.',
    modes: {
      signUp: {
        label: 'Sign up',
        description: 'For new people. Asks for their name as well as an email and password.',
      },
      signIn: {
        label: 'Sign in',
        description: 'For people who already have an account. Asks for email and password only.',
      },
    },
    emailPassword: 'Email and password',
    emailPasswordDescription:
      'People type an email address and password. They are passed to your sign-in system and never stored here.',
    providers: 'Sign in with another account',
    providersHint:
      'Each button opens the address you give, usually where your own site starts signing in with that service. Screen readers announce each one as, for example, “Sign up with Google, link”.',
    providerAddress: (name) => `${name} sign-in address`,
    httpsHelp: 'Must start with https://',
  },

  /* Why a question is always on. The English is LOCK_REASONS in
     @onboarding/contracts; only the Amharic file has entries here, keyed
     `lockReasons.<form type>.<field key>`, and anything missing falls back
     to the contract's text. */
  lockReasons: {},
};
