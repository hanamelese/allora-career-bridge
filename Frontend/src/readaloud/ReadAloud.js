let activeAudio = null;

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopAudio() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch (e) {}
    activeAudio = null;
  }

  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function playReadAloud({ text, audioKey, lang = 'en-US', onEnd }) {
  stopAudio();

  const handleFinish = () => {
    stopAudio();
    if (onEnd) onEnd();
  };

  // 1. Try pre-recorded human audio file first
  if (audioKey) {
    const langFolder = lang.startsWith('am') ? 'am' : 'en';
    const audioSrc = `/audio/${langFolder}/${audioKey}.opus`;
    const audio = new Audio(audioSrc);

    audio.onended = handleFinish;
    audio.onerror = () => {
      fallbackToSpeech(text, lang, handleFinish);
    };

    activeAudio = audio;
    audio.play().catch(() => {
      fallbackToSpeech(text, lang, handleFinish);
    });
    return;
  }

  // 2. Fallback to browser text-to-speech
  fallbackToSpeech(text, lang, handleFinish);
}

function fallbackToSpeech(text, lang, onEnd) {
  if (!isSpeechSynthesisSupported() || !text) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

export default {
  playReadAloud,
  stopAudio,
  isSpeechSynthesisSupported
};
