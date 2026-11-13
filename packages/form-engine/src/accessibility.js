/**
 * Accessibility Helpers
 *
 * Turns a merged field definition into everything a renderer needs to draw
 * one question: its wording in the chosen language, its help text, its
 * answer options, and which assistance applies.
 *
 * It still renders nothing. Speech, microphone access and markup belong to
 * the React layer; deciding *what* a question says belongs here, so the
 * dashboard preview and the embedded form can never word it differently.
 */

import { getCatalogItems } from '@onboarding/contracts/optionCatalogs.js';

export const DEFAULT_ACCESSIBILITY_SETTINGS = {
  language: 'en',
  lowLiteracy: false,
  readAloud: false,
  readBack: true,
  largeText: false,
  voiceInput: true,
};

/* A yes/no question has no options of its own; the answer is a boolean. */
const YES_NO_OPTIONS = [
  { value: true, label: { en: 'Yes', am: 'አዎ' } },
  { value: false, label: { en: 'No', am: 'አይደለም' } },
];

export function createAccessibilitySettings(settings = {}) {
  return {
    ...DEFAULT_ACCESSIBILITY_SETTINGS,
    ...settings,
  };
}

export function getLocalizedText(value, language = 'en') {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  return value[language] ?? value.en ?? '';
}

/**
 * The wording of one answer option.
 *
 * Three shapes reach this function and all three are normalised here, so
 * nothing downstream has to know which catalogue an option came from:
 * catalogue option sets use `label`, the support and accommodation
 * catalogues carry `en`/`am` directly, and a partner's custom options use
 * `value` instead of `key`.
 */
function getOptionLabel(option, language, lowLiteracy) {
  if (lowLiteracy) {
    const simple = getLocalizedText(option.simpleLabel, language);
    if (simple) return simple;
  }

  const labelled = getLocalizedText(option.label, language);
  if (labelled) return labelled;

  return option[language] ?? option.en ?? '';
}

function normalizeOption(option, language, lowLiteracy) {
  return {
    value: option.key ?? option.value,
    label: getOptionLabel(option, language, lowLiteracy),
    icon: option.icon ?? null,
  };
}

/**
 * The options a learner may choose from.
 *
 * `config` is needed for identity routes, because a partner chooses which
 * documents their form accepts - minus "no document", which the shared
 * schema never lets them remove.
 */
export function resolveOptions(question, settings = {}, config = null) {
  const { language, lowLiteracy } = createAccessibilitySettings(settings);

  switch (question.type) {
    case 'yesNo':
      return YES_NO_OPTIONS.map((option) => normalizeOption(option, language, lowLiteracy));

    case 'multiChoice':
      return getCatalogItems(question.optionsFrom).map((item) =>
        normalizeOption(item, language, lowLiteracy),
      );

    case 'identityRoute': {
      const allowed = config?.identityRoutes ?? null;

      return (question.options ?? [])
        .filter((route) => !allowed || allowed.includes(route.key))
        .map((route) => normalizeOption(route, language, lowLiteracy));
    }

    case 'choice':
      return (question.options ?? []).map((option) =>
        normalizeOption(option, language, lowLiteracy),
      );

    default:
      return [];
  }
}

/** Everything needed to render one question. */
export function getQuestionContent(question, settings = {}, config = null) {
  const accessibility = createAccessibilitySettings(settings);
  const { language, lowLiteracy } = accessibility;

  const simpleLabel = lowLiteracy ? question.simpleLabel : null;

  const label =
    getLocalizedText(simpleLabel, language) || getLocalizedText(question.label, language);

  const helpText = getLocalizedText(question.helpText, language) || null;
  const notice = getLocalizedText(question.notice, language) || null;
  const consentText = getLocalizedText(question.consentText, language) || null;

  /* Read aloud covers the question and anything printed with it, which is
     what a learner relying on audio would otherwise miss. */
  const readAloudText =
    getLocalizedText(question.readAloudText, language) ||
    [label, consentText, helpText, notice].filter(Boolean).join('. ');

  return {
    key: question.key,
    type: question.type ?? 'text',
    label,
    helpText,
    notice,
    consentText,
    readAloudText,
    required: question.required === true,
    skippable: question.skippable === true,
    autocomplete: question.autocomplete ?? 'off',
    rules: question.rules ?? null,
    options: resolveOptions(question, accessibility, config),
    isPrivate: question.visibility === 'private' || question.private === true,
    icon: question.icon ?? null,
    language,
    lowLiteracy,
    readAloud: accessibility.readAloud,
    readBack: accessibility.readBack,
    largeText: accessibility.largeText,
    /* Voice needs the form-level setting, and the question must not have
       opted out of it. */
    voiceInput: accessibility.voiceInput && question.voiceInput !== false,
  };
}

/**
 * An answer as a learner would say it, for the review step and read-aloud.
 *
 * Takes a question already resolved by `getQuestionContent`, so the option
 * wording is the wording that was on screen.
 */
export function formatAnswerText(question, value, language = 'en') {
  const notAnswered = { en: 'Not answered', am: 'አልተመለሰም' };

  const isEmpty =
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    return notAnswered[language] ?? notAnswered.en;
  }

  const labelFor = (optionValue) =>
    question.options?.find((option) => option.value === optionValue)?.label ??
    String(optionValue);

  if (Array.isArray(value)) {
    return value.map(labelFor).join(', ');
  }

  if (typeof value === 'boolean') {
    const yesNo = { en: value ? 'Yes' : 'No', am: value ? 'አዎ' : 'አይደለም' };
    return question.options?.length ? labelFor(value) : yesNo[language] ?? yesNo.en;
  }

  return question.options?.length ? labelFor(value) : String(value);
}

export function getReadBackContent(answer, settings = {}) {
  const accessibility = createAccessibilitySettings(settings);

  const answerText =
    answer === null || answer === undefined ? '' : String(answer).trim();

  if (!answerText) {
    return '';
  }

  const messages = {
    en: `You said: ${answerText}. Is this correct?`,
    am: `ያሉት፦ ${answerText}። ትክክል ነው?`,
  };

  return messages[accessibility.language] ?? messages.en;
}

export function updateAccessibilitySettings(currentSettings, updates) {
  return createAccessibilitySettings({
    ...currentSettings,
    ...updates,
  });
}
