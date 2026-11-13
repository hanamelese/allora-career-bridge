// packages/contracts/src/fieldVisibility.js
//
// Whether a conditional question applies, given the answers so far.
//
// One implementation, used by the validator and by the Form Engine's
// question flow, so a question can never be hidden on screen while still
// being demanded by validation.

/** Does this `showIf` condition hold for the answers given? */
export function matchesShowIf(showIf, answers = {}) {
  if (!showIf) return true;

  const value = answers[showIf.field];

  if (Array.isArray(showIf.in)) {
    return showIf.in.includes(value);
  }

  return value === showIf.equals;
}

/**
 * Is this field shown at all? A field that is switched off is never shown,
 * and nor is one whose condition does not hold.
 */
export function isFieldVisible(fieldConfig, answers = {}) {
  if (fieldConfig.enabled === false) return false;

  return matchesShowIf(fieldConfig.showIf, answers);
}
