/**
 * Web Speech, wrapped.
 *
 * Speech is treated as an optional aid throughout: every function here
 * reports whether it is available, and the typed path must keep working
 * when it is not. Support for Amharic in particular varies between
 * browsers and devices.
 */

/** The i18n language codes the form uses, as speech expects them. */
const SPEECH_LANGUAGES = {
  en: 'en-US',
  am: 'am-ET',
};

export function toSpeechLanguage(language) {
  return SPEECH_LANGUAGES[language] ?? SPEECH_LANGUAGES.en;
}

function getRecognitionConstructor() {
  if (typeof window === 'undefined') return null;

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function isRecognitionSupported() {
  return getRecognitionConstructor() !== null;
}

export function isSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Start listening for one answer.
 *
 * Returns a handle with `stop()`, or null when recognition is unavailable.
 * The instance is held by the handle rather than in module state, so two
 * controls on one screen cannot silently cancel each other.
 */
export function startListening({ language = 'en', onResult, onError, onEnd }) {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.lang = toSpeechLanguage(language);
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (event) => {
    const result = event.results?.[0];
    if (!result) return;

    /* Alternatives and confidence are passed on rather than discarded, so
       the caller can ask instead of assuming when a match is weak. */
    const alternatives = Array.from(result)
      .map((alternative) => ({
        transcript: alternative.transcript?.trim() ?? '',
        confidence: alternative.confidence ?? 0,
      }))
      .filter((alternative) => alternative.transcript);

    if (alternatives.length > 0) {
      onResult?.(alternatives[0].transcript, alternatives);
    }
  };

  recognition.onerror = (event) => {
    onError?.(event.error ?? 'speech-error');
  };

  recognition.onend = () => {
    onEnd?.();
  };

  try {
    recognition.start();
  } catch {
    onError?.('could-not-start');
    return null;
  }

  return {
    stop() {
      try {
        recognition.stop();
      } catch {
        /* Already stopped. */
      }
    },
  };
}

/**
 * Read text aloud. Returns a function that stops it again.
 *
 * Anything already speaking is cancelled first, so questions never stack
 * up on top of one another.
 */
export function speak(text, { language = 'en', onEnd } = {}) {
  if (!isSynthesisSupported() || !text) {
    onEnd?.();
    return () => {};
  }

  window.speechSynthesis.cancel();

  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = toSpeechLanguage(language);
  utterance.rate = 0.95;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}

export function stopSpeaking() {
  if (isSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
