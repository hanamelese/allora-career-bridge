import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ACCOUNT_COPY,
  getAccountQuestions,
  getEnabledProviders,
  validateAccount,
  validateAccountField,
} from '../src/accountForm.js';
import { AnswerTools } from './AnswerTools.jsx';
import { BrandIcon } from './brandIcons.jsx';

const SOCIAL_STEP = 'social';

/**
 * The accessible Sign up / Sign in form, one thing per screen.
 *
 * 1. When the partner switched on any social sign-in, the first screen
 *    offers those, with Next to carry on with an email address instead.
 * 2. Then each input - name (signing up only), email, password - has a
 *    screen of its own, with Back and Next. Nothing typed is lost going
 *    back, and Next checks only the answer on screen.
 *
 * It authenticates no one itself. It is a component a partner puts in
 * place of their own sign-in screen:
 *
 * - each social button is a real link to the address the partner set,
 *   normally the start of their own OAuth flow; a host can intercept it
 *   with `onSocialSignIn(provider)` (the dashboard preview does, so a
 *   partner trying the form is not sent away);
 * - email and password are checked here for shape only and handed to the
 *   host's `onSubmit(data, { mode })`, which signs the person in or up.
 *   It may return (or resolve to) `{ errors: { field: message } }` - an
 *   email already in use, a wrong password - and the form goes back to
 *   that question and shows the message there; or `{ message }` for a
 *   problem with no one field to blame.
 */
