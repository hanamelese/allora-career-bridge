
/**
 * Main Form Engine
 *
 * Connects question flow, answer management,
 * validation, and accessibility helpers.
 *
 * No network requests or persistent storage.
 */

import {
  fieldCatalog,
} from '@onboarding/contracts/fieldCatalog.js';

import {
  getVisibleQuestions,
  getFirstQuestion,
  getNextQuestion,
  getPreviousQuestion,
  isFirstQuestion,
  isLastQuestion,
} from './questionFlow.js';

import {
  createAnswerState,
  setAnswer,
  getAnswer,
  getAllAnswers,
  removeAnswer,
} from './answerManager.js';

import {
  validateSubmission,
  validateProgress,
} from './validation.js';

import {
  createAccessibilitySettings,
  getQuestionContent,
  getReadBackContent,
  updateAccessibilitySettings,
} from './accessibility.js';

export function createFormEngine(config, initialAnswers = {}, settings = {}) {
  let answers = createAnswerState(initialAnswers);
  let accessibility = createAccessibilitySettings(settings);

  const fields = (config.fields ?? [])
    .filter((field) => field.enabled !== false)
    .map((field) => ({
      ...(fieldCatalog[field.key] ?? {}),
      ...field,
    }))
    .concat(
      (config.customFields ?? [])
        .filter((field) => field.enabled !== false)
    );

  let currentQuestion = getFirstQuestion(fields, answers);

  const confirmedAnswers = new Set();

  function getCurrentQuestion() {
    if (!currentQuestion) {
      return null;
    }

    const visibleQuestions = getVisibleQuestions(fields, answers);

    const stillVisible = visibleQuestions.find(
      (question) => question.key === currentQuestion.key
    );

    if (!stillVisible) {
      currentQuestion = getFirstQuestion(fields, answers);
    }

    return currentQuestion
      ? getQuestionContent(currentQuestion, accessibility)
      : null;
  }

  function answerQuestion(fieldKey, value) {
    answers = setAnswer(answers, fieldKey, value);

    // A changed answer must be reviewed again.
    confirmedAnswers.delete(fieldKey);

    const visibleQuestions = getVisibleQuestions(fields, answers);

    if (
      !visibleQuestions.some(
        (question) => question.key === currentQuestion?.key
      )
    ) {
      currentQuestion = getFirstQuestion(fields, answers);
    }

    return getAllAnswers(answers);
  }

  function getReadBack(fieldKey) {
    if (!accessibility.readBack) {
      return '';
    }

    return getReadBackContent(
      getAnswer(answers, fieldKey),
      accessibility
    );
  }

  function confirmAnswer(fieldKey) {
    const value = getAnswer(answers, fieldKey);

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    ) {
      return false;
    }

    confirmedAnswers.add(fieldKey);

    return true;
  }

  function editAnswer(fieldKey, newValue) {
    return answerQuestion(fieldKey, newValue);
  }

  function isAnswerConfirmed(fieldKey) {
    return confirmedAnswers.has(fieldKey);
  }

  function goNext() {
    if (!currentQuestion) {
      return null;
    }

    const nextQuestion = getNextQuestion(
      fields,
      currentQuestion.key,
      answers
    );

    if (nextQuestion) {
      currentQuestion = nextQuestion;
    }

    return getCurrentQuestion();
  }

  function goBack() {
    if (!currentQuestion) {
      return null;
    }

    const previousQuestion = getPreviousQuestion(
      fields,
      currentQuestion.key,
      answers
    );

    if (previousQuestion) {
      currentQuestion = previousQuestion;
    }

    return getCurrentQuestion();
  }

  function updateSettings(updates) {
    accessibility = updateAccessibilitySettings(
      accessibility,
      updates
    );

    return { ...accessibility };
  }

  function getStatus() {
    return {
      currentQuestion: getCurrentQuestion(),
      isFirst: currentQuestion
        ? isFirstQuestion(fields, currentQuestion.key, answers)
        : true,
      isLast: currentQuestion
        ? isLastQuestion(fields, currentQuestion.key, answers)
        : true,
      answers: getAllAnswers(answers),
      settings: { ...accessibility },
    };
  }

  return {
    getCurrentQuestion,
    answerQuestion,
    getAnswer: (fieldKey) => getAnswer(answers, fieldKey),
    getAllAnswers: () => getAllAnswers(answers),

    getReadBack,
    confirmAnswer,
    editAnswer,
    isAnswerConfirmed,

    removeAnswer: (fieldKey) => {
      confirmedAnswers.delete(fieldKey);
      answers = removeAnswer(answers, fieldKey);
      return getAllAnswers(answers);
    },

    goNext,
    goBack,
    getStatus,

    validateSubmission: () => validateSubmission(config, answers),
    validateProgress: () => validateProgress(config, answers),

    updateSettings,
  };
}
