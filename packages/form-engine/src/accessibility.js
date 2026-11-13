
/**
 * Accessibility Helpers
 *
 * Provides language and accessibility settings to the Frontend.
 * Actual speech, microphone access, and visual rendering
 * are handled by the Frontend.
 */

export const DEFAULT_ACCESSIBILITY_SETTINGS = {
  language: 'en',
  lowLiteracy: false,
  readAloud: false,
  readBack: true,
  largeText: false,
  voiceInput: true,
};

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

export function getQuestionContent(question, settings = {}) {
  const accessibility = createAccessibilitySettings(settings);

  const simpleLabel = accessibility.lowLiteracy
    ? question.simpleLabel
    : null;

  const label =
    getLocalizedText(simpleLabel, accessibility.language) ||
    getLocalizedText(question.label, accessibility.language);

  return {
    key: question.key,
    label,
    readAloudText:
      getLocalizedText(question.readAloudText, accessibility.language) ||
      label,
    icon: question.icon ?? null,
    language: accessibility.language,
    lowLiteracy: accessibility.lowLiteracy,
    readAloud: accessibility.readAloud,
    readBack: accessibility.readBack,
    largeText: accessibility.largeText,
    voiceInput: accessibility.voiceInput,
  };
}

export function getReadBackContent(answer, settings = {}) {
  const accessibility = createAccessibilitySettings(settings);

  const answerText =
    answer === null || answer === undefined
      ? ''
      : String(answer).trim();

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
