
/**
 * Question Flow
 *
 * Controls the order of questions in a form.
 * This module does not display UI or store data.
 *
 * Visibility comes from the shared contracts helper, so the question a
 * learner is shown and the question validation demands are decided by one
 * piece of code.
 */

import { isFieldVisible } from '@onboarding/contracts/fieldVisibility.js';

export function getVisibleQuestions(fields, answers = {}) {
  return fields.filter((field) => isFieldVisible(field, answers));
}

export function getFirstQuestion(fields, answers = {}) {
  const questions = getVisibleQuestions(fields, answers);

  return questions[0] ?? null;
}

export function getNextQuestion(fields, currentKey, answers = {}) {
  const questions = getVisibleQuestions(fields, answers);

  const currentIndex = questions.findIndex(
    (question) => question.key === currentKey
  );

  if (currentIndex === -1 || currentIndex === questions.length - 1) {
    return null;
  }

  return questions[currentIndex + 1];
}

export function getPreviousQuestion(fields, currentKey, answers = {}) {
  const questions = getVisibleQuestions(fields, answers);

  const currentIndex = questions.findIndex(
    (question) => question.key === currentKey
  );

  if (currentIndex <= 0) {
    return null;
  }

  return questions[currentIndex - 1];
}

export function isFirstQuestion(fields, currentKey, answers = {}) {
  const firstQuestion = getFirstQuestion(fields, answers);

  return firstQuestion?.key === currentKey;
}

export function isLastQuestion(fields, currentKey, answers = {}) {
  return getNextQuestion(fields, currentKey, answers) === null;
}
