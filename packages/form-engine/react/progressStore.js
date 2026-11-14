import { fieldCatalog } from '@onboarding/contracts/fieldCatalog.js';

/**
 * Keeping a learner's place when the page reloads.
 *
 * Saved in this browser tab only (sessionStorage): it survives a reload,
 * or leaving the page and coming back in the same tab, and is gone when
 * the tab is closed or the form is sent - so on a shared or assisted
 * device the next person never sees it.
 *
 * Never saved, so never left behind in the browser:
 * - private answers (support needs, accommodations, the referral choice);
 * - ID numbers;
 * - files, which cannot be kept safely across a reload anyway;
 * - passwords.
 * The learner is told which answers to add again.
 */

const VERSION = 1;

/* Kept out of storage whatever the configuration says. */
const NEVER_SAVED_KEYS = new Set(['documentId']);
const NEVER_SAVED_TYPES = new Set(['file', 'password']);

export function progressKeyFor(config) {
  if (!config?.formId) return null;
  return `fe-progress:${config.formId}:${config.version ?? 'draft'}`;
}

/** Whether an answer to this question may be kept in the browser. */
export function isSaveable(config, key) {
  const field =
    (config.fields ?? []).find((item) => item.key === key) ??
    (config.customFields ?? []).find((item) => item.key === key);
  if (!field) return false;

  const definition = fieldCatalog[key];
  const type = definition?.type ?? field.type;

  if (NEVER_SAVED_KEYS.has(key) || NEVER_SAVED_TYPES.has(type)) return false;
  if (definition?.private === true || field.visibility === 'private') return false;

  return true;
}

function storage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Splits answers into what is kept and the keys of what is not, so the
 * learner can be told what to add again.
 */
export function splitAnswers(config, answers) {
  const kept = {};
  const left = [];

  for (const [key, value] of Object.entries(answers)) {
    if (value === undefined) continue;
    if (isSaveable(config, key)) kept[key] = value;
    else left.push(key);
  }

  return { kept, left };
}

export function saveProgress(storageKey, config, { answers, currentKey, isReviewing }) {
  if (!storageKey) return;
  const { kept, left } = splitAnswers(config, answers);

  try {
    storage()?.setItem(
      storageKey,
      JSON.stringify({
        v: VERSION,
        answers: kept,
        /* A screen whose answer was not kept is still where the learner
           was; they come back to it and see it empty. */
        currentKey,
        isReviewing: Boolean(isReviewing),
        notKept: left,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    /* Storage full or blocked: the form still works, it just cannot
       remember. Nothing is claimed as saved (see `canSave`). */
  }
}

export function loadProgress(storageKey, config) {
  if (!storageKey) return null;

  try {
    const raw = storage()?.getItem(storageKey);
    if (!raw) return null;

    const saved = JSON.parse(raw);
    if (saved?.v !== VERSION || typeof saved.answers !== 'object') return null;

    /* Only answers this form still asks, and may keep. */
    const answers = {};
    for (const [key, value] of Object.entries(saved.answers)) {
      if (isSaveable(config, key)) answers[key] = value;
    }

    return {
      answers,
      currentKey: typeof saved.currentKey === 'string' ? saved.currentKey : null,
      isReviewing: saved.isReviewing === true,
      notKept: Array.isArray(saved.notKept) ? saved.notKept : [],
    };
  } catch {
    return null;
  }
}

export function clearProgress(storageKey) {
  if (!storageKey) return;

  try {
    storage()?.removeItem(storageKey);
  } catch {
    /* Nothing to do. */
  }
}

/** Whether this browser lets the form remember anything at all. */
export function canSave() {
  try {
    const store = storage();
    if (!store) return false;
    store.setItem('fe-progress:probe', '1');
    store.removeItem('fe-progress:probe');
    return true;
  } catch {
    return false;
  }
}