export function AccountForm({
  config,
  language = 'en',
  lowLiteracy = false,
  onSubmit,
  onSocialSignIn,
  onSwitchMode,
  renderIcon,
}) {
  const copy = ACCOUNT_COPY[language] ?? ACCOUNT_COPY.en;
  const mode = config.account?.mode ?? 'signUp';
  const title = mode === 'signIn' ? copy.signIn : copy.signUp;

  const questions = useMemo(
    () => getAccountQuestions(config, { language, lowLiteracy }),
    [config, language, lowLiteracy],
  );
  const providers = useMemo(() => getEnabledProviders(config), [config]);
  const hasEmailPassword = questions.length > 0;

  const steps = useMemo(
    () => [...(providers.length > 0 ? [SOCIAL_STEP] : []), ...questions.map((question) => question.key)],
    [providers.length, questions],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [formMessage, setFormMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const headingRef = useRef(null);
  const inputRef = useRef(null);
  const hasMovedRef = useRef(false);

  /* A partner switching Sign up to Sign in in the preview removes the
     name screen; never point past the end. */
  const index = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const question = questions.find((item) => item.key === step) ?? null;

  /* Focus follows the learner to each new screen - but not on first load,
     so the page does not jump when it opens. */
  useEffect(() => {
    if (hasMovedRef.current) headingRef.current?.focus();
  }, [step]);

  function goTo(nextIndex) {
    hasMovedRef.current = true;
    setFormMessage('');
    setStepIndex(nextIndex);
  }

  function update(key, value) {
    setAnswers((current) => {
      const next = { ...current };
      if (value === undefined || value === '') delete next[key];
      else next[key] = value;
      return next;
    });

    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  const labels = Object.fromEntries(questions.map((item) => [item.key, item.label]));

  /** Back to the first screen with a problem, showing it there. */
  function showProblems(found) {
    setErrors(found);
    const first = steps.findIndex((key) => found[key]);
    hasMovedRef.current = true;

    if (first === -1 || first === index) {
      /* Same screen: the heading does not change, so move focus to the
         field itself, where the message is read with it. */
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setStepIndex(first);
    }
  }

  async function finish() {
    const result = validateAccount(config, answers, { language, labels });

    if (!result.valid) {
      showProblems(result.errors);
      return;
    }

    setErrors({});
    setFormMessage('');
    setIsSending(true);

    try {
      const outcome = await onSubmit?.(result.data, { mode });

      if (outcome?.errors && Object.keys(outcome.errors).length > 0) {
        const named = Object.fromEntries(
          Object.entries(outcome.errors).map(([key, message]) => [
            key,
            labels[key] ? `${labels[key]}: ${message}` : message,
          ]),
        );
        showProblems(named);
        if (outcome.message) setFormMessage(outcome.message);
        return;
      }

      if (outcome?.message) {
        setFormMessage(outcome.message);
        return;
      }

      setIsDone(true);
    } catch {
      setFormMessage(copy.hostFailed);
    } finally {
      setIsSending(false);
    }
  }

  function handleNext(event) {
    event?.preventDefault();
    if (isSending) return;

    if (question) {
      const problem = validateAccountField(config, question.key, answers, { language, labels });

      if (problem) {
        setErrors((current) => ({ ...current, [question.key]: problem }));
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }
    }

    if (isLast) {
      finish();
    } else {
      goTo(index + 1);
    }
  }

  if (isDone) {
    return (
      <div className="fe-done" role="status">
        <p className="fe-done__icon" aria-hidden="true">
          ✓
        </p>
        <h2 className="fe-done__heading">{copy.done(mode)}</h2>
      </div>
    );
  }

  const progress = steps.length > 1 ? (
    <div className="fe-progress">
      <p className="fe-progress__label">{copy.progress(index + 1, steps.length)}</p>
      <div
        className="fe-progress__track"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label={copy.progress(index + 1, steps.length)}
      >
        <div className="fe-progress__bar" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  ) : null;

  const message = formMessage ? (
    <p className="fe-account__message" role="alert">
      {formMessage}
    </p>
  ) : null;

  const backButton =
    index > 0 ? (
      <button type="button" className="fe-button" onClick={() => goTo(index - 1)} disabled={isSending}>
        {copy.back}
      </button>
    ) : null;

  let screen = null;

  if (steps.length === 0) {
    screen = <p className="fe-question__note">{copy.noOptions}</p>;
  } else if (step === SOCIAL_STEP) {
    screen = (
      <div className="fe-account__screen">
        <h3 className="fe-account__step-heading" ref={headingRef} tabIndex={-1} data-question-heading>
          {copy.socialHeading(mode)}
        </h3>

        <nav className="fe-social" aria-label={copy.socialGroup(mode)}>
          <ul className="fe-social__list">
            {providers.map((provider) => (
              <li key={provider.key}>
                <a
                  className={`fe-social__button fe-social__button--${provider.key}`}
                  href={provider.url}
                  onClick={(event) => {
                    if (!onSocialSignIn) return;
                    event.preventDefault();
                    onSocialSignIn(provider);
                  }}
                >
                  <BrandIcon provider={provider.key} />
                  <span>{copy.withProvider(mode, provider.name)}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {hasEmailPassword ? (
          <>
            <div className="fe-account__divider">
              <span aria-hidden="true">{copy.or}</span>
              <span className="fe-visually-hidden">{copy.orLong(mode)}</span>
            </div>
            <p className="fe-question__help">{copy.socialNext(mode)}</p>
            <div className="fe-actions">
              <button type="button" className="fe-button fe-button--primary" onClick={handleNext}>
                {copy.next}
              </button>
            </div>
          </>
        ) : null}
      </div>
    );
  } else if (question) {
    const id = `fe-account-${question.key}`;
    const helpId = question.helpText ? `${id}-help` : null;
    const errorId = errors[question.key] ? `${id}-error` : null;
    const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;
    const isPassword = question.type === 'password';

    screen = (
      /* A real form, so Enter in the field means Next, as people expect. */
      <form className="fe-account__screen" noValidate onSubmit={handleNext} key={question.key}>
        <div className="fe-question__title">
          {renderIcon && question.icon ? (
            <span className="fe-question__icon" aria-hidden="true">
              {renderIcon(question.icon)}
            </span>
          ) : null}
          <h3 className="fe-account__step-heading" ref={headingRef} tabIndex={-1} data-question-heading>
            <label htmlFor={id}>
              {question.label}
              {question.required ? (
                <span className="fe-required">
                  <span aria-hidden="true"> *</span>
                  <span className="fe-visually-hidden"> {language === 'am' ? '(ግዴታ)' : '(required)'}</span>
                </span>
              ) : null}
            </label>
          </h3>
        </div>

        {question.helpText ? (
          <p className="fe-question__help" id={helpId}>
            {question.helpText}
          </p>
        ) : null}

        <div className="fe-account__input-row">
          <input
            id={id}
            ref={inputRef}
            className={`fe-input${errors[question.key] ? ' fe-input--invalid' : ''}`}
            type={isPassword ? (showPassword ? 'text' : 'password') : question.type === 'email' ? 'email' : 'text'}
            inputMode={question.type === 'email' ? 'email' : undefined}
            autoComplete={question.autocomplete}
            spellCheck={isPassword || question.type === 'email' ? false : undefined}
            autoCapitalize={isPassword || question.type === 'email' ? 'none' : undefined}
            value={answers[question.key] ?? ''}
            required={question.required}
            aria-required={question.required || undefined}
            aria-invalid={Boolean(errors[question.key]) || undefined}
            aria-describedby={describedBy}
            onChange={(event) => update(question.key, event.target.value)}
          />

          {isPassword ? (
            <button
              type="button"
              className="fe-button fe-account__reveal"
              aria-pressed={showPassword}
              aria-controls={id}
              onClick={() => setShowPassword((current) => !current)}
            >
              {copy.showPassword}
            </button>
          ) : null}
        </div>

        {errors[question.key] ? (
          <p className="fe-error" id={errorId} role="alert">
            {errors[question.key]}
          </p>
        ) : null}

        {/* Read and clear for every field; speaking is offered only where
            the catalogue allows it, never for a password. */}
        {isPassword ? null : (
          <AnswerTools
            question={question}
            value={answers[question.key]}
            language={language}
            onAnswer={(value) => update(question.key, value)}
            onClear={() => update(question.key, undefined)}
            onFocusField={() => requestAnimationFrame(() => inputRef.current?.focus())}
          />
        )}

        <div className="fe-actions">
          {backButton}
          <button type="submit" className="fe-button fe-button--primary" disabled={isSending} aria-disabled={isSending || undefined}>
            {isSending ? copy.sending : isLast ? (mode === 'signIn' ? copy.submitSignIn : copy.submitSignUp) : copy.next}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="fe-account">
      <header className="fe-account__header">
        <h2 className="fe-account__title">{title}</h2>
        {index === 0 ? (
          <p className="fe-question__help">{mode === 'signIn' ? copy.signInIntro : copy.signUpIntro}</p>
        ) : null}
      </header>

      {progress}
      {message}
      {screen}

      {onSwitchMode ? (
        <p className="fe-account__switch">
          <button
            type="button"
            className="fe-button fe-button--quiet"
            onClick={() => onSwitchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          >
            {mode === 'signIn' ? copy.toSignUp : copy.toSignIn}
          </button>
        </p>
      ) : null}
    </div>
  );
}
