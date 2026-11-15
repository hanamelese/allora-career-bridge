import { useEffect, useState } from 'react';
import { isSynthesisSupported, speak, stopSpeaking } from './speech.js';
import { useVoiceContext } from './voiceContext.js';

const LABELS = {
  en: { play: 'Read aloud', stop: 'Stop reading' },
  am: { play: 'ድምፅ ያድምጡ', stop: 'ማንበብ አቁም' },
};

/**
 * Plays a question as speech.
 *
 * It renders nothing at all when there is no voice to read with (no
 * read-aloud service and no speech synthesis in the browser), rather than
 * offering a button that would do nothing.
 */
export function ReadAloudButton({ text, language = 'en', autoPlay = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { voice } = useVoiceContext();
  /* With the host's read-aloud service, there is a voice even where the
     browser has none (Amharic, often). */
  const supported = isSynthesisSupported() || Boolean(voice);

  /* Stop whatever is being read when the question changes, so one question
     is never read over the top of the next. */
  useEffect(() => () => stopSpeaking(), [text]);

  useEffect(() => {
    if (!autoPlay || !supported || !text) return undefined;

    setIsPlaying(true);
    const stop = speak(text, { language, voice, onEnd: () => setIsPlaying(false) });

    return () => {
      stop();
      setIsPlaying(false);
    };
  }, [autoPlay, supported, text, language, voice]);

  if (!supported) return null;

  const labels = LABELS[language] ?? LABELS.en;

  function toggle() {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    speak(text, { language, voice, onEnd: () => setIsPlaying(false) });
  }

  return (
    <button type="button" className="fe-audio-button" onClick={toggle}>
      <span aria-hidden="true">{isPlaying ? '■' : '🔊'}</span>
      {isPlaying ? labels.stop : labels.play}
    </button>
  );
}
