import { describe, it, expect } from 'vitest';

import { formConfigSchema } from './formConfig.js';
import { FORM_TEMPLATES } from './formTemplates.js';
import { upgradeLearnerDraft } from './formUpgrades.js';

/* The two learner templates as they were before the merge. */
const OLD_FEATURES = { voiceInput: true, readAloud: true, lowLiteracy: false };

const field = (key, extra = {}) => ({
  key,
  enabled: true,
  required: false,
  locked: false,
  visibility: 'public',
  ...extra,
});

const oldSignup = {
  ...FORM_TEMPLATES.signup,
  formId: 'frm_abc',
  features: OLD_FEATURES,
  fields: [
    field('name', { required: true, locked: true }),
    field('phone', { required: true }),
    field('email'),
    field('identityRoute', { required: true, locked: true }),
    field('documentId', {
      showIf: { field: 'identityRoute', in: ['kebele_id', 'passport', 'refugee_id'] },
    }),
    field('location', { label: { en: 'Your town' } }),
    field('address', { enabled: false }),
    field('assistedBy', { enabled: false }),
    field('assistedConsent', { enabled: false }),
    field('consent', { required: true, locked: true }),
  ],
  customFields: [
    { key: 'heard_from', type: 'text', label: { en: 'How did you hear?' }, enabled: true, required: false, visibility: 'public' },
  ],
};

const oldLearner = {
  ...oldSignup,
  type: 'learner',
  formId: 'frm_def',
  fields: [
    field('name', { required: true, locked: true }),
    field('education', { enabled: false }),
    field('currentLevel', { required: true, label: { en: 'Your level' } }),
    field('skills'),
    field('careerGoal'),
    field('location'),
    field('supportNeeds', { locked: true, visibility: 'private' }),
    field('supportNote', { visibility: 'private' }),
    field('consent', { required: true, locked: true }),
  ],
  customFields: [
    { key: 'heard_from', type: 'text', label: { en: 'Duplicate' }, enabled: true, required: false, visibility: 'public' },
    { key: 'shift', type: 'yesNo', label: { en: 'Can you work shifts?' }, enabled: true, required: false, visibility: 'public' },
  ],
};

describe('merged learner template', () => {
  it('asks each question once', () => {
    const keys = FORM_TEMPLATES.signup.fields.map((item) => item.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps the private support request, locked on and never required', () => {
    const support = FORM_TEMPLATES.signup.fields.find((item) => item.key === 'supportNeeds');

    expect(support).toMatchObject({ enabled: true, locked: true, required: false, visibility: 'private' });
  });

  it('no longer offers the separate profile form', () => {
    expect(FORM_TEMPLATES.learner).toBeUndefined();
  });
});

describe('upgrading a stored learner registration draft', () => {
  const upgraded = upgradeLearnerDraft(oldSignup, oldLearner);

  it('produces a valid configuration', () => {
    const result = formConfigSchema.safeParse(upgraded);

    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('adds every profile question, once', () => {
    const keys = upgraded.fields.map((item) => item.key);

    expect(keys).toEqual(FORM_TEMPLATES.signup.fields.map((item) => item.key));
  });

  it('keeps what the partner set on registration', () => {
    const location = upgraded.fields.find((item) => item.key === 'location');

    expect(location.label).toEqual({ en: 'Your town' });
    expect(upgraded.formId).toBe('frm_abc');
    expect(upgraded.type).toBe('signup');
  });

  it('carries over what the partner set on the profile form', () => {
    expect(upgraded.fields.find((item) => item.key === 'education').enabled).toBe(false);
    expect(upgraded.fields.find((item) => item.key === 'currentLevel').label).toEqual({ en: 'Your level' });
  });

  it('adds profile custom questions without duplicating keys', () => {
    expect(upgraded.customFields.map((item) => item.key)).toEqual(['heard_from', 'shift']);
  });

  it('works without a profile draft', () => {
    const alone = upgradeLearnerDraft(oldSignup, null);

    expect(formConfigSchema.safeParse(alone).success).toBe(true);
  });

  it('returns the same object when there is nothing to do', () => {
    expect(upgradeLearnerDraft(upgraded, oldLearner)).toBe(upgraded);
  });
});

describe('older configurations', () => {
  it('still accept the retired accessibility switches', () => {
    expect(formConfigSchema.safeParse(oldSignup).success).toBe(true);
  });

  it('still accept the retired profile form type', () => {
    expect(formConfigSchema.safeParse(oldLearner).success).toBe(true);
  });
});
