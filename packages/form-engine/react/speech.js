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

  /* Recognition can end without a result and without an error - the
     learner said nothing, or it heard only noise. That is reported as
     'no-speech', so the learner is told rather than left waiting. */
  let settled = false;

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
      settled = true;
      onResult?.(alternatives[0].transcript, alternatives);
    }
  };

  recognition.onerror = (event) => {
    settled = true;
    /* 'aborted' is our own stop(); it is not a failure to report. */
    if (event.error !== 'aborted') onError?.(event.error ?? 'speech-error');
  };

  recognition.onend = () => {
    if (!settled) onError?.('no-speech');
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
      settled = true;
      try {
        recognition.stop();
      } catch {
        /* Already stopped. */
      }
    },
  };
}

/* What is speaking now, so anything new stops it first and questions
   never stack up on top of one another. */
let current = null;

/**
 * Splits text into pieces of at most `max` characters, at sentence ends
 * where it can (including the Amharic full stop ።), so a long question is
 * spoken whole rather than cut off by the speech service's limit.
 */
export function splitForSpeech(text, max = 400) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?።]+[.!?።]*\s*/g) ?? [clean];
  const pieces = [];
  let piece = '';

  for (const sentence of sentences) {
    if (piece && (piece + sentence).length > max) {
      pieces.push(piece.trim());
      piece = '';
    }
    let rest = sentence;
    while (rest.length > max) {
      pieces.push(rest.slice(0, max).trim());
      rest = rest.slice(max);
    }
    piece += rest;
  }
  if (piece.trim()) pieces.push(piece.trim());
  return pieces;
}

function speakWithBrowser(text, language, token, finish) {
  if (!isSynthesisSupported()) {
    finish();
    return;
  }
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = toSpeechLanguage(language);
  utterance.rate = 0.95;
  utterance.onend = finish;
  utterance.onerror = finish;
  token.browser = true;
  window.speechSynthesis.speak(utterance);
}

function playBlob(blob, token) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    token.audio = audio;
    const done = (error) => {
      URL.revokeObjectURL(url);
      if (token.audio === audio) token.audio = null;
      if (error) reject(error);
      else resolve();
    };
    audio.onended = () => done();
    audio.onerror = () => done(new Error('audio-error'));
    audio.play().catch(done);
  });
}

/**
 * Read text aloud. Returns a function that stops it again.
 *
 * - `voice(text, language, { private }) -> Promise<Blob>` is the form's
 *   read-aloud service (the Bridge's speech route): natural voices,
 *   including Amharic, which most browsers lack. If it is missing or
 *   fails, the browser's own voice reads the rest.
 * - `private: true` marks a learner's own answer ("Read my answer", what
 *   was heard): it is read by the same voices, and the service speaks it
 *   without caching or logging it. A password is never passed here.
 *
 * `onEnd` is called once, when it finishes, fails or is stopped.
 */
export function speak(text, { language = 'en', onEnd, voice = null, private: isPrivate = false } = {}) {
  stopSpeaking();

  const token = { stopped: false, audio: null, browser: false, done: false };
  const finish = () => {
    if (token.done) return;
    token.done = true;
    if (current === token) current = null;
    onEnd?.();
  };
  token.finish = finish;

  if (!text || (!voice && !isSynthesisSupported())) {
    finish();
    return () => {};
  }
  current = token;

  if (!voice) {
    speakWithBrowser(text, language, token, finish);
  } else {
    (async () => {
      const pieces = splitForSpeech(text);
      for (let index = 0; index < pieces.length; index += 1) {
        if (token.stopped) return;
        try {
          const blob = await voice(pieces[index], language, { private: isPrivate });
          if (token.stopped) return;
          await playBlob(blob, token);
        } catch {
          if (token.stopped) return;
          /* The service is down or the audio would not play: the browser
             reads what is left. */
          speakWithBrowser(pieces.slice(index).join(' '), language, token, finish);
          return;
        }
      }
      finish();
    })();
  }

  return () => {
    if (current === token) stopSpeaking();
  };
}

/** Like speak(), as a promise that settles when the speaking ends. */
export function speakAsync(text, options = {}) {
  return new Promise((resolve) => {
    speak(text, { ...options, onEnd: resolve });
  });
}

export function stopSpeaking() {
  const token = current;
  current = null;
  if (token) {
    token.stopped = true;
    token.audio?.pause();
  }
  if (isSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
  token?.finish?.();
}

/** Whether anything is being read aloud right now. */
export function isSpeaking() {
  return current !== null;
}
