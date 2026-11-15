/**
 * The dashboard's own display settings: text size, contrast, motion and
 * language. They belong to the person using the dashboard, not to any
 * form: a form keeps its own language and its learners' own settings.
 *
 * They are kept in this browser's localStorage. Nothing in them is
 * personal. index.html applies the same settings before the first paint
 * (keep the two in step), so the page never flashes at the wrong size or
 * contrast.
 */

export const STORAGE_KEY = 'bridge-display';

/** Text size steps, as a percentage of the browser's own size. */
export const TEXT_SCALES = [100, 110, 125, 140, 150];

export const CONTRASTS = ['standard', 'high'];
export const LANGUAGES = ['en', 'am'];

const DEFAULTS = {
  textScale: 100,
  contrast: 'standard',
  /* null follows the operating system's "reduce motion" setting. */
  motion: null,
  language: 'en',
};

export function systemPrefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** The stored settings, with anything unknown or missing set to its default. */
export function loadSettings() {
  let stored = {};

  try {
    stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {};
  } catch {
    stored = {};
  }

  return {
    textScale: TEXT_SCALES.includes(stored.textScale) ? stored.textScale : DEFAULTS.textScale,
    contrast: CONTRASTS.includes(stored.contrast) ? stored.contrast : DEFAULTS.contrast,
    motion: stored.motion === 'reduce' || stored.motion === 'full' ? stored.motion : DEFAULTS.motion,
    language: LANGUAGES.includes(stored.language) ? stored.language : DEFAULTS.language,
  };
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* Storage blocked (a private window): the settings still apply until
       the page is closed. */
  }
}

/** Whether motion is reduced, from the person's choice or else the system's. */
export function effectiveMotion(settings) {
  return settings.motion ?? (systemPrefersReducedMotion() ? 'reduce' : 'full');
}

/**
 * Puts the settings on <html>: the root font size (everything is sized in
 * rem, so the whole interface scales and reflows), and attributes the
 * stylesheets key the contrast and motion rules from.
 */
export function applySettings(settings, root = document.documentElement) {
  root.style.fontSize = settings.textScale === 100 ? '' : `${settings.textScale}%`;
  root.dataset.contrast = settings.contrast;
  root.dataset.motion = effectiveMotion(settings);
  root.lang = settings.language;
}
