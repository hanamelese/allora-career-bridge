/**
 * One answer chosen from a list.
 *
 * Native radios, so arrow-key navigation and group semantics come from the
 * browser. Option values can be booleans (a yes/no question), so they are
 * compared as strings in the markup and mapped back on change.
 */
export function ChoiceAnswer({ question, value, onChange, describedBy, hasError, renderIcon }) {
  const showIcons = question.lowLiteracy;

  function handleChange(rawValue) {
    const option = question.options.find((candidate) => String(candidate.value) === rawValue);
    onChange(option ? option.value : rawValue);
  }

  return (
    <fieldset
      className={`fe-options${hasError ? ' fe-options--invalid' : ''}`}
      aria-describedby={describedBy}
    >
      <legend className="fe-visually-hidden">{question.label}</legend>

      {question.options.map((option) => {
        const id = `fe-${question.key}-${String(option.value)}`;

        return (
          <label className="fe-option" htmlFor={id} key={String(option.value)}>
            <input
              type="radio"
              id={id}
              name={`fe-${question.key}`}
              className="fe-option__input"
              value={String(option.value)}
              checked={String(value) === String(option.value)}
              onChange={(event) => handleChange(event.target.value)}
            />
            {showIcons && option.icon && renderIcon ? (
              <span className="fe-option__icon" aria-hidden="true">
                {renderIcon(option.icon)}
              </span>
            ) : null}
            <span className="fe-option__label">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
