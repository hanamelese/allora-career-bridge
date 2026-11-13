/**
 * @onboarding/form-engine
 *
 * Headless form engine: it turns a validated form config into an ordered
 * set of questions, holds answers, and validates them. It renders nothing
 * and performs no network or storage access, which is what lets the
 * dashboard preview and the embedded form share one implementation.
 */

export { createFormEngine } from './formEngine.js';

export {
  getVisibleQuestions,
  getFirstQuestion,
  getNextQuestion,
  getPreviousQuestion,
  isFirstQuestion,
  isLastQuestion,
} from './questionFlow.js';

export {
  createAnswerState,
  setAnswer,
  getAnswer,
  updateAnswer,
  removeAnswer,
  getAllAnswers,
} from './answerManager.js';

export {
  validateSubmission,
  validateProgress,
} from './validation.js';

export {
  DEFAULT_ACCESSIBILITY_SETTINGS,
  createAccessibilitySettings,
  getLocalizedText,
  getQuestionContent,
  getReadBackContent,
  updateAccessibilitySettings,
} from './accessibility.js';
