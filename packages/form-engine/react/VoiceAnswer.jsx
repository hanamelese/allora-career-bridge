import { useEffect, useRef, useState } from 'react';
import { isRecognitionSupported, speak, startListening, stopSpeaking } from './speech.js';
import { matchSpokenAlternatives } from './choiceMatch.js';
import { useVoiceContext } from './voiceContext.js';

const COPY = {
  en: {
    speak: 'Answer by speaking',
    listening: 'Listening… speak now',
    stop: 'Stop listening',
    heard: 'We heard',
    wroteIt: (text) => `We wrote what you said: "${text}". You can change it in the box above.`,
    selected: (label) => `Selected: ${label}. If that is not right, choose another answer or speak again.`,
    added: (label) => `Added: ${label}. If that is not right, untick it or speak again.`,
    didYouMean: (label) => `Did you mean "${label}"?`,
    several: (labels) => `That could mean more than one answer: ${labels}. Please speak again, or choose one above.`,
    use: 'Yes, use this',
    retry: 'No, try again',
    noMatch: (text) => `We heard "${text}", but it did not match any of the answers. Please speak again, or choose one above.`,
    noSpeech: 'We did not hear anything. Press the button and speak again, or answer above.',
    denied: 'The microphone is blocked. Allow microphone use in your browser to answer by speaking, or answer above.',
    noMic: 'No microphone was found. You can still answer above.',
    language: 'Speaking is not available in this language on this device. You can still answer above.',
    failed: 'Speaking did not work this time. Please try again, or answer above.',
    unavailable: 'Speaking is not available in this browser. You can still answer above.',
  },
  am: {
    speak: 'በድምፅ ይመልሱ',
    listening: 'በማዳመጥ ላይ… አሁን ይናገሩ',
    stop: 'ማዳመጥ አቁም',
    heard: 'የሰማነው',
    wroteIt: (text) => `ያሉትን ጽፈናል፦ "${text}"። ከላይ ባለው ሳጥን ውስጥ መቀየር ይችላሉ።`,
    selected: (label) => `ተመርጧል፦ ${label}። ትክክል ካልሆነ ሌላ መልስ ይምረጡ ወይም እንደገና ይናገሩ።`,
    added: (label) => `ታክሏል፦ ${label}። ትክክል ካልሆነ ምልክቱን ያንሱ ወይም እንደገና ይናገሩ።`,
    didYouMean: (label) => `"${label}" ማለትዎ ነው?`,
    several: (labels) => `ይህ ከአንድ በላይ መልስ ሊሆን ይችላል፦ ${labels}። እባክዎ እንደገና ይናገሩ ወይም ከላይ አንዱን ይምረጡ።`,
    use: 'አዎ፣ ይህንን ተጠቀም',
    retry: 'አይደለም፣ እንደገና ይሞክሩ',
    noMatch: (text) => `"${text}" ሰምተናል፣ ግን ከመልሶቹ ጋር አልተዛመደም። እባክዎ እንደገና ይናገሩ ወይም ከላይ አንዱን ይምረጡ።`,
    noSpeech: 'ምንም አልሰማንም። ቁልፉን ተጭነው እንደገና ይናገሩ፣ ወይም ከላይ ይመልሱ።',
    denied: 'ማይክሮፎኑ ታግዷል። በድምፅ ለመመለስ በአሳሽዎ ማይክሮፎን ይፍቀዱ፣ ወይም ከላይ ይመልሱ።',
    noMic: 'ማይክሮፎን አልተገኘም። አሁንም ከላይ መመለስ ይችላሉ።',
    language: 'በዚህ መሣሪያ ላይ በዚህ ቋንቋ በድምፅ መመለስ አይቻልም። አሁንም ከላይ መመለስ ይችላሉ።',
    failed: 'በድምፅ መመለስ በዚህ ጊዜ አልሠራም። እባክዎ እንደገና ይሞክሩ ወይም ከላይ ይመልሱ።',
    unavailable: 'በዚህ አሳሽ ላይ በድምፅ መናገር አይቻልም። አሁንም ከላይ መመለስ ይችላሉ።',
  },
};

const ERROR_MESSAGES = {
  'no-speech': 'noSpeech',
  'not-allowed': 'denied',
  'service-not-allowed': 'denied',
  'audio-capture': 'noMic',
  'language-not-supported': 'language',
};

