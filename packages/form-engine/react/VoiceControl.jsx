import { useCallback, useEffect, useRef, useState } from 'react';
import { isRecognitionSupported, speakAsync, startListening, stopSpeaking } from './speech.js';
import { matchSpokenAlternatives, matchSpokenChoice } from './choiceMatch.js';
import { parseCommand, tidyDictation } from './voiceCommands.js';

const COPY = {
  en: {
    button: 'Voice control',
    on: 'Voice control is on. I will read each question, then listen. Say help at any time to hear what you can say.',
    off: 'Voice control is off.',
    listening: 'Listening… speak now',
    heard: (text) => `You said: ${text}`,
    speaking: 'Speaking…',
    unsupported: 'Voice control needs speech recognition, which this browser does not have. Try Chrome or Edge. Read aloud still works.',
    denied: 'The microphone is blocked, so voice control has stopped. Allow the microphone in your browser and turn it on again.',
    noMic: 'No microphone was found, so voice control has stopped.',
    silence: 'I did not hear anything. Say help to hear what you can say.',
    silentTwice: 'I did not hear anything, so voice control has stopped. Press Voice control to start again.',
    help: 'You can say: next, back, repeat, read the question, read the options, option and a number, choose and an option, clear, send, help, or stop. Anything else is taken as your answer.',
    required: 'Required.',
    optional: 'Optional.',
    options: (list) => `The options are: ${list}.`,
    numbered: (number, label) => `${number}, ${label}`,
    noOptions: 'This question has no options to choose from. Say your answer.',
    hintChoice: 'Say an option, or its number.',
    hintMulti: 'Say each option you want, one at a time, then say next.',
    hintText: 'Say your answer.',
    hintConsent: 'To agree, say I agree.',
    hintFile: 'This question needs a file, which voice control cannot choose. Use the keyboard or mouse, or say next if it is optional.',
    hintReferral: 'This step is answered with the keyboard or mouse. Say next to continue.',
    hintPassword: 'For your safety, type your password; voice control does not take it, so nobody nearby hears it. Then say next.',
    passwordRefused: 'For your safety, please type your password instead of saying it.',
    selected: (label) => `Selected: ${label}. Say next to continue.`,
    added: (label) => `Added: ${label}. Say another option, or next to continue.`,
    alreadyAdded: (label) => `${label} is already selected.`,
    wrote: (text) => `You said: ${text}. Say next to continue, or say it again to change it.`,
    didYouMean: (label) => `Did you mean ${label}? Say yes or no.`,
    several: (labels) => `That could be: ${labels}. Please say which one.`,
    noMatch: 'That did not match any option. Say options to hear them, or say the option number.',
    noNumber: (number, total) => `There is no option ${number}. There are ${total} options.`,
    agreeConfirm: (label) => `You are agreeing to: ${label}. Say yes to agree, or no.`,
    agreed: 'Agreed. Say next to continue.',
    notChanged: 'Nothing was changed. Say your answer again, or say options.',
    cleared: 'Your answer was cleared.',
    first: 'This is the first question.',
    nothingToConfirm: 'There is nothing to confirm. Say help to hear what you can say.',
    sendNotYet: 'You can send once you have checked your answers. Say next to go on.',
    confirmSend: 'Do you want to send your answers now? Say yes to send, or no to go back.',
    confirmAccount: 'Do you want to continue? Say yes, or no.',
    notSent: 'Not sent. Say send when you are ready, or back to change an answer.',
    sending: 'Sending…',
    review: 'Check your answers. Say read to hear them, back to change one, or send to send them.',
    sendFailed: 'Your answers could not be sent. Say send to try again.',
    social: 'You can sign in with one of the accounts shown, using the keyboard or mouse, or say next to use your email address.',
  },
  am: {
    button: 'የድምፅ ቁጥጥር',
    on: 'የድምፅ ቁጥጥር በርቷል። እያንዳንዱን ጥያቄ አነባለሁ፣ ከዚያ አዳምጣለሁ። ምን ማለት እንደሚችሉ ለመስማት በማንኛውም ጊዜ እገዛ ይበሉ።',
    off: 'የድምፅ ቁጥጥር ጠፍቷል።',
    listening: 'በማዳመጥ ላይ… አሁን ይናገሩ',
    heard: (text) => `ያሉት፦ ${text}`,
    speaking: 'በመናገር ላይ…',
    unsupported: 'የድምፅ ቁጥጥር የንግግር ማወቂያ ያስፈልገዋል፤ ይህ አሳሽ የለውም። Chrome ወይም Edge ይሞክሩ። ጮክ ብሎ ማንበብ ግን ይሠራል።',
    denied: 'ማይክሮፎኑ ታግዷል፤ ስለዚህ የድምፅ ቁጥጥር ቆሟል። በአሳሽዎ ማይክሮፎኑን ፈቅደው እንደገና ያብሩት።',
    noMic: 'ማይክሮፎን አልተገኘም፤ ስለዚህ የድምፅ ቁጥጥር ቆሟል።',
    silence: 'ምንም አልሰማሁም። ምን ማለት እንደሚችሉ ለመስማት እገዛ ይበሉ።',
    silentTwice: 'ምንም አልሰማሁም፤ ስለዚህ የድምፅ ቁጥጥር ቆሟል። እንደገና ለመጀመር የድምፅ ቁጥጥርን ይጫኑ።',
    help: 'ማለት የሚችሉት፦ ቀጣይ፣ ተመለስ፣ ድገም፣ ጥያቄውን አንብብ፣ አማራጮቹን አንብብ፣ አማራጭ እና ቁጥር፣ ምረጥ እና አማራጭ፣ አጥፋ፣ ላክ፣ እገዛ ወይም አቁም። ሌላ ማንኛውም ነገር እንደ መልስዎ ይወሰዳል።',
    required: 'ግዴታ።',
    optional: 'አማራጭ።',
    options: (list) => `አማራጮቹ፦ ${list}።`,
    numbered: (number, label) => `${number}፣ ${label}`,
    noOptions: 'ይህ ጥያቄ የሚመረጡ አማራጮች የሉትም። መልስዎን ይናገሩ።',
    hintChoice: 'አማራጭ ወይም ቁጥሩን ይናገሩ።',
    hintMulti: 'የሚፈልጉትን እያንዳንዱን አማራጭ አንድ በአንድ ይናገሩ፤ ከዚያ ቀጣይ ይበሉ።',
    hintText: 'መልስዎን ይናገሩ።',
    hintConsent: 'ለመስማማት እስማማለሁ ይበሉ።',
    hintFile: 'ይህ ጥያቄ ፋይል ያስፈልገዋል፤ የድምፅ ቁጥጥር ፋይል መምረጥ አይችልም። የቁልፍ ሰሌዳ ወይም አይጥ ይጠቀሙ፣ ወይም አማራጭ ከሆነ ቀጣይ ይበሉ።',
    hintReferral: 'ይህ ደረጃ በቁልፍ ሰሌዳ ወይም በአይጥ ይመለሳል። ለመቀጠል ቀጣይ ይበሉ።',
    hintPassword: 'ለደኅንነትዎ የይለፍ ቃልዎን ይጻፉ፤ በአጠገብዎ ያለ ሰው እንዳይሰማ የድምፅ ቁጥጥር አይቀበለውም። ከዚያ ቀጣይ ይበሉ።',
    passwordRefused: 'ለደኅንነትዎ እባክዎ የይለፍ ቃልዎን ከመናገር ይልቅ ይጻፉት።',
    selected: (label) => `ተመርጧል፦ ${label}። ለመቀጠል ቀጣይ ይበሉ።`,
    added: (label) => `ታክሏል፦ ${label}። ሌላ አማራጭ ይናገሩ፣ ወይም ለመቀጠል ቀጣይ ይበሉ።`,
    alreadyAdded: (label) => `${label} አስቀድሞ ተመርጧል።`,
    wrote: (text) => `ያሉት፦ ${text}። ለመቀጠል ቀጣይ ይበሉ፣ ወይም ለመቀየር እንደገና ይናገሩ።`,
    didYouMean: (label) => `${label} ማለትዎ ነው? አዎ ወይም አይ ይበሉ።`,
    several: (labels) => `ይህ ከእነዚህ አንዱ ሊሆን ይችላል፦ ${labels}። እባክዎ የትኛው እንደሆነ ይናገሩ።`,
    noMatch: 'ይህ ከየትኛውም አማራጭ ጋር አልተዛመደም። እነሱን ለመስማት አማራጮች ይበሉ፣ ወይም የአማራጩን ቁጥር ይናገሩ።',
    noNumber: (number, total) => `አማራጭ ${number} የለም። ${total} አማራጮች አሉ።`,
    agreeConfirm: (label) => `በዚህ እየተስማሙ ነው፦ ${label}። ለመስማማት አዎ፣ ካልሆነ አይ ይበሉ።`,
    agreed: 'ተስማምተዋል። ለመቀጠል ቀጣይ ይበሉ።',
    notChanged: 'ምንም አልተቀየረም። መልስዎን እንደገና ይናገሩ ወይም አማራጮች ይበሉ።',
    cleared: 'መልስዎ ጠፍቷል።',
    first: 'ይህ የመጀመሪያው ጥያቄ ነው።',
    nothingToConfirm: 'የሚረጋገጥ ነገር የለም። ምን ማለት እንደሚችሉ ለመስማት እገዛ ይበሉ።',
    sendNotYet: 'መልሶችዎን ካረጋገጡ በኋላ መላክ ይችላሉ። ለመቀጠል ቀጣይ ይበሉ።',
    confirmSend: 'መልሶችዎን አሁን መላክ ይፈልጋሉ? ለመላክ አዎ፣ ለመመለስ አይ ይበሉ።',
    confirmAccount: 'መቀጠል ይፈልጋሉ? አዎ ወይም አይ ይበሉ።',
    notSent: 'አልተላከም። ዝግጁ ሲሆኑ ላክ ይበሉ፣ ወይም መልስ ለመቀየር ተመለስ ይበሉ።',
    sending: 'በመላክ ላይ…',
    review: 'መልሶችዎን ያረጋግጡ። ለመስማት አንብብ፣ ለመቀየር ተመለስ፣ ለመላክ ላክ ይበሉ።',
    sendFailed: 'መልሶችዎ ሊላኩ አልቻሉም። እንደገና ለመሞከር ላክ ይበሉ።',
    social: 'ከሚታዩት መለያዎች በአንዱ በቁልፍ ሰሌዳ ወይም በአይጥ መግባት ይችላሉ፤ ወይም የኢሜይል አድራሻዎን ለመጠቀም ቀጣይ ይበሉ።',
  },
};

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* One go of listening, as a promise. The handle is kept so turning voice
   control off stops the microphone at once. */
