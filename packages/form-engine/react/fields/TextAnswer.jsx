/** A written answer: one line, or several for a longer one. */
const INPUT_TYPE = { email: 'email', url: 'url', phone: 'tel' };
const INPUT_MODE = { email: 'email', url: 'url', phone: 'tel' };

/**
 * Enter on a one-line answer moves to the next question (after the engine
 * checks it). In a longer answer Enter is a new line, so Ctrl+Enter or
 * Cmd+Enter moves on instead. Neither ever submits the form.
 */
export function TextAnswer({ question, value, onChange, onCommit, describedBy, hasError }) {
  const isLong = question.type === 'longText';
  const Element = isLong ? 'textarea' : 'input';

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    if (isLong && !(event.ctrlKey || event.metaKey)) return;

    event.preventDefault();
    onCommit?.();
  }

  return (
    <>
      {/* The question is the heading above; the label is here for
          assistive technology without repeating the text on screen. */}
      <label className="fe-visually-hidden" htmlFor={`fe-${question.key}`}>
        {question.label}
      </label>

      <Element
        id={`fe-${question.key}`}
        className={`fe-input${hasError ? ' fe-input--invalid' : ''}`}
        value={value ?? ''}
        rows={isLong ? 4 : undefined}
        type={isLong ? undefined : INPUT_TYPE[question.type] ?? 'text'}
        inputMode={isLong ? undefined : INPUT_MODE[question.type]}
        autoComplete={question.autocomplete}
        aria-required={question.required || undefined}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </>
  );
}