/**
 * Answering a question by speaking.
 *
 * What is heard goes straight into the answer, where the learner can see
 * it, hear it and change it:
 *
 * - A written answer gets the words typed into its box, and focus moves
 *   there so the learner can correct them.
 * - A choice is selected only when what was heard fits exactly one option.
 *   A partial match is asked about first ("Did you mean…?"); something
 *   that fits several options, or none, selects nothing at all.
 *
 * Nothing here moves to the next question or submits the form.
 */
export function VoiceAnswer({ question, value, language = 'en', onAnswer, onFocusField }) {
  const [state, setState] = useState('idle');
  const [proposal, setProposal] = useState(null);
  const [message, setMessage] = useState('');
  const listenerRef = useRef(null);

  const copy = COPY[language] ?? COPY.en;
  const supported = isRecognitionSupported();
  const { voice, controlActive } = useVoiceContext();
  const hasOptions = question.options?.length > 0;
  const isMulti = question.type === 'multiChoice';

  useEffect(
    () => () => {
      listenerRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  if (!supported) {
    return <p className="fe-voice__note">{copy.unavailable}</p>;
  }

  /* Voice control is listening already; a second microphone button would
     compete with it. */
  if (controlActive) return null;

  /* Say it and show it: the status line is a polite live region, and it is
     also read aloud for learners who rely on audio. */
  function report(text, { private: isPrivate = false } = {}) {
    setMessage(text);
    /* What the learner said is read back in the same natural voice; marked
       private, so the read-aloud service never keeps it. */
    speak(text, { language, voice, private: isPrivate });
  }

  function choose(option) {
    if (isMulti) {
      const current = Array.isArray(value) ? value : [];
      onAnswer(current.includes(option.value) ? current : [...current, option.value]);
      report(copy.added(option.label));
    } else {
      onAnswer(option.value);
      report(copy.selected(option.label));
    }

    setProposal(null);
    setState('answered');
    onFocusField?.();
  }

  function handleResult(transcript, alternatives) {
    if (!hasOptions) {
      /* A longer answer can be built up over several goes; a one-line
         answer is replaced, which is what saying it again means. */
      const existing = typeof value === 'string' ? value.trim() : '';
      const next =
        question.type === 'longText' && existing ? `${existing} ${transcript}` : transcript;

      onAnswer(next);
      setState('answered');
      report(copy.wroteIt(transcript), { private: true });
      onFocusField?.();
      return;
    }

    const result = matchSpokenAlternatives(alternatives, question.options);

    if (result.confidence === 'high') {
      choose(result.option);
      return;
    }

    if (result.confidence === 'medium') {
      setProposal(result.option);
      setState('confirm');
      report(copy.didYouMean(result.option.label));
      return;
    }

    setProposal(null);
    setState('unmatched');

    if (result.confidence === 'ambiguous') {
      report(copy.several(result.candidates.map((option) => option.label).join(', ')));
    } else {
      report(copy.noMatch(transcript), { private: true });
    }
  }

  function listen() {
    if (state === 'listening') {
      listenerRef.current?.stop();
      setState('idle');
      setMessage('');
      return;
    }

    stopSpeaking();
    setMessage('');
    setProposal(null);
    setState('listening');

    listenerRef.current = startListening({
      language,
      onResult: handleResult,
      onError: (code) => {
        setState('error');
        report(copy[ERROR_MESSAGES[code] ?? 'failed']);
      },
      onEnd: () => {
        setState((current) => (current === 'listening' ? 'idle' : current));
      },
    });

    if (!listenerRef.current) {
      setState('error');
      report(copy.failed);
    }
  }

  return (
    <div className="fe-voice">
      <button
        type="button"
        className={`fe-voice__mic${state === 'listening' ? ' fe-voice__mic--live' : ''}`}
        aria-pressed={state === 'listening'}
        onClick={listen}
      >
        <span aria-hidden="true">🎤</span>
        {state === 'listening' ? copy.stop : copy.speak}
      </button>

      {state === 'confirm' && proposal ? (
        <div className="fe-voice__proposal">
          <p className="fe-voice__heard">{copy.didYouMean(proposal.label)}</p>

          <div className="fe-voice__actions">
            <button type="button" className="fe-button fe-button--primary" onClick={() => choose(proposal)}>
              {copy.use}
            </button>
            <button type="button" className="fe-button" onClick={listen}>
              {copy.retry}
            </button>
          </div>
        </div>
      ) : null}

      {/* Spoken status is announced politely; it never interrupts. */}
      <p className="fe-voice__status" role="status" aria-live="polite">
        {state === 'listening' ? copy.listening : message}
      </p>
    </div>
  );
}
