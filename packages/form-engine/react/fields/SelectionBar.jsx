import { useEffect, useId, useRef, useState } from 'react';

const COPY = {
  en: { notChosen: 'Not chosen yet', show: 'Show the choices', hide: 'Hide the choices' },
  am: { notChosen: 'ገና አልተመረጠም', show: 'አማራጮቹን አሳይ', hide: 'አማራጮቹን ደብቅ' },
};

/**
 * A selection question as one bar above its options.
 *
 * The options show from the start, so every choice is visible without a
 * click. The bar is a real button with `aria-expanded`, so a learner can
 * still fold the list away (and open it again) with a mouse, a finger,
 * Enter or Space; folded, it shows the question and the current answer.
 *
 * Starting open does not move focus - the page stays where the learner
 * is. Opening it later moves focus to the chosen option (or the first
 * one), so a keyboard user lands where they can act. A validation error
 * opens it, so the learner is never asked to fix something they cannot
 * see.
 */
export function SelectionBar({ question, summary, hasError, describedBy, children }) {
  const [isOpen, setIsOpen] = useState(true);
  const panelRef = useRef(null);
  const focusOnOpenRef = useRef(false);
  const barId = useId();
  const panelId = useId();
  const copy = COPY[question.language] ?? COPY.en;

  useEffect(() => {
    if (hasError) setIsOpen(true);
  }, [hasError]);

  useEffect(() => {
    if (!isOpen || !focusOnOpenRef.current) return;
    focusOnOpenRef.current = false;

    const panel = panelRef.current;
    const target =
      panel?.querySelector('[aria-checked="true"], input:checked') ??
      panel?.querySelector('[data-option]');

    target?.focus();
  }, [isOpen]);

  function toggle() {
    focusOnOpenRef.current = !isOpen;
    setIsOpen((open) => !open);
  }

  return (
    <div className={`fe-select${isOpen ? ' fe-select--open' : ''}${hasError ? ' fe-select--invalid' : ''}`}>
      <button
        type="button"
        id={barId}
        className="fe-select__bar"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-describedby={describedBy}
        onClick={toggle}
      >
        <span className="fe-select__text">
          <span className="fe-select__question">{question.label}</span>
          <span className="fe-select__value">{summary || copy.notChosen}</span>
        </span>
        <span className="fe-select__hint">
          <span className="fe-visually-hidden">{isOpen ? copy.hide : copy.show}</span>
          <span className="fe-select__chevron" aria-hidden="true">
            ▾
          </span>
        </span>
      </button>

      <div id={panelId} className="fe-select__panel" ref={panelRef} hidden={!isOpen}>
        {children}
      </div>
    </div>
  );
}
