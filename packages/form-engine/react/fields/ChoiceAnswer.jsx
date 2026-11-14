import { useRef } from 'react';
import { SelectionBar } from './SelectionBar.jsx';

/**
 * One answer chosen from a list.
 *
 * Each option is a button with `role="radio"`, inside a `radiogroup`, so a
 * screen reader still hears "radio button, 2 of 4, checked". Unlike native
 * radios, every option is its own Tab stop - learners asked to be able to
 * Tab through the choices - and the arrow keys move between them too.
 *
 * Space or a click chooses. Enter chooses and moves on to the next
 * question, which is how a keyboard user answers in one key press. It
 * never submits the form: the engine only moves forward, and submitting
 * happens on the review screen.
 *
 * Option values can be booleans (a yes/no question), so they are compared
 * as strings.
 */
export function ChoiceAnswer({ question, value, onChange, onCommit, describedBy, hasError, renderIcon }) {
  const optionRefs = useRef([]);
  /* Pictures help everyone, so they are always shown, not only with simple words. */
  const showIcons = true;
  const selected = question.options.find((option) => String(option.value) === String(value));

  function focusOption(index) {
    const count = question.options.length;
    optionRefs.current[(index + count) % count]?.focus();
  }

  function handleKeyDown(event, option, index) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusOption(index + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusOption(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusOption(0);
        break;
      case 'End':
        event.preventDefault();
        focusOption(question.options.length - 1);
        break;
      case 'Enter':
        /* Handled here rather than left to the button's click, so Enter can
           both choose and move on. */
        event.preventDefault();
        onChange(option.value);
        onCommit?.();
        break;
      default:
    }
  }

  return (
    <SelectionBar
      question={question}
      summary={selected?.label}
      hasError={hasError}
      describedBy={describedBy}
    >
      <div
        className={`fe-options${hasError ? ' fe-options--invalid' : ''}`}
        role="radiogroup"
        aria-label={question.label}
        aria-required={question.required || undefined}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
      >
        {question.options.map((option, index) => {
          const isChecked = selected !== undefined && String(selected.value) === String(option.value);

          return (
            <button
              type="button"
              role="radio"
              aria-checked={isChecked}
              className={`fe-option${isChecked ? ' fe-option--checked' : ''}`}
              key={String(option.value)}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              data-option
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleKeyDown(event, option, index)}
            >
              <span className="fe-option__radio" aria-hidden="true" />
              {showIcons && option.icon && renderIcon ? (
                <span className="fe-option__icon" aria-hidden="true">
                  {renderIcon(option.icon)}
                </span>
              ) : null}
              <span className="fe-option__label">{option.label}</span>
            </button>
          );
        })}
      </div>
    </SelectionBar>
  );
}
