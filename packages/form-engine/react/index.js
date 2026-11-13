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
export { matchSpokenChoice } from './choiceMatch.js';
export {
  toSpeechLanguage,
  isRecognitionSupported,
  isSynthesisSupported,
  speak,
  stopSpeaking,
} from './speech.js';
