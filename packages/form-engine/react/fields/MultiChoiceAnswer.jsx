/**
 * Any number of answers from a list.
 *
 * Native checkboxes. Used for the support and accommodation questions, so
 * the notice above it - that no diagnosis or proof is needed - is part of
 * the question itself, not an afterthought here.
 */
export function MultiChoiceAnswer({ question, value, onChange, describedBy, hasError, renderIcon }) {
  const selected = Array.isArray(value) ? value : [];
  const showIcons = question.lowLiteracy;

  function toggle(optionValue, checked) {
    onChange(
      checked
        ? [...selected, optionValue]
        : selected.filter((current) => current !== optionValue),
    );
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
              type="checkbox"
              id={id}
              className="fe-option__input"
              checked={selected.includes(option.value)}
              onChange={(event) => toggle(option.value, event.target.checked)}
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
