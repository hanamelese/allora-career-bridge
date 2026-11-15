import { useState } from 'react';
import { isSynthesisSupported, speak } from './speech.js';
import { useVoiceContext } from './voiceContext.js';
import { formatAnswerText } from '../src/accessibility.js';
import { VoiceAnswer } from './VoiceAnswer.jsx';

const COPY = {
  en: {
    read: 'Read my answer',
    readFor: (label) => `Read my answer to: ${label}`,
    clear: 'Clear',
    clearFor: (label) => `Clear my answer to: ${label}`,
    yourAnswer: (text) => `Your answer is: ${text}`,
    noAnswer: 'You have not answered this question yet.',
    cleared: 'Your answer was cleared.',
  },
  am: {
    read: 'መልሴን አንብብ',
    readFor: (label) => `የዚህን መልሴን አንብብ፦ ${label}`,
    clear: 'አጥፋ',
    clearFor: (label) => `የዚህን መልሴን አጥፋ፦ ${label}`,
    yourAnswer: (text) => `መልስዎ፦ ${text}`,
    noAnswer: 'ይህን ጥያቄ ገና አልመለሱም።',
    cleared: 'መልስዎ ጠፍቷል።',
  },
};

function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    value === false ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * The controls under every answer: speak it, hear it back, clear it.
 *
 * Each button carries the question in its accessible name, so a
 * screen-reader user moving through the page hears what it acts on.
 * Clearing returns focus to the answer, so the learner can start again
 * without hunting for where they were.
 */
export function AnswerTools({ question, value, language = 'en', onAnswer, onClear, onFocusField }) {
  const [status, setStatus] = useState('');
  const copy = COPY[language] ?? COPY.en;
  const { voice } = useVoiceContext();
  /* With the host's read-aloud service there is a voice even where the
     browser has none (Amharic, often). A password is never read out. */
  const canSpeak = (isSynthesisSupported() || Boolean(voice)) && question.type !== 'password';
  const empty = isEmpty(value);

  function readAnswer() {
    const text = empty
      ? copy.noAnswer
      : copy.yourAnswer(formatAnswerText(question, value, language));

    setStatus(text);
    /* The learner's own answer, in the same natural voice as the questions;
       marked private, so the read-aloud service never keeps it. */
    speak(text, { language, voice, private: true });
  }

  function clear() {
    onClear();
    setStatus(copy.cleared);
    onFocusField?.();
  }

  return (
    <div className="fe-tools">
      {question.voiceInput ? (
        <VoiceAnswer
          question={question}
          value={value}
          language={language}
          onAnswer={onAnswer}
          onFocusField={onFocusField}
        />
      ) : null}

      <div className="fe-tools__row">
        {canSpeak ? (
          <button
            type="button"
            className="fe-audio-button"
            aria-label={copy.readFor(question.label)}
            onClick={readAnswer}
          >
            <span aria-hidden="true">🔊</span>
            {copy.read}
          </button>
        ) : null}

        <button
          type="button"
          className="fe-audio-button"
          aria-label={copy.clearFor(question.label)}
          disabled={empty}
          onClick={clear}
        >
          <span aria-hidden="true">✕</span>
          {copy.clear}
        </button>
      </div>

      <p className="fe-tools__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
