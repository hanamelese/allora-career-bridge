import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createFormEngine } from '../src/formEngine.js';
import { formatAnswerText } from '../src/accessibility.js';
import { canSave, clearProgress, loadProgress, saveProgress } from './progressStore.js';
import { sendAnswers } from './sendAnswers.js';

/**
 * React binding for the headless form engine.
 *
 * The engine itself is an imperative object holding the answers and the
 * learner's place in the flow. This hook owns one, re-renders when it
 * changes, and adds the two things a screen needs that the core does not
 * model: a review step after the last question, and a submitted state.
 *
 * It lives in the engine package rather than in the dashboard, because the
 * embedded form will use exactly this hook. That is what makes "the
 * preview is what the learner sees" true rather than a promise.
 */
export function useFormEngine(config, settings = {}, { onSubmit, progressKey = null } = {}) {
  /* Read-aloud and voice input are always on. Only the language and the
     learner's own choice of simple words vary. */
  const { language = 'en', lowLiteracy = false, referralPartners } = settings;
  const readAloud = true;
  const voiceInput = true;

  /* What this tab remembered from before a reload, read once. */
  const [restored, setRestored] = useState(() => loadProgress(progressKey, config));
  const [canRemember] = useState(() => Boolean(progressKey) && canSave());
  const [hasSaved, setHasSaved] = useState(false);
  /* Bumped by "Start over", which builds a fresh engine. */
  const [generation, restart] = useReducer((count) => count + 1, 0);

  const answersRef = useRef(restored?.answers ?? {});
  const currentKeyRef = useRef(restored?.currentKey ?? null);
  const [revision, bump] = useReducer((count) => count + 1, 0);

  const [isReviewing, setIsReviewing] = useState(restored?.isReviewing === true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  /* While a host's `onSubmit` promise is pending, and if it fails. */
  const [isSending, setIsSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const sendingRef = useRef(false);
  const [error, setError] = useState(null);

  /**
   * The engine is rebuilt when the configuration or the accessibility
   * settings change - which happens constantly under the dashboard's live
   * preview. Answers and the current question are carried across, so
   * editing a label or switching language does not throw a learner (or a
   * partner trying the form out) back to the first question.
   */
  const engine = useMemo(() => {
    const next = createFormEngine(config, answersRef.current, {
      language,
      lowLiteracy,
      readAloud,
      voiceInput,
      referralPartners,
    });

    if (currentKeyRef.current) {
      next.goTo(currentKeyRef.current);
    }

    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `generation` forces a fresh engine
  }, [config, language, lowLiteracy, readAloud, voiceInput, referralPartners, generation]);

  /** Record where we are and redraw. */
  const sync = useCallback(() => {
    answersRef.current = engine.getAllAnswers();
    currentKeyRef.current = engine.getCurrentQuestion()?.key ?? null;
    bump();
  }, [engine]);

  const question = engine.getCurrentQuestion();
  const status = engine.getStatus();

  if (question && currentKeyRef.current !== question.key) {
    currentKeyRef.current = question.key;
  }

  const answer = useCallback(
    (value) => {
      const key = engine.getCurrentQuestion()?.key;
      if (!key) return;

      engine.answerQuestion(key, value);
      setError(null);
      sync();
    },
    [engine, sync],
  );

  /* Clearing removes the answer altogether, so an optional question goes
     back to unanswered rather than holding an empty value. */
  const clear = useCallback(() => {
    const key = engine.getCurrentQuestion()?.key;
    if (!key) return;

    engine.removeAnswer(key);
    setError(null);
    sync();
  }, [engine, sync]);

  const answerField = useCallback(
    (key, value) => {
      engine.answerQuestion(key, value);
      setError(null);
      sync();
    },
    [engine, sync],
  );

  /** Move on, but only once this question's answer holds up. */
  const next = useCallback(() => {
    const key = engine.getCurrentQuestion()?.key;
    if (!key) return;

    const problem = engine.validateAnswer(key);

    if (problem) {
      setError(problem);
      return;
    }

    setError(null);

    if (engine.getStatus().isLast) {
      setIsReviewing(true);
      return;
    }

    engine.goNext();
    sync();
  }, [engine, sync]);

  const back = useCallback(() => {
    setError(null);

    if (isReviewing) {
      setIsReviewing(false);
      return;
    }

    engine.goBack();
    sync();
  }, [engine, sync, isReviewing]);

  /** Jump to one question, which is how the review step's edit links work. */
  const goTo = useCallback(
    (key) => {
      setError(null);
      setIsReviewing(false);
      engine.goTo(key);
      sync();
    },
    [engine, sync],
  );

  const submit = useCallback(() => {
    /* One send at a time: a second press while the first is on its way
       would send the answers twice. */
    if (sendingRef.current) return { valid: false, errors: {}, sending: true };

    const result = engine.validateSubmission();

    if (!result.valid) {
      /* Send the learner to the first question that still needs work,
         rather than reporting a list they then have to go hunting for. */
      const [firstKey] = Object.keys(result.errors);

      if (firstKey) {
        engine.goTo(firstKey);
        setError(result.errors[firstKey]);
        setIsReviewing(false);
        sync();
      }

      return result;
    }

    sendAnswers(onSubmit, result.data, {
      onSending: () => {
        sendingRef.current = true;
        setIsSending(true);
        setSendFailed(false);
      },
      onSent: () => {
        sendingRef.current = false;
        setIsSending(false);
        setIsSubmitted(true);
        /* Sent: nothing is left behind in the browser. */
        clearProgress(progressKey);
      },
      onFailed: () => {
        sendingRef.current = false;
        setIsSending(false);
        setSendFailed(true);
      },
    });

    return result;
  }, [engine, sync, onSubmit, progressKey]);

  /* Remember the learner's place after every answer and every move. Only
     what may be kept is written (see progressStore.js). */
  useEffect(() => {
    if (!canRemember || isSubmitted) return;
    if (revision === 0 && !isReviewing) return;

    saveProgress(progressKey, config, {
      answers: answersRef.current,
      currentKey: currentKeyRef.current,
      isReviewing,
    });
    setHasSaved(true);
  }, [canRemember, isSubmitted, revision, isReviewing, progressKey, config]);

  /** Forget everything and begin again at the first question. */
  const startOver = useCallback(() => {
    clearProgress(progressKey);
    answersRef.current = {};
    currentKeyRef.current = null;
    setIsReviewing(false);
    setError(null);
    setRestored(null);
    setHasSaved(false);
    restart();
  }, [progressKey]);

  /* The questions whose answers were not kept, as the learner knows them. */
  const notKept = useMemo(() => {
    if (!restored?.notKept?.length) return [];
    const labels = new Map(engine.getVisibleQuestions().map((item) => [item.key, item.label]));
    return restored.notKept.map((key) => labels.get(key)).filter(Boolean);
  }, [restored, engine]);

  /** Every question and its answer, for the review step. */
  const reviewItems = useMemo(() => {
    if (!isReviewing) return [];

    const answers = engine.getAllAnswers();

    return engine.getVisibleQuestions().map((item) => ({
      key: item.key,
      label: item.label,
      isPrivate: item.isPrivate,
      section: item.section,
      answerText: formatAnswerText(item, answers[item.key], language),
    }));
    /* `revision` is bumped by every answer and every move, and the engine
       object is mutated in place, so it is the revision - not the engine's
       identity - that tells this list to rebuild. */
  }, [engine, revision, isReviewing, language]);

  const reviewSummary = useMemo(
    () => reviewItems.map((item) => `${item.label}: ${item.answerText}`).join('. '),
    [reviewItems],
  );

  return {
    question,
    progress: status.progress,
    /* Saving in this tab: whether it can, whether it has, and what came
       back after a reload. */
    canRemember,
    hasSaved,
    wasRestored: Boolean(restored) && Object.keys(restored.answers).length + restored.notKept.length > 0,
    notKept,
    startOver,
    isFirst: status.isFirst,
    isLast: status.isLast,
    isReviewing,
    isSubmitted,
    isSending,
    sendFailed,
    answers: status.answers,
    currentAnswer: question ? status.answers[question.key] : undefined,
    error,
    reviewItems,
    reviewSummary,
    isAnswerConfirmed: (key) => engine.isAnswerConfirmed(key),
    confirmAnswer: (key) => {
      engine.confirmAnswer(key);
      sync();
    },
    answer,
    clear,
    answerField,
    next,
    back,
    goTo,
    submit,
  };
}
