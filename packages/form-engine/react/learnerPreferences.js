import { useCallback, useState } from 'react';

/**
 * How a learner has chosen to see the form: contrast, text size and simple
 * words. Remembered in this browser, so a learner who needs high contrast
 * does not have to set it again on every form.
 *
 * The language is not remembered here: the host decides which language a
 * form opens in, and the learner can switch it from the settings panel.
 */

const STORAGE_KEY = 'fe-settings';

export const CONTRAST_LEVELS = [1, 2, 3, 4];
export const TEXT_SIZES = ['small', 'normal', 'large'];

const DEFAULTS = { contrast: 1, textSize: 'normal', lowLiteracy: false };

function read() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!stored || typeof stored !== 'object') return {};

    return {
      ...(CONTRAST_LEVELS.includes(stored.contrast) ? { contrast: stored.contrast } : {}),
      ...(TEXT_SIZES.includes(stored.textSize) ? { textSize: stored.textSize } : {}),
      ...(typeof stored.lowLiteracy === 'boolean' ? { lowLiteracy: stored.lowLiteracy } : {}),
    };
  } catch {
    /* Private windows and blocked storage: just use the defaults. */
    return {};
  }
}

function write(preferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    /* Not being able to remember is not an error worth showing. */
  }
}

export function useLearnerPreferences(initial = {}) {
  const [preferences, setPreferences] = useState(() => ({
    ...DEFAULTS,
    ...(typeof initial.lowLiteracy === 'boolean' ? { lowLiteracy: initial.lowLiteracy } : {}),
    ...read(),
  }));

  const update = useCallback((changes) => {
    setPreferences((current) => {
      const next = { ...current, ...changes };
      write(next);
      return next;
    });
  }, []);

  return [preferences, update];
}
