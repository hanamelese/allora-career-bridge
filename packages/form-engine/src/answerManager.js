
/**
 * Answer Manager
 *
 * Manages form answers in memory.
 * Does not use localStorage, a database, or a network.
 */

export function createAnswerState(initialAnswers = {}) {
  return { ...initialAnswers };
}

export function setAnswer(answers, fieldKey, value) {
  return {
    ...answers,
    [fieldKey]: value,
  };
}

export function getAnswer(answers, fieldKey) {
  return answers[fieldKey];
}

export function updateAnswer(answers, fieldKey, value) {
  return setAnswer(answers, fieldKey, value);
}

export function removeAnswer(answers, fieldKey) {
  const updatedAnswers = { ...answers };

  delete updatedAnswers[fieldKey];

  return updatedAnswers;
}

export function getAllAnswers(answers) {
  return { ...answers };
}
