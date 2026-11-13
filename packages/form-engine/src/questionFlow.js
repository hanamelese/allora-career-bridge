
/**
 * Question Flow
 *
 * Controls the order of questions in a form.
 * This module does not display UI or store data.
 */

function isQuestionVisible(question, answers = {}) {
  if (question.enabled === false) {
    return false;
  }

  if (!question.showIf) {
    return true;
  }

  const { field, equals } = question.showIf;

  return answers[field] === equals;
}

export function getVisibleQuestions(fields, answers = {}) {
  return fields.filter((field) =>
    isQuestionVisible(field, answers)
  );
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
