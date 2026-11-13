import { ReadAloudButton } from './ReadAloudButton.jsx';

const COPY = {
  en: {
    heading: 'Check your answers',
    intro: 'Read through your answers. You can change any of them before you send the form.',
    change: 'Change',
    changeFor: (label) => `Change your answer to: ${label}`,
    submit: 'Send my answers',
    back: 'Back',
    private: 'Private',
    privateNote: 'Answers marked private are not shared with employers.',
  },
  am: {
    heading: 'መልሶችዎን ያረጋግጡ',
    intro: 'መልሶችዎን ያንብቡ። ከመላክዎ በፊት ማንኛውንም መቀየር ይችላሉ።',
    change: 'ቀይር',
    changeFor: (label) => `የዚህን መልስ ይቀይሩ፦ ${label}`,
    submit: 'መልሶቼን ላክ',
    back: 'ተመለስ',
    private: 'የግል',
    privateNote: 'የግል ተብለው የተመለከቱ መልሶች ለአሠሪዎች አይጋሩም።',
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
export function ReviewStep({ items, summary, language, readAloud, onEdit, onSubmit, onBack }) {
  const copy = COPY[language] ?? COPY.en;
  const hasPrivateAnswers = items.some((item) => item.isPrivate);

  return (
    <div className="fe-review">
      <div className="fe-question__title">
        <h2 className="fe-question__heading" data-question-heading tabIndex={-1}>
          {copy.heading}
        </h2>
        {readAloud ? (
          <ReadAloudButton text={`${copy.heading}. ${summary}`} language={language} />
        ) : null}
      </div>

      <p className="fe-question__help">{copy.intro}</p>

      <dl className="fe-review__list">
        {items.map((item) => (
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

      {hasPrivateAnswers ? <p className="fe-question__note">{copy.privateNote}</p> : null}

      <div className="fe-actions">
        <button type="button" className="fe-button" onClick={onBack}>
          {copy.back}
        </button>
        <button type="button" className="fe-button fe-button--primary" onClick={onSubmit}>
          {copy.submit}
        </button>
      </div>
    </div>
  );
}
