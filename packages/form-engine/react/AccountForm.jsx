import { useMemo, useRef, useState } from 'react';
import {
  ACCOUNT_COPY,
  getAccountQuestions,
  getEnabledProviders,
  validateAccount,
} from '../src/accountForm.js';
import { AnswerTools } from './AnswerTools.jsx';
import { BrandIcon } from './brandIcons.jsx';

/**
 * The accessible Sign up / Sign in form.
 *
 * It authenticates no one itself. It is a component a partner puts in
 * place of their own sign-in screen:
 *
 * - each social button is a real link to the address the partner set,
 *   normally the start of their own OAuth flow; a host can intercept it
 *   with `onSocialSignIn(provider)` (the dashboard preview does, so a
 *   partner trying the form is not sent away);
 * - email and password are checked here for shape only and handed to the
 *   host's `onSubmit`, which signs the person in or up.
 *
 * Everything is reachable by Tab in reading order, every control has a
 * name that says what it does ("Sign up with Google"), and errors are
 * summarised at the top and repeated beside each field, each naming its
 * question.
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

  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const summaryRef = useRef(null);
  const fieldRefs = useRef({});

  const hasEmailPassword = questions.length > 0;

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

  function handleSubmit(event) {
    event.preventDefault();

    const labels = Object.fromEntries(questions.map((question) => [question.key, question.label]));
    const result = validateAccount(config, answers, { language, labels });

    if (!result.valid) {
      setErrors(result.errors);
      /* The summary is announced and focused; each line links to its field. */
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setErrors({});
    setIsDone(true);
    onSubmit?.(result.data, { mode });
  }

  function focusField(key) {
    fieldRefs.current[key]?.focus();
  }

  const errorKeys = Object.keys(errors);

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

  return (
    <div className="fe-account">
      <header className="fe-account__header">
        <h2 className="fe-account__title">{title}</h2>
        <p className="fe-question__help">{mode === 'signIn' ? copy.signInIntro : copy.signUpIntro}</p>
      </header>

      {errorKeys.length > 0 ? (
        <div className="fe-account__summary" role="alert" tabIndex={-1} ref={summaryRef}>
          <p className="fe-account__summary-title">{copy.errorSummary(errorKeys.length)}</p>
          <ul>
            {errorKeys.map((key) => (
              <li key={key}>
                <a
                  href={`#fe-account-${key}`}
                  onClick={(event) => {
                    event.preventDefault();
                    focusField(key);
                  }}
                >
                  {errors[key]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {providers.length > 0 ? (
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
      ) : null}

      {providers.length > 0 && hasEmailPassword ? (
        <div className="fe-account__divider">
          <span aria-hidden="true">{copy.or}</span>
          <span className="fe-visually-hidden">{copy.orLong(mode)}</span>
        </div>
      ) : null}

      {!hasEmailPassword && providers.length === 0 ? (
        <p className="fe-question__note">{copy.noOptions}</p>
      ) : null}

      {hasEmailPassword ? (
        <form className="fe-account__form" noValidate onSubmit={handleSubmit}>
          <p className="fe-progress__note">
            {language === 'am'
              ? '* ምልክት ያላቸው መስኮች መሞላት አለባቸው።'
              : 'Fields marked * must be filled in.'}
          </p>

          {questions.map((question) => {
            const id = `fe-account-${question.key}`;
            const helpId = question.helpText ? `${id}-help` : null;
            const errorId = errors[question.key] ? `${id}-error` : null;
            const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;
            const isPassword = question.type === 'password';

            return (
              <div className="fe-account__field" key={question.key}>
                <label className="fe-account__label" htmlFor={id}>
                  {renderIcon && question.icon ? (
                    <span className="fe-question__icon fe-question__icon--small" aria-hidden="true">
                      {renderIcon(question.icon)}
                    </span>
                  ) : null}
                  {question.label}
                  {question.required ? (
                    <span className="fe-required">
                      <span aria-hidden="true"> *</span>
                      <span className="fe-visually-hidden"> {language === 'am' ? '(ግዴታ)' : '(required)'}</span>
                    </span>
                  ) : null}
                </label>

                {question.helpText ? (
                  <p className="fe-question__help" id={helpId}>
                    {question.helpText}
                  </p>
                ) : null}

                <div className="fe-account__input-row">
                  <input
                    id={id}
                    ref={(element) => {
                      fieldRefs.current[question.key] = element;
                    }}
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
                  <p className="fe-error" id={errorId}>
                    {errors[question.key]}
                  </p>
                ) : null}

                {/* Read and clear for every field; speaking is offered only
                    where the catalogue allows it, never for a password. */}
                {isPassword ? null : (
                  <AnswerTools
                    question={question}
                    value={answers[question.key]}
                    language={language}
                    onAnswer={(value) => update(question.key, value)}
                    onClear={() => update(question.key, undefined)}
                    onFocusField={() => requestAnimationFrame(() => focusField(question.key))}
                  />
                )}
              </div>
            );
          })}

          <button type="submit" className="fe-button fe-button--primary fe-account__submit">
            {mode === 'signIn' ? copy.submitSignIn : copy.submitSignUp}
          </button>
        </form>
      ) : null}

      {onSwitchMode ? (
        <p className="fe-account__switch">
          <button type="button" className="fe-button fe-button--quiet" onClick={() => onSwitchMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
            {mode === 'signIn' ? copy.toSignUp : copy.toSignIn}
          </button>
        </p>
      ) : null}
    </div>
  );
}
