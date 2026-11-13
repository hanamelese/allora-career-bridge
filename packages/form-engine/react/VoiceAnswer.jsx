import { useEffect, useRef, useState } from 'react';
import { isRecognitionSupported, speak, startListening, stopSpeaking } from './speech.js';
import { matchSpokenChoice } from './choiceMatch.js';

const COPY = {
  en: {
    speak: 'Answer by speaking',
    listening: 'Listening… speak now',
    stop: 'Stop listening',
    heard: 'We heard',
    isThatRight: 'Is that right?',
    didYouMean: 'Did you mean',
    use: 'Yes, use this',
    retry: 'No, try again',
    hear: 'Play it back',
    notUnderstood:
      'That was not clear enough to use. You can try speaking again, or answer using the buttons above.',
    unavailable: 'Speaking is not available in this browser. You can still answer above.',
    noMatch: 'That did not match any of the choices. Try again, or pick one above.',
  },
  am: {
    speak: 'በድምፅ ይመልሱ',
    listening: 'በማዳመጥ ላይ… አሁን ይናገሩ',
    stop: 'ማዳመጥ አቁም',
    heard: 'የሰማነው',
    isThatRight: 'ትክክል ነው?',
    didYouMean: 'ያሉት ይህ ነው',
    use: 'አዎ፣ ይህንን ተጠቀም',
    retry: 'አይደለም፣ እንደገና ይሞክሩ',
    hear: 'መልሰው ያድምጡ',
    notUnderstood:
      'በበቂ ሁኔታ አልተሰማም። እንደገና መናገር ይችላሉ፣ ወይም ከላይ ባሉት ቁልፎች መመለስ ይችላሉ።',
    unavailable: 'በዚህ አሳሽ ላይ በድምፅ መናገር አይቻልም። አሁንም ከላይ መመለስ ይችላሉ።',
    noMatch: 'ይህ ከአማራጮቹ ጋር አልተዛመደም። እንደገና ይሞክሩ ወይም ከላይ አንዱን ይምረጡ።',
  },
};

/**
 * Answering a question by speaking.
 *
 * What the microphone heard is **proposed**, never committed: it is shown
 * on screen, read back, and only becomes the answer when the learner
 * accepts it. They can also just edit the field directly instead. Nothing
 * here ever moves the form to the next question.
 *
 * When the answer is a choice, a weak match is put as a question ("Did you
 * mean…?") rather than selected outright, because a wrong auto-selection
 * is harder to notice than an unanswered question.
 */
export function VoiceAnswer({ question, language = 'en', onAccept }) {
  const [state, setState] = useState('idle');
  const [heard, setHeard] = useState('');
  const [proposal, setProposal] = useState(null);
  const [message, setMessage] = useState('');
  const listenerRef = useRef(null);

  const copy = COPY[language] ?? COPY.en;
  const supported = isRecognitionSupported();
  const hasOptions = question.options?.length > 0;

  useEffect(
    () => () => {
      listenerRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  /* A new question clears any proposal left over from the previous one. */
  useEffect(() => {
    setState('idle');
    setHeard('');
    setProposal(null);
    setMessage('');
  }, [question.key]);

  if (!supported) {
    return <p className="fe-voice__note">{copy.unavailable}</p>;
  }

  function handleTranscript(transcript) {
    setHeard(transcript);

    if (!hasOptions) {
      setProposal({ value: transcript, label: transcript, certain: true });
      setState('proposed');
      speak(`${copy.heard}: ${transcript}. ${copy.isThatRight}`, { language });
      return;
    }

    const { option, confidence } = matchSpokenChoice(transcript, question.options);

    if (!option) {
      setProposal(null);
      setState('unmatched');
      setMessage(copy.noMatch);
      return;
    }

    setProposal({ value: option.value, label: option.label, certain: confidence === 'high' });
    setState('proposed');

    const spokenBack =
      confidence === 'high'
        ? `${copy.heard}: ${option.label}. ${copy.isThatRight}`
        : `${copy.didYouMean} ${option.label}?`;

    speak(spokenBack, { language });
  }

  function listen() {
    if (state === 'listening') {
      listenerRef.current?.stop();
      setState('idle');
      return;
    }

    stopSpeaking();
    setMessage('');
    setProposal(null);
    setState('listening');

    listenerRef.current = startListening({
      language,
      onResult: handleTranscript,
      onError: () => {
        setState('error');
        setMessage(copy.notUnderstood);
      },
      onEnd: () => {
        setState((current) => (current === 'listening' ? 'idle' : current));
      },
    });

    if (!listenerRef.current) {
      setState('error');
      setMessage(copy.notUnderstood);
    }
  }

  function accept() {
    stopSpeaking();
    onAccept(proposal.value);
    setState('accepted');
    setProposal(null);
  }

  return (
    <div className="fe-voice">
      <button
        type="button"
        className={`fe-voice__mic${state === 'listening' ? ' fe-voice__mic--live' : ''}`}
        aria-label={state === 'listening' ? copy.stop : copy.speak}
        onClick={listen}
      >
        <span aria-hidden="true">🎤</span>
        {state === 'listening' ? copy.listening : copy.speak}
      </button>

      {state === 'proposed' && proposal ? (
        <div className="fe-voice__proposal">
          <p className="fe-voice__heard">
            {proposal.certain ? `${copy.heard}: ` : `${copy.didYouMean} `}
            <strong>{proposal.label}</strong>
            {proposal.certain ? `. ${copy.isThatRight}` : '?'}
          </p>

          <div className="fe-voice__actions">
            <button type="button" className="fe-button fe-button--primary" onClick={accept}>
              {copy.use}
            </button>
            <button type="button" className="fe-button" onClick={listen}>
              {copy.retry}
            </button>
            <button
              type="button"
              className="fe-audio-button"
              onClick={() => speak(proposal.label, { language })}
            >
              <span aria-hidden="true">🔊</span>
              {copy.hear}
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
