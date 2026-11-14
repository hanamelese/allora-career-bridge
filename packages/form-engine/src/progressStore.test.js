import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { FORM_TEMPLATES } from '@onboarding/contracts';
import { clearProgress, isSaveable, loadProgress, progressKeyFor, saveProgress } from '../react/progressStore.js';

/* A stand-in for the tab's sessionStorage. */
function fakeStorage() {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
    items,
  };
}

const learner = { ...FORM_TEMPLATES.signup, formId: 'frm_1', version: '3' };
let store;

beforeEach(() => {
  store = fakeStorage();
  globalThis.window = { sessionStorage: store };
});

afterEach(() => {
  delete globalThis.window;
});

describe('keeping progress in this tab', () => {
  it('keeps one place per form version', () => {
    expect(progressKeyFor(learner)).toBe('fe-progress:frm_1:3');
  });

  it('never keeps private answers, ID numbers, files or passwords', () => {
    expect(isSaveable(learner, 'name')).toBe(true);
    expect(isSaveable(learner, 'identityRoute')).toBe(true);
    for (const key of ['supportNeeds', 'supportNote', 'referral', 'documentId', 'identityDocumentFile']) {
      expect(isSaveable(learner, key)).toBe(false);
    }
    expect(isSaveable(FORM_TEMPLATES.account, 'password')).toBe(false);
  });

  it('brings back what was kept, and says what was not', () => {
    const key = progressKeyFor(learner);
    saveProgress(key, learner, {
      answers: {
        name: 'Abebe Kebede',
        currentLevel: 'beginner',
        supportNeeds: ['readAloud'],
        documentId: 'AB123',
        identityRoute: 'kebele_id',
        identityDocumentFile: { name: 'id.pdf', size: 10, type: 'application/pdf' },
      },
      currentKey: 'identityDocumentFile',
      isReviewing: false,
    });

    const raw = store.getItem(key);
    expect(raw).not.toContain('AB123');
    expect(raw).not.toContain('readAloud');
    expect(raw).not.toContain('id.pdf');

    expect(loadProgress(key, learner)).toEqual({
      answers: { name: 'Abebe Kebede', currentLevel: 'beginner', identityRoute: 'kebele_id' },
      currentKey: 'identityDocumentFile',
      isReviewing: false,
      notKept: ['supportNeeds', 'documentId', 'identityDocumentFile'],
    });
  });

  it('forgets everything when cleared, and copes with broken or blocked storage', () => {
    const key = progressKeyFor(learner);
    saveProgress(key, learner, { answers: { name: 'Abebe' }, currentKey: 'name' });
    clearProgress(key);
    expect(loadProgress(key, learner)).toBeNull();

    store.setItem(key, '{not json');
    expect(loadProgress(key, learner)).toBeNull();

    globalThis.window = {
      get sessionStorage() {
        throw new Error('blocked');
      },
    };
    expect(() => saveProgress(key, learner, { answers: { name: 'A' } })).not.toThrow();
    expect(loadProgress(key, learner)).toBeNull();
  });
});
