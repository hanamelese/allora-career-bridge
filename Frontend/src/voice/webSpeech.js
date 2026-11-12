const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

/**
 * Checks whether speech recognition is supported in this browser.
 */
export function isSpeechSupported() {
  return Boolean(SpeechRecognition);
}

/**
 * Checks whether text-to-speech (read-back) is supported.
 */
export function isSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Reads back text aloud so the learner can verify what was heard.
 */
export function speakReadback(text, lang = 'en-US', onEnd) {
  if (!isSynthesisSupported() || !text) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95; // Slightly slower for clarity
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any ongoing audio read-back.
 */
export function stopReadback() {
  if (isSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Creates and starts a speech recognition session.
 */
export function createSpeechRecognizer({ lang = 'en-US', onResult, onError, onEnd }) {
  if (!SpeechRecognition) {
    if (onError) onError('Speech recognition is not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    if (event.results && event.results[0] && event.results[0][0]) {
      const transcript = event.results[0][0].transcript.trim();
      if (onResult) onResult(transcript);
    }
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error || 'Speech error');
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}

export default {
  isSpeechSupported,
  isSynthesisSupported,
  speakReadback,
  stopReadback,
  createSpeechRecognizer
};