function listenOnce(language, handleRef) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      handleRef.current = null;
      resolve(result);
    };
    handleRef.current = startListening({
      language,
      onResult: (transcript, alternatives) => done({ transcript, alternatives }),
      onError: (code) => done({ error: code }),
      onEnd: () => done({ error: 'no-speech' }),
    });
    if (!handleRef.current) done({ error: 'could-not-start' });
  });
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3"
      />
    </svg>
  );
}

/**
 * Hands-free Voice control.
 *
 * When on, the form reads each screen aloud (question, whether it must be
 * answered, help and the numbered options), then listens. What is heard is
 * a command (next, back, repeat, read, options, choose, clear, send, help,
 * stop - see voiceCommands.js) or the answer itself; the form says what it
 * did and listens again. Sending always asks for a spoken yes first.
 *
 * It acts through the form's own controller - the same next, back, answer
 * and submit a click uses - so validation, confirmation and privacy rules
 * are exactly those of the form. It never listens while it is speaking.
 *
 * What a learner typed or said is read back in the same natural voice,
 * marked `private` so the read-aloud service never keeps it; a password is
 * never taken by voice or read out.
 *
 * Returns the toggle button (for the form's top bar), the status line and
 * a key handler (Alt+Shift+V turns it on and off).
 *
 * controller: {
 *   key, screen: 'question' | 'review' | 'done' | 'social' | 'empty',
 *   question, value, error, progressText, isLast, canGoBack, isSending,
 *   sendFailed, isAccount, reviewText, doneText,
 *   next(), back(), answer(value), clear(), submit()
 * }
 */
