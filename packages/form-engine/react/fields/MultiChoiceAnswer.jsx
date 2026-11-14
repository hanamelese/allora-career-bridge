import { SelectionBar } from './SelectionBar.jsx';

/**
 * Any number of answers from a list.
 *
 * Native checkboxes, each its own Tab stop. Space toggles, as always; Enter
 * toggles too, because learners expect Enter to act on what is focused.
 * Enter does not move on here - a learner may want several - so the Next
 * button does that.
 *
 * Used for the support and accommodation questions, so the notice above it
 * - that no diagnosis or proof is needed - is part of the question itself.
 */
export function MultiChoiceAnswer({ question, value, onChange, describedBy, hasError, renderIcon }) {
  const selected = Array.isArray(value) ? value : [];
  /* Pictures help everyone, so they are always shown, not only with simple words. */
  const showIcons = true;

  function toggle(optionValue, checked) {
    onChange(
      checked
        ? [...selected, optionValue]
        : selected.filter((current) => current !== optionValue),
    );
  }

  const summary = question.options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label)
    .join(', ');

  return (
    <SelectionBar
      question={question}
      summary={summary}
      hasError={hasError}
      describedBy={describedBy}
    >
      <fieldset
        className={`fe-options${hasError ? ' fe-options--invalid' : ''}`}
        aria-describedby={describedBy}
      >
        <legend className="fe-visually-hidden">{question.label}</legend>

        {question.options.map((option) => {
          const id = `fe-${question.key}-${String(option.value)}`;
          const isChecked = selected.includes(option.value);

          return (
            <label className="fe-option" htmlFor={id} key={String(option.value)}>
              <input
                type="checkbox"
                id={id}
                className="fe-option__input"
                data-option
                checked={isChecked}
                onChange={(event) => toggle(option.value, event.target.checked)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    toggle(option.value, !isChecked);
                  }
                }}
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
    </SelectionBar>
  );
}
