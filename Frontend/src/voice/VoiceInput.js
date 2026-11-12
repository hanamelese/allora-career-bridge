import { isSpeechSupported, createSpeechRecognizer, speakReadback, stopReadback } from './webSpeech';
import { hasVoiceConsent, setVoiceConsent } from './consent';

let activeRecognition = null;

/**
 * VoiceInput controller: Coordinates speech recognition, consent, and read-back.
 */
export class VoiceInputController {
  constructor(options = {}) {
    this.lang = options.lang || 'en-US';
    this.isMock = Boolean(options.isMock);
  }

  canListen() {
    return this.isMock || isSpeechSupported();
  }

  requiresConsent() {
    return !this.isMock && !hasVoiceConsent();
  }

  grantConsent() {
    setVoiceConsent(true);
  }

  denyConsent() {
    setVoiceConsent(false);
  }

  listen({ onResult, onError, onStart, onEnd }) {
    this.stop();

    // Mock speech mode for testing
    if (this.isMock) {
      if (onStart) onStart();
      setTimeout(() => {
        if (onResult) onResult('Sara Ahmed');
        if (onEnd) onEnd();
      }, 700);
      return;
    }

    if (!hasVoiceConsent()) {
      if (onError) onError('Voice consent required.');
      return;
    }

    activeRecognition = createSpeechRecognizer({
      lang: this.lang,
      onResult: (transcript) => {
        if (onResult) onResult(transcript);
      },
      onError: (err) => {
        if (onError) onError(err);
      },
      onEnd: () => {
        activeRecognition = null;
        if (onEnd) onEnd();
      }
    });

    if (activeRecognition) {
      try {
        activeRecognition.start();
        if (onStart) onStart();
      } catch (e) {
        if (onError) onError(e.message || 'Could not start microphone.');
      }
    }
  }

  stop() {
    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch (e) {
        // Ignore stop error
      }
      activeRecognition = null;
    }
  }

  readBack(text, onEnd) {
    speakReadback(text, this.lang, onEnd);
  }

  stopAudio() {
    stopReadback();
  }
}

export default VoiceInputController;