export function useVoiceControl({ getController, language = 'en', voice = null }) {
  const copy = COPY[language] ?? COPY.en;
  const [active, setActive] = useState(false);
  /* What is being said, shown for anyone who wants to read it too; and a
     short live announcement (listening, what was heard) for screen
     readers, which would otherwise hear everything twice. */
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState('');

  const getRef = useRef(getController);
  getRef.current = getController;
  const controllerRef = {
    get current() {
      return getRef.current();
    },
  };
  const activeRef = useRef(false);
  const listenRef = useRef(null);
  const lastSaidRef = useRef({ text: '', private: false });
  const pendingRef = useRef(null);
  const sessionRef = useRef(0);
  const copyRef = useRef(copy);
  copyRef.current = copy;
  const languageRef = useRef(language);
  languageRef.current = language;

  const say = useCallback(
    async (text, { private: isPrivate = false } = {}) => {
      if (!text) return;
      lastSaidRef.current = { text, private: isPrivate };
      setCaption(text);
      await speakAsync(text, { language: languageRef.current, voice, private: isPrivate });
    },
    [voice],
  );

  /* ---- What each screen sounds like ---- */

  function optionsText(question) {
    const c = copyRef.current;
    if (!question?.options?.length) return '';
    return c.options(question.options.map((option, index) => c.numbered(index + 1, option.label)).join('. '));
  }

  function hintFor(question) {
    const c = copyRef.current;
    if (!question) return '';
    if (question.type === 'file') return c.hintFile;
    if (question.type === 'referral') return c.hintReferral;
    if (question.type === 'password') return c.hintPassword;
    if (question.type === 'consent') return c.hintConsent;
    if (question.type === 'multiChoice') return c.hintMulti;
    if (question.options?.length) return c.hintChoice;
    return c.hintText;
  }

  function describe(ctrl, { full = true } = {}) {
    const c = copyRef.current;
    if (ctrl.screen === 'review') return c.review;
    if (ctrl.screen === 'social') return c.social;
    if (ctrl.screen === 'done') return ctrl.doneText ?? '';
    if (ctrl.screen === 'empty') return ctrl.emptyText ?? '';
    const q = ctrl.question;
    if (!q) return '';
    return sentences([
      full ? ctrl.progressText : '',
      q.readAloudText || q.label,
      q.required ? c.required : c.optional,
      optionsText(q),
      hintFor(q),
    ]);
  }

  /* Parts read one after another, each ending as a sentence so the voice
     pauses between them. */
  function sentences(parts) {
    const stop = languageRef.current === 'am' ? '።' : '.';
    return parts
      .filter(Boolean)
      .map((part) => {
        const text = String(part).trim();
        return /[.!?።]$/.test(text) ? text : `${text}${stop}`;
      })
      .join(' ');
  }

  /* After an action, give React a moment to show the result. */
  async function settle() {
    await pause(120);
    return controllerRef.current;
  }

  /* Says the new screen if it changed, or the problem if it did not. */
  async function afterMove(beforeKey) {
    const ctrl = await settle();
    if (ctrl.key !== beforeKey) return say(describe(ctrl));
    if (ctrl.error) return say(ctrl.error);
    return undefined;
  }

  /* Until the form says it was sent, or has stopped sending (a problem). */
  async function waitForSend() {
    for (let waited = 0; waited < 20000; waited += 150) {
      await pause(150);
      const ctrl = controllerRef.current;
      if (ctrl.screen === 'done') return ctrl;
      if (!ctrl.isSending && waited >= 600) return ctrl;
    }
    return controllerRef.current;
  }

  /* ---- Answering ---- */

  async function choose(option) {
    const c = copyRef.current;
    const ctrl = controllerRef.current;
    if (ctrl.question.type === 'multiChoice') {
      const current = Array.isArray(ctrl.value) ? ctrl.value : [];
      if (current.includes(option.value)) return say(c.alreadyAdded(option.label));
      ctrl.answer([...current, option.value]);
      return say(c.added(option.label));
    }
    ctrl.answer(option.value);
    return say(c.selected(option.label));
  }

  async function matchAndChoose(result) {
    const c = copyRef.current;
    if (result.confidence === 'high') return choose(result.option);
    if (result.confidence === 'medium') {
      pendingRef.current = { kind: 'choice', option: result.option };
      return say(c.didYouMean(result.option.label));
    }
    if (result.confidence === 'ambiguous') {
      return say(c.several(result.candidates.map((option) => option.label).join(', ')));
    }
    return say(c.noMatch);
  }

  async function answerWith(text, alternatives) {
    const c = copyRef.current;
    const ctrl = controllerRef.current;
    const q = ctrl.question;
    if (!q || ctrl.screen !== 'question') return say(c.help);

    if (q.type === 'password') return say(c.passwordRefused);
    if (q.type === 'file') return say(c.hintFile);
    if (q.type === 'referral') return say(c.hintReferral);
    if (q.type === 'consent') {
      pendingRef.current = { kind: 'consent' };
      return say(c.agreeConfirm(q.consentText || q.label));
    }
    if (q.options?.length) {
      return matchAndChoose(
        alternatives?.length ? matchSpokenAlternatives(alternatives, q.options) : matchSpokenChoice(text, q.options),
      );
    }

    const value = tidyDictation(text, q.type);
    const existing = typeof ctrl.value === 'string' ? ctrl.value.trim() : '';
    ctrl.answer(q.type === 'longText' && existing ? `${existing} ${value}` : value);
    return say(c.wrote(value), { private: true });
  }

  /* ---- One thing heard ---- */

  async function handle(transcript, alternatives) {
    const c = copyRef.current;
    const command = parseCommand(transcript);
    const pending = pendingRef.current;
    pendingRef.current = null;
    const ctrl = controllerRef.current;
    const q = ctrl.question;

    if (pending && (command.type === 'yes' || command.type === 'no')) {
      if (command.type === 'no') return say(pending.kind === 'send' ? c.notSent : c.notChanged);
      if (pending.kind === 'choice') return choose(pending.option);
      if (pending.kind === 'consent') {
        ctrl.answer(true);
        return say(c.agreed);
      }
      if (pending.kind === 'send') {
        await say(c.sending);
        if (ctrl.screen === 'review') ctrl.submit();
        else ctrl.next();
        const after = await waitForSend();
        if (after.screen === 'done') {
          await say(describe(after));
          return stop({ quiet: true });
        }
        if (after.error) return say(after.error);
        if (after.sendFailed) return say(c.sendFailed);
        return undefined;
      }
    }

    /* On a choice question, "yes" and "no" are answers, not confirmations. */
    if ((command.type === 'yes' || command.type === 'no') && ctrl.screen === 'question' && q?.options?.length) {
      return answerWith(transcript, alternatives);
    }
    if ((command.type === 'yes') && ctrl.screen === 'question' && q?.type === 'consent') {
      pendingRef.current = { kind: 'consent' };
      return say(c.agreeConfirm(q.consentText || q.label));
    }

    switch (command.type) {
      case 'next':
        if (ctrl.screen === 'review') {
          pendingRef.current = { kind: 'send' };
          return say(c.confirmSend);
        }
        if (ctrl.screen === 'question' && ctrl.isAccount && ctrl.isLast) {
          pendingRef.current = { kind: 'send' };
          return say(c.confirmAccount);
        }
        ctrl.next();
        return afterMove(ctrl.key);
      case 'back':
        if (!ctrl.canGoBack) return say(c.first);
        ctrl.back();
        return afterMove(ctrl.key);
      case 'repeat':
        return say(lastSaidRef.current.text || describe(ctrl), { private: lastSaidRef.current.private });
      case 'read':
        if (ctrl.screen === 'review' && ctrl.reviewText) return say(ctrl.reviewText, { private: true });
        return say(describe(ctrl, { full: false }));
      case 'options':
        return say(q?.options?.length ? `${optionsText(q)} ${hintFor(q)}` : c.noOptions);
      case 'choose': {
        if (!q?.options?.length) {
          return answerWith(command.target ?? String(transcript), alternatives);
        }
        if (command.number) {
          const option = q.options[command.number - 1];
          return option ? choose(option) : say(c.noNumber(command.number, q.options.length));
        }
        return matchAndChoose(matchSpokenChoice(command.target, q.options));
      }
      case 'clear':
        ctrl.clear();
        return say(c.cleared);
      case 'send':
        if (ctrl.screen === 'review') {
          pendingRef.current = { kind: 'send' };
          return say(c.confirmSend);
        }
        if (ctrl.screen === 'question' && ctrl.isAccount && ctrl.isLast) {
          pendingRef.current = { kind: 'send' };
          return say(c.confirmAccount);
        }
        return say(c.sendNotYet);
      case 'help':
        return say(c.help);
      case 'stop':
        return stop();
      case 'yes':
      case 'no':
        return say(c.nothingToConfirm);
      case 'answer':
        return answerWith(command.text, alternatives);
      default:
        return undefined;
    }
  }

  /* ---- The loop: speak, then listen, until stopped ---- */

  async function loop(session) {
    let silences = 0;
    while (activeRef.current && sessionRef.current === session) {
      setStatus(copyRef.current.listening);
      setCaption('');
      const heard = await listenOnce(languageRef.current, listenRef);
      if (!activeRef.current || sessionRef.current !== session) return;

      if (heard.error) {
        const c = copyRef.current;
        if (heard.error === 'not-allowed' || heard.error === 'service-not-allowed') {
          await stop({ message: c.denied });
          return;
        }
        if (heard.error === 'audio-capture') {
          await stop({ message: c.noMic });
          return;
        }
        silences += 1;
        if (silences >= 2) {
          await stop({ message: c.silentTwice });
          return;
        }
        await say(c.silence);
        continue;
      }

      silences = 0;
      setStatus(copyRef.current.heard(heard.transcript));
      await handle(heard.transcript, heard.alternatives);
    }
  }

  async function start() {
    const c = copyRef.current;
    if (!isRecognitionSupported()) {
      setStatus(c.unsupported);
      setCaption('');
      await speakAsync(c.unsupported, { language: languageRef.current, voice });
      return;
    }
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    activeRef.current = true;
    pendingRef.current = null;
    setActive(true);
    await say(`${c.on} ${describe(controllerRef.current)}`);
    loop(session);
  }

  async function stop({ message, quiet = false } = {}) {
    if (!activeRef.current) return;
    activeRef.current = false;
    sessionRef.current += 1;
    pendingRef.current = null;
    listenRef.current?.stop();
    listenRef.current = null;
    setActive(false);
    stopSpeaking();
    const text = message ?? (quiet ? '' : copyRef.current.off);
    setStatus(text);
    setCaption('');
    if (text) await speakAsync(text, { language: languageRef.current, voice });
  }

  function toggle() {
    if (activeRef.current) stop();
    else start();
  }

  /* Leaving the page (or the form) turns the microphone off. */
  useEffect(
    () => () => {
      activeRef.current = false;
      sessionRef.current += 1;
      listenRef.current?.stop();
    },
    [],
  );

  function onKeyDown(event) {
    if (event.altKey && event.shiftKey && (event.key === 'V' || event.key === 'v' || event.code === 'KeyV')) {
      event.preventDefault();
      toggle();
    }
  }

  const button = (
    <button
      type="button"
      className={`fe-settings__toggle fe-voice-control${active ? ' fe-voice-control--on' : ''}`}
      aria-pressed={active}
      aria-keyshortcuts="Alt+Shift+V"
      onClick={toggle}
    >
      <MicIcon />
      <span>{copy.button}</span>
    </button>
  );

  const statusLine = (
    <div className={`fe-voice-control__panel${status || caption ? '' : ' fe-voice-control__panel--empty'}`}>
      <p className="fe-voice-control__status" role="status" aria-live="polite">
        {status}
      </p>
      {caption ? (
        <p className="fe-voice-control__caption">
          <span aria-hidden="true">🔊 </span>
          {caption}
        </p>
      ) : null}
    </div>
  );

  return { active, button, statusLine, onKeyDown };
}
