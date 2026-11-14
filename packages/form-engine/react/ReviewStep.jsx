import { ReadAloudButton } from './ReadAloudButton.jsx';

const COPY = {
  en: {
    heading: 'Check your answers',
    intro: 'Read through your answers. You can change any of them before you send the form.',
    change: 'Change',
    changeFor: (label) => `Change your answer to: ${label}`,
    submit: 'Send my answers',
    sending: 'Sending your answers…',
    sendFailed:
      'Your answers could not be sent. Check your internet connection, then press Send my answers again. Your answers are still here.',
    back: 'Back',
    private: 'Private',
    privateNote: 'Answers marked private are not shared with employers.',
    supportSection: 'Support and accommodations (private)',
  },
  am: {
    heading: 'መልሶችዎን ያረጋግጡ',
    intro: 'መልሶችዎን ያንብቡ። ከመላክዎ በፊት ማንኛውንም መቀየር ይችላሉ።',
    change: 'ቀይር',
    changeFor: (label) => `የዚህን መልስ ይቀይሩ፦ ${label}`,
    submit: 'መልሶቼን ላክ',
    sending: 'መልሶችዎ በመላክ ላይ ናቸው…',
    sendFailed: 'መልሶችዎ ሊላኩ አልቻሉም። የኢንተርኔት ግንኙነትዎን ያረጋግጡ፣ ከዚያ «መልሶቼን ላክ»ን እንደገና ይጫኑ። መልሶችዎ አልጠፉም።',
    back: 'ተመለስ',
    private: 'የግል',
    privateNote: 'የግል ተብለው የተመለከቱ መልሶች ለአሠሪዎች አይጋሩም።',
    supportSection: 'ድጋፍ እና ማመቻቻዎች (የግል)',
  },
};

/**
 * The last screen before submitting.
 *
 * Every answer is listed with a way back to the question that produced it,
 * and each change button carries the question in its accessible name - so
 * a screen-reader user hears "Change your answer to: Full name" rather
 * than a list of buttons all called "Change".
 */
export function ReviewStep({ items, summary, language, onEdit, onSubmit, onBack, isSending = false, sendFailed = false }) {
  const copy = COPY[language] ?? COPY.en;
  const hasPrivateAnswers = items.some((item) => item.isPrivate);
  /* Support and accommodation answers are listed apart, as they were
     asked apart. */
  const supportItems = items.filter((item) => item.section === 'support');

  function renderList(list) {
    if (list.length === 0) return null;

    return (
      <dl className="fe-review__list">
        {list.map((item) => (
          <div className="fe-review__item" key={item.key}>
            <dt className="fe-review__term">
              {item.label}
              {item.isPrivate ? <span className="fe-review__private">{copy.private}</span> : null}
            </dt>
            <dd className="fe-review__answer">{item.answerText}</dd>
            <button
              type="button"
              className="fe-button fe-button--quiet"
              aria-label={copy.changeFor(item.label)}
              onClick={() => onEdit(item.key)}
            >
              {copy.change}
            </button>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="fe-review">
      <div className="fe-question__title">
        <h2 className="fe-question__heading" data-question-heading tabIndex={-1}>
          {copy.heading}
        </h2>
        <ReadAloudButton text={`${copy.heading}. ${summary}`} language={language} />
      </div>

      <p className="fe-question__help">{copy.intro}</p>

      {renderList(items.filter((item) => item.section !== 'support'))}

      {supportItems.length > 0 ? (
        <section className="fe-review__section" aria-labelledby="fe-review-support">
          <h3 className="fe-review__section-heading" id="fe-review-support">
            {copy.supportSection}
          </h3>
          {renderList(supportItems)}
        </section>
      ) : null}

      {hasPrivateAnswers ? <p className="fe-question__note">{copy.privateNote}</p> : null}

      {sendFailed && !isSending ? (
        <p className="fe-error" role="alert">
          {copy.sendFailed}
        </p>
      ) : null}

      {/* Announced politely while the answers are on their way. */}
      <p className="fe-visually-hidden" role="status" aria-live="polite">
        {isSending ? copy.sending : ''}
      </p>

      <div className="fe-actions">
        <button type="button" className="fe-button" onClick={onBack} disabled={isSending}>
          {copy.back}
        </button>
        {/* aria-disabled rather than disabled, so focus stays on the
            button while the answers are sent. */}
        <button
          type="button"
          className="fe-button fe-button--primary"
          aria-disabled={isSending || undefined}
          onClick={isSending ? undefined : onSubmit}
        >
          {isSending ? copy.sending : copy.submit}
        </button>
      </div>
    </div>
  );
}
