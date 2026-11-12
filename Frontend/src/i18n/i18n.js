import { useState, useEffect } from 'react';
import enVocab from '../vocab/en.json';

const vocabularies = {
  en: enVocab
};

let currentLang = 'en';
const listeners = new Set();

/**
 * Look up a translation key.
 * Warns if a key is missing so no hardcoded or missing text goes unnoticed.
 */
export function t(key, fallback = '') {
  const vocab = vocabularies[currentLang] || vocabularies.en;
  if (vocab && key in vocab) {
    return vocab[key];
  }
  console.warn(`[i18n] Missing translation key: "${key}" for language "${currentLang}"`);
  return fallback || key;
}

/**
 * Change active language ('en', 'am').
 */
export function setLanguage(lang) {
  if (vocabularies[lang] || lang === 'en') {
    currentLang = lang;
    listeners.forEach((listener) => listener(currentLang));
  }
}

/**
 * Register additional language strings (for Amharic later).
 */
export function registerVocab(lang, dict) {
  vocabularies[lang] = { ...vocabularies[lang], ...dict };
}

/**
 * React hook for components to read translations.
 */
export function useTranslation() {
  const [lang, setLangState] = useState(currentLang);

  useEffect(() => {
    const listener = (newLang) => setLangState(newLang);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return {
    t,
    lang,
    setLanguage
  };
}

export default {
  t,
  setLanguage,
  registerVocab,
  useTranslation
};
