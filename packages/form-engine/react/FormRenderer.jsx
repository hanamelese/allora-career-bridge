import { useEffect, useRef } from 'react';
import { useFormEngine } from './useFormEngine.js';
import { getFieldComponent } from './fields/index.js';
import { ReadAloudButton } from './ReadAloudButton.jsx';
import { VoiceAnswer } from './VoiceAnswer.jsx';
import { ReviewStep } from './ReviewStep.jsx';
import './form-engine.css';

const COPY = {
  en: {
    next: 'Next',
    back: 'Back',
    review: 'Check my answers',
    progress: (position, total) => `Question ${position} of ${total}`,
    done: 'Your answers have been sent',
    doneDetail: 'Thank you. There is nothing more you need to do.',
    empty: 'This form has no questions switched on yet.',
    noTimeLimit: 'There is no time limit. You can take as long as you need.',
  },
  am: {
    next: 'ቀጣይ',
    back: 'ተመለስ',
    review: 'መልሶቼን አረጋግጥ',
    progress: (position, total) => `ጥያቄ ${position} ከ${total}`,
    done: 'መልሶችዎ ተልከዋል',
    doneDetail: 'እናመሰግናለን። ከዚህ በላይ ማድረግ ያለብዎት ነገር የለም።',
    empty: 'በዚህ ቅጽ ላይ ገና የበራ ጥያቄ የለም።',
    noTimeLimit: 'የጊዜ ገደብ የለም። የሚፈልጉትን ያህል ጊዜ መውሰድ ይችላሉ።',
  },
};

/**
 * Renders a form from its configuration: one question per screen, a review
 * of every answer, then submission.
 *
 * This is the only renderer. The dashboard preview and the embedded form
 * both mount this component, which is what guarantees a partner is looking
 * at the real learner experience rather than an impression of it.
 *
 * There is deliberately no timer anywhere in here. Progress is never
 * discarded for taking too long.
 */
export function FormRenderer({ config, settings = {}, onSubmit, renderIcon }) {
  const engine = useFormEngine(config, settings, { onSubmit });
  const headingRef = useRef(null);
  const hasNavigatedRef = useRef(false);

  const language = settings.language ?? config.defaultLanguage ?? 'en';
  const copy = COPY[language] ?? COPY.en;

  const { question, isReviewing, isSubmitted, error, progress } = engine;
  const stepKey = isReviewing ? 'review' : question?.key;

  /* Moving to another question is this form's equivalent of a page load,
     so focus goes to the new question's heading. Without it, focus would
     stay on the Next button and a screen-reader user would never hear the
     question they just moved to. */
  useEffect(() => {
    if (!stepKey) return;

    const heading = headingRef.current ?? document.querySelector('[data-question-heading]');

    if (heading && hasNavigatedRef.current) {
      heading.focus();
    }

    hasNavigatedRef.current = true;
  }, [stepKey]);

  if (isSubmitted) {
    return (
      <div className="fe-form" data-language={language}>
        <div className="fe-done" role="status">
          <p className="fe-done__icon" aria-hidden="true">
            ✓
          </p>
          <h2 className="fe-done__heading">{copy.done}</h2>
          <p className="fe-question__help">{copy.doneDetail}</p>
        </div>
      </div>
    );
  }

  if (isReviewing) {
    return (
      <div className="fe-form" data-language={language} data-low-literacy={settings.lowLiteracy || undefined}>
        <ReviewStep
          items={engine.reviewItems}
          summary={engine.reviewSummary}
          language={language}
          readAloud={settings.readAloud}
          onEdit={engine.goTo}
          onSubmit={engine.submit}
          onBack={engine.back}
        />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="fe-form" data-language={language}>
        <p className="fe-question__help">{copy.empty}</p>
      </div>
    );
  }

  const FieldComponent = getFieldComponent(question.type);
  const helpId = question.helpText ? `fe-${question.key}-help` : null;
  const noticeId = question.notice ? `fe-${question.key}-notice` : null;
  const errorId = `fe-${question.key}-error`;

  /* Error first: a learner hears the problem before the hint. */
  const describedBy =
    [error ? errorId : null, noticeId, helpId].filter(Boolean).join(' ') || undefined;

  /* Simple-words mode reads each question out as it arrives, which is the
     point of that mode - but only once the learner has moved at least
     once, so nothing starts talking the instant the page opens. */
  const autoPlayAudio = Boolean(settings.lowLiteracy && settings.readAloud && hasNavigatedRef.current);

  return (
    <div
      className="fe-form"
      data-language={language}
      data-low-literacy={settings.lowLiteracy || undefined}
    >
      <div className="fe-progress">
        <p className="fe-progress__label">{copy.progress(progress.position, progress.total)}</p>
        <div
          className="fe-progress__track"
          role="progressbar"
          aria-valuenow={progress.position}
          aria-valuemin={1}
          aria-valuemax={progress.total}
          aria-label={copy.progress(progress.position, progress.total)}
        >
          <div
            className="fe-progress__bar"
            style={{ width: `${(progress.position / Math.max(progress.total, 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="fe-question">
        <div className="fe-question__title">
          {settings.lowLiteracy && question.icon && renderIcon ? (
            <span className="fe-question__icon" aria-hidden="true">
              {renderIcon(question.icon)}
            </span>
          ) : null}

          <h2
            className="fe-question__heading"
            ref={headingRef}
            tabIndex={-1}
            data-question-heading
          >
            {question.label}
          </h2>

          {settings.readAloud ? (
            <ReadAloudButton
              text={question.readAloudText}
              language={language}
              autoPlay={autoPlayAudio}
            />
          ) : null}
        </div>

        {question.notice ? (
          <p className="fe-question__note" id={noticeId}>
            {question.notice}
          </p>
        ) : null}

        {question.helpText ? (
          <p className="fe-question__help" id={helpId}>
            {question.helpText}
          </p>
        ) : null}

        <div className="fe-question__field">
          <FieldComponent
            question={question}
            value={engine.currentAnswer}
            onChange={engine.answer}
            describedBy={describedBy}
            hasError={Boolean(error)}
            renderIcon={renderIcon}
          />
        </div>

        {error ? (
          <p className="fe-error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}

        {question.voiceInput ? (
          <VoiceAnswer
            question={question}
            language={language}
            onAccept={(value) => {
              engine.answer(value);
              engine.confirmAnswer(question.key);
            }}
          />
        ) : null}
      </div>

      <div className="fe-actions">
        {!engine.isFirst ? (
          <button type="button" className="fe-button" onClick={engine.back}>
            {copy.back}
          </button>
        ) : null}

        <button type="button" className="fe-button fe-button--primary" onClick={engine.next}>
          {engine.isLast ? copy.review : copy.next}
        </button>
      </div>

      <p className="fe-question__footnote">{copy.noTimeLimit}</p>
    </div>
  );
}
