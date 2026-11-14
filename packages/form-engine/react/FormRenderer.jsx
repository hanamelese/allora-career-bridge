import { useEffect, useRef, useState } from 'react';
import { useFormEngine } from './useFormEngine.js';
import { getFieldComponent } from './fields/index.js';
import { ReadAloudButton } from './ReadAloudButton.jsx';
import { AnswerTools } from './AnswerTools.jsx';
import { ReviewStep } from './ReviewStep.jsx';
import { FormSettings } from './FormSettings.jsx';
import { AccountForm } from './AccountForm.jsx';
import { useLearnerPreferences } from './learnerPreferences.js';
import { progressKeyFor } from './progressStore.js';
import './form-engine.css';

/* A full stop, unless the text already ends a sentence ("…need?"). */
function endSentence(text, stop = '.') {
  return /[.?!።?]$/.test(text) ? text : `${text}${stop}`;
}

const COPY = {
  en: {
    next: 'Next',
    back: 'Back',
    review: 'Check my answers',
    progress: (position, total) => `Question ${position} of ${total}`,
    done: 'Your answers have been sent',
    doneDetail: 'Thank you. There is nothing more you need to do.',
    saved: 'Saved in this browser tab until you send the form or close the tab. Private answers and files are not saved.',
    welcomeBack: 'Welcome back. We kept your answers from before, so you can carry on where you stopped.',
    notKept: (labels) => `To protect your privacy these were not kept, so please add them again: ${endSentence(labels)}`,
    startOver: 'Start over',
    startOverDetail: 'Start over and clear the answers kept in this tab',
    empty: 'This form has no questions switched on yet.',
    noTimeLimit: 'There is no time limit. You can take as long as you need.',
    requiredNote: 'Questions marked * must be answered. All other questions are optional.',
    supportSection: 'Support and accommodations',
    supportSectionNote: 'Private. Only the organisation sees these answers, and you never have to explain why.',
    required: '(required)',
    optional: '(optional)',
  },
  am: {
    next: 'ቀጣይ',
    back: 'ተመለስ',
    review: 'መልሶቼን አረጋግጥ',
    progress: (position, total) => `ጥያቄ ${position} ከ${total}`,
    done: 'መልሶችዎ ተልከዋል',
    doneDetail: 'እናመሰግናለን። ከዚህ በላይ ማድረግ ያለብዎት ነገር የለም።',
    saved: 'ቅጹን እስኪልኩ ወይም ይህን ትር እስኪዘጉ ድረስ በዚህ ትር ተቀምጧል። የግል መልሶችና ፋይሎች አይቀመጡም።',
    welcomeBack: 'እንኳን ደህና መጡ። ካቆሙበት እንዲቀጥሉ የቀድሞ መልሶችዎን አስቀምጠናል።',
    notKept: (labels) => `ግላዊነትዎን ለመጠበቅ እነዚህ አልተቀመጡም፤ እባክዎ እንደገና ያስገቡ፦ ${endSentence(labels, '።')}`,
    startOver: 'እንደገና ጀምር',
    startOverDetail: 'እንደገና ይጀምሩ እና በዚህ ትር የተቀመጡትን መልሶች ያጥፉ',
    empty: 'በዚህ ቅጽ ላይ ገና የበራ ጥያቄ የለም።',
    noTimeLimit: 'የጊዜ ገደብ የለም። የሚፈልጉትን ያህል ጊዜ መውሰድ ይችላሉ።',
    requiredNote: '* ምልክት ያላቸው ጥያቄዎች መመለስ አለባቸው። ሌሎቹ ጥያቄዎች አማራጭ ናቸው።',
    supportSection: 'ድጋፍ እና ማመቻቻዎች',
    supportSectionNote: 'የግል። እነዚህን መልሶች የሚያየው ድርጅቱ ብቻ ነው፤ ምክንያቱን ማስረዳት አያስፈልግዎትም።',
    required: '(ግዴታ)',
    optional: '(አማራጭ)',
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
 *
 * `referral` is supplied by the host for the referral step:
 *   partners          [{ id, name }] - the organisation's referral partners
 *   organisationName  shown in the SMS preview
 *   onSend(request)   sends the link; resolves { results: [{ partnerId, status }] }
 * The host decides how sending happens (the embed uses the public API, the
 * dashboard preview its signed-in test endpoint); the form never holds a
 * phone number or a credential.
 */
export function FormRenderer({
  config,
  settings = {},
  onSubmit,
  renderIcon,
  referral,
  onSocialSignIn,
  onSwitchMode,
  /* Where this tab keeps the learner's place; by default one per form
     version. `null` turns saving off. */
  progressKey,
}) {
  /* The learner's own display choices: contrast, text size and simple
     words. The host may only suggest where simple words start. */
  const [preferences, setPreferences] = useLearnerPreferences(settings);
  const languages = config.languages?.length ? config.languages : ['en'];
  const [language, setLanguage] = useState(() => {
    const wanted = settings.language ?? config.defaultLanguage ?? 'en';
    return languages.includes(wanted) ? wanted : languages[0];
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { lowLiteracy } = preferences;

  /* Which referral partners a link has already gone to. Held here so it
     survives moving between questions. */
  const [referralStatus, setReferralStatus] = useState({});
  const engine = useFormEngine(
    config,
    { language, lowLiteracy, referralPartners: referral?.partners },
    {
      onSubmit,
      /* Never for the sign-in form: it holds a password. */
      progressKey:
        config.type === 'account' ? null : progressKey === undefined ? progressKeyFor(config) : progressKey,
    },
  );

  /* "Welcome back" shows on the screen the learner returns to, and goes
     once they move on. */
  const restoredStepRef = useRef(engine.isReviewing ? 'review' : engine.question?.key);
  const currentStep = engine.isReviewing ? 'review' : engine.question?.key;
  const restoreNotice =
    engine.wasRestored && currentStep === restoredStepRef.current ? (
      <div className="fe-restored" role="status">
        <p>{(COPY[language] ?? COPY.en).welcomeBack}</p>
        {engine.notKept.length > 0 ? (
          <p>{(COPY[language] ?? COPY.en).notKept(engine.notKept.join(', '))}</p>
        ) : null}
        <button type="button" className="fe-button fe-button--quiet" onClick={engine.startOver}>
          {(COPY[language] ?? COPY.en).startOver}
          <span className="fe-visually-hidden">: {(COPY[language] ?? COPY.en).startOverDetail}</span>
        </button>
      </div>
    ) : null;
  const headingRef = useRef(null);
  const fieldRef = useRef(null);
  const hasNavigatedRef = useRef(false);

  const copy = COPY[language] ?? COPY.en;

  const { question, isReviewing, isSubmitted, error, progress } = engine;
  const stepKey = isReviewing ? 'review' : question?.key;

  /* Moving to another question is this form's equivalent of a page load,
     so focus goes to the new question's heading. Without it, focus would
     stay on the Next button and a screen-reader user would never hear the
     question they just moved to. */
  /* Compared with the screen last shown rather than set as a flag, so a
     second run of the effect (React's development mode does that) never
     counts as moving. */
  const lastStepRef = useRef(stepKey);

  useEffect(() => {
    if (!stepKey || stepKey === lastStepRef.current) return;

    lastStepRef.current = stepKey;
    hasNavigatedRef.current = true;

    const heading = headingRef.current ?? document.querySelector('[data-question-heading]');
    heading?.focus();
  }, [stepKey]);

  /**
   * Every screen of the form shares one frame: the settings gear and panel
   * on top, and the form itself below. While the panel is open the form is
   * blurred and `inert`, so it neither distracts nor takes focus.
   */
  function frame(content) {
    return (
      <div
        className="fe-form"
        lang={language}
        data-language={language}
        data-low-literacy={lowLiteracy || undefined}
        data-contrast={preferences.contrast}
        data-text-size={preferences.textSize}
      >
        <FormSettings
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          preferences={preferences}
          onChange={setPreferences}
          language={language}
          languages={languages}
          onLanguageChange={setLanguage}
        />

        <div
          className={`fe-form__body${isSettingsOpen ? ' fe-form__body--blurred' : ''}`}
          inert={isSettingsOpen}
        >
          {content}
        </div>
      </div>
    );
  }

  if (config.type === 'account') {
    return frame(
      <AccountForm
        config={config}
        language={language}
        lowLiteracy={lowLiteracy}
        onSubmit={onSubmit}
        onSocialSignIn={onSocialSignIn}
        onSwitchMode={onSwitchMode}
        renderIcon={renderIcon}
      />,
    );
  }

  if (isSubmitted) {
    return frame(
        <div className="fe-done" role="status">
          <p className="fe-done__icon" aria-hidden="true">
            ✓
          </p>
          <h2 className="fe-done__heading">{copy.done}</h2>
          <p className="fe-question__help">{copy.doneDetail}</p>
        </div>,
    );
  }

  if (isReviewing) {
    return frame(
      <>
        {restoreNotice}
        <ReviewStep
          items={engine.reviewItems}
          summary={engine.reviewSummary}
          language={language}
          onEdit={engine.goTo}
          onSubmit={engine.submit}
          onBack={engine.back}
          isSending={engine.isSending}
          sendFailed={engine.sendFailed}
        />
      </>,
    );
  }

  if (!question) {
    return frame(<p className="fe-question__help">{copy.empty}</p>);
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
  const autoPlayAudio = Boolean(lowLiteracy && hasNavigatedRef.current);

  return frame(
    <>
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
        <p className="fe-progress__note">{copy.requiredNote}</p>
        {engine.hasSaved ? (
          <p className="fe-progress__saved">
            <span aria-hidden="true">✓ </span>
            {copy.saved}
          </p>
        ) : null}
      </div>

      {restoreNotice}

      <div className="fe-question">
        {/* The support and accommodation questions sit in a section of
            their own. The band is for the eye; the heading carries the
            section's name for a screen reader, which lands on it. */}
        {question.section === 'support' ? (
          <div className="fe-section-band" aria-hidden="true">
            <span className="fe-section-band__name">{copy.supportSection}</span>
            <span className="fe-section-band__note">{copy.supportSectionNote}</span>
          </div>
        ) : null}

        <div className="fe-question__title">
          {question.icon && renderIcon ? (
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
            {question.section === 'support' ? (
              <span className="fe-visually-hidden">{copy.supportSection}, {copy.supportSectionNote} </span>
            ) : null}
            {question.label}
            {/* Required status is said in words as well as shown, so it
                never depends on the asterisk or on colour. */}
            {question.required ? (
              <span className="fe-required">
                <span aria-hidden="true"> *</span>
                <span className="fe-visually-hidden"> {copy.required}</span>
              </span>
            ) : (
              <span className="fe-optional"> {copy.optional}</span>
            )}
          </h2>

          <ReadAloudButton
            text={question.readAloudText}
            language={language}
            autoPlay={autoPlayAudio}
          />
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

        <div className="fe-question__field" ref={fieldRef}>
          <FieldComponent
            /* Keyed by question so per-question state (an open selection
               bar, for one) never carries over to the next question. */
            key={question.key}
            question={question}
            value={engine.currentAnswer}
            onChange={engine.answer}
            onCommit={engine.next}
            answers={engine.answers}
            referral={referral}
            referralStatus={referralStatus}
            onReferralStatus={setReferralStatus}
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

        {/* An upload has its own Remove and status; reading back or
            speaking a file makes no sense. */}
        {question.type === 'file' ? null : (
        <AnswerTools
          key={question.key}
          question={
            /* A tick box is one press; speaking "yes" to give permission
               is not offered, so consent is never given by mishearing. */
            question.type === 'consent' ? { ...question, voiceInput: false } : question
          }
          value={engine.currentAnswer}
          language={language}
          onAnswer={engine.answer}
          onClear={engine.clear}
          onFocusField={() => {
            /* After the value changes, so focus lands on the updated control. */
            requestAnimationFrame(() => {
              fieldRef.current
                ?.querySelector('input:not([type=hidden]), textarea, .fe-select__bar')
                ?.focus();
            });
          }}
        />
        )}
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
    </>,
  );
}
