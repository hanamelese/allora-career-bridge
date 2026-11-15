/**
 * React bindings for the form engine.
 *
 * Imported by the dashboard preview today and by the embedded widget
 * later, so both render a configuration the same way.
 */

export { FormRenderer } from './FormRenderer.jsx';
export { useFormEngine } from './useFormEngine.js';
export { ReadAloudButton } from './ReadAloudButton.jsx';
export { VoiceAnswer } from './VoiceAnswer.jsx';
export { AnswerTools } from './AnswerTools.jsx';
export { matchSpokenChoice, matchSpokenAlternatives } from './choiceMatch.js';
export {
  toSpeechLanguage,
  isRecognitionSupported,
  isSynthesisSupported,
  speak,
  speakAsync,
  stopSpeaking,
  splitForSpeech,
} from './speech.js';
export { useVoiceControl } from './VoiceControl.jsx';
export { parseCommand, tidyDictation } from './voiceCommands.js';
export { VoiceContext } from './voiceContext.js';
export { AccountForm } from './AccountForm.jsx';
export { clearProgress, progressKeyFor } from './progressStore.js';
export { FormSettings } from './FormSettings.jsx';
export { BrandIcon } from './brandIcons.jsx';
export { useLearnerPreferences, CONTRAST_LEVELS, TEXT_SIZES } from './learnerPreferences.js';
