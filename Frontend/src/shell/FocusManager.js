import { useEffect } from 'react';

/**
 * Moves programmatic focus to an element (like a heading).
 * Ensures tabIndex is -1 so it can receive focus without disrupting normal Tab flow.
 */
export function focusElement(element) {
  if (!element) return;
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1');
  }
  element.focus();
}

/**
 * Hook: Automatically moves focus to the heading whenever the step changes.
 */
export function useStepFocus(stepId, headingRef) {
  useEffect(() => {
    if (headingRef && headingRef.current) {
      focusElement(headingRef.current);
    } else {
      const heading = document.querySelector('[data-question-heading]');
      if (heading) {
        focusElement(heading);
      }
    }
  }, [stepId, headingRef]);
}

export default {
  focusElement,
  useStepFocus
};
