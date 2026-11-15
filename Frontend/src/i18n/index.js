import { useCallback } from 'react';
import { useDisplay } from '../display/displayContext.js';
import en from './en/index.js';
import am from './am/index.js';

/**
 * The dashboard's words, in English and Amharic.
 *
 * Every string lives in `en/<area>.js`, with its Amharic in `am/<area>.js`
 * under the same key. A value is a string, or a function taking the
 * values to put in it (`(count) => ...`). Anything missing in Amharic
 * falls back to the English, so a gap shows English rather than nothing.
 *
 * The Amharic is a first draft and needs review by a native speaker.
 *
 * This translates the dashboard only. A form's own questions and
 * language are set per form and are not affected.
 */
const DICTIONARIES = { en, am };

function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary);
}

/** The text for `key` in `language`, with `args` put into it. */
export function translate(language, key, ...args) {
  let value = lookup(DICTIONARIES[language] ?? en, key);
  if (value === undefined && language !== 'en') value = lookup(en, key);

  if (value === undefined) {
    if (import.meta.env?.DEV) console.warn(`[i18n] missing text: ${key}`);
    return key;
  }

  return typeof value === 'function' ? value(...args) : value;
}

/** Whether `key` has its own Amharic (not the English fallback). */
export function hasTranslation(language, key) {
  return lookup(DICTIONARIES[language] ?? {}, key) !== undefined;
}

/** `t(key, ...args)` in the language chosen in the display settings. */
export function useT() {
  const { settings } = useDisplay();
  const { language } = settings;
  return useCallback((key, ...args) => translate(language, key, ...args), [language]);
}

/** The language chosen for the dashboard: 'en' or 'am'. */
export function useLanguage() {
  return useDisplay().settings.language;
}
