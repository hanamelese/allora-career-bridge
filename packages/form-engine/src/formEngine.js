
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
  validateAnswer,
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
      ? getQuestionContent(currentQuestion, accessibility, config)
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

  /* Jump straight to one question, if it is currently being asked. */
  function goTo(fieldKey) {
    const target = getVisibleQuestions(fields, answers).find(
      (question) => question.key === fieldKey
    );

    if (target) {
      currentQuestion = target;
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

  /* Where the learner is, counted over the questions actually visible -
     a conditional question that does not apply is not part of the total. */
  function getProgress() {
    const visibleQuestions = getVisibleQuestions(fields, answers);
    const index = visibleQuestions.findIndex(
      (question) => question.key === currentQuestion?.key
    );

    return {
      index: index === -1 ? 0 : index,
      position: index === -1 ? 1 : index + 1,
      total: visibleQuestions.length,
    };
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
      progress: getProgress(),
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
    goTo,
    getStatus,
    getProgress,

    /* The questions a learner will actually be asked, in order - the
       review step needs the whole list, not just the current one. */
    getVisibleQuestions: () =>
      getVisibleQuestions(fields, answers).map((question) =>
        getQuestionContent(question, accessibility, config)
      ),

    validateSubmission: () => validateSubmission(config, answers, accessibility.language),
    validateProgress: () => validateProgress(config, answers, accessibility.language),
    validateAnswer: (fieldKey) =>
      validateAnswer(config, fieldKey, answers, accessibility.language),

    updateSettings,
  };
}
