import { useEffect, useId, useRef, useState } from 'react';

const COPY = {
  en: { notChosen: 'Not chosen yet', show: 'Show the choices', hide: 'Hide the choices' },
  am: { notChosen: 'ገና አልተመረጠም', show: 'አማራጮቹን አሳይ', hide: 'አማራጮቹን ደብቅ' },
};

/**
 * A selection question as one bar that opens to show its options.
 *
 * The bar is a real button with `aria-expanded`, so its state is announced
 * and it works the same with a mouse, a finger, Enter or Space. Closed, it
 * shows the question and the current answer; open, the options sit
 * directly beneath it at the same width.
 *
 * Opening moves focus to the chosen option (or the first one), so a
 * keyboard user lands where they can act. A validation error opens it, so
 * the learner is never asked to fix something they cannot see.
 */
export function SelectionBar({ question, summary, hasError, describedBy, children }) {
  const [isOpen, setIsOpen] = useState(false);
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
