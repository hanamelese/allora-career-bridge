import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { createFormEngine } from '../src/formEngine.js';
import { formatAnswerText } from '../src/accessibility.js';

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
export function useFormEngine(config, settings = {}, { onSubmit } = {}) {
  const { language = 'en', lowLiteracy = false, readAloud = false, voiceInput = true } = settings;

  const answersRef = useRef({});
  const currentKeyRef = useRef(null);
  const [revision, bump] = useReducer((count) => count + 1, 0);

  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
    });

    if (currentKeyRef.current) {
      next.goTo(currentKeyRef.current);
    }

    return next;
  }, [config, language, lowLiteracy, readAloud, voiceInput]);

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

    setIsSubmitted(true);
    onSubmit?.(result.data);

    return result;
  }, [engine, sync, onSubmit]);

  /** Every question and its answer, for the review step. */
  const reviewItems = useMemo(() => {
    if (!isReviewing) return [];

    const answers = engine.getAllAnswers();

    return engine.getVisibleQuestions().map((item) => ({
      key: item.key,
      label: item.label,
      isPrivate: item.isPrivate,
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
    isFirst: status.isFirst,
    isLast: status.isLast,
    isReviewing,
    isSubmitted,
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
    answerField,
    next,
    back,
    goTo,
    submit,
  };
}
