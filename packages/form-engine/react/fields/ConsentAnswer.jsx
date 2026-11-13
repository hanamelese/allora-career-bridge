/**
 * Permission, as a single checkbox.
 *
 * The wording the learner is agreeing to is the checkbox's own label, so
 * it cannot be separated from the act of agreeing.
 */
export function ConsentAnswer({ question, value, onChange, describedBy, hasError }) {
  const id = `fe-${question.key}`;

  return (
    <div className={`fe-consent${hasError ? ' fe-consent--invalid' : ''}`}>
      <input
        type="checkbox"
        id={id}
        className="fe-consent__input"
        checked={value === true}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label className="fe-consent__label" htmlFor={id}>
        {question.consentText ?? question.label}
      </label>
    </div>
  );
}
