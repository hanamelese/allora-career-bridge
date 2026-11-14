import { describe, it, expect } from 'vitest';

import { formConfigSchema } from './formConfig.js';
import { FORM_TEMPLATES } from './formTemplates.js';
import {
  addJobIdentityQuestions,
  mergeReferralRoutes,
  removeLearnerConsent,
  upgradeLearnerDraft,
} from './formUpgrades.js';
import { fieldCatalog } from './fieldCatalog.js';
import { buildReferralMessage } from './referrals.js';

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

  it('adds every profile question, once, keeping what the template no longer names at the end', () => {
    const keys = upgraded.fields.map((item) => item.key);

    expect(keys).toEqual([...FORM_TEMPLATES.signup.fields.map((item) => item.key), 'consent']);
  });

  it('then matches the template once the learner permission question is dropped', () => {
    const keys = removeLearnerConsent(upgraded).fields.map((item) => item.key);

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

describe('dropping the learner permission question', () => {
  const withConsent = (type) => ({
    ...FORM_TEMPLATES[type],
    fields: [...FORM_TEMPLATES[type].fields, field('consent', { required: true, locked: true })],
  });

  it('is no longer part of the learner or job application templates', () => {
    for (const type of ['signup', 'jobApplication']) {
      expect(FORM_TEMPLATES[type].fields.map((item) => item.key)).not.toContain('consent');
    }
  });

  it('removes it from stored learner and job application drafts', () => {
    for (const type of ['signup', 'jobApplication']) {
      const next = removeLearnerConsent(withConsent(type));

      expect(next.fields.map((item) => item.key)).not.toContain('consent');
      expect(formConfigSchema.safeParse(next).success).toBe(true);
    }
  });

  it('keeps the staff permission question and the employer contact permission', () => {
    const signup = removeLearnerConsent(withConsent('signup'));
    expect(signup.fields.map((item) => item.key)).toContain('assistedConsent');

    const employer = FORM_TEMPLATES.employer;
    expect(removeLearnerConsent(employer)).toBe(employer);
    expect(employer.fields.map((item) => item.key)).toContain('consent');
  });

  it('returns the same draft when there is nothing to remove', () => {
    expect(removeLearnerConsent(FORM_TEMPLATES.signup)).toBe(FORM_TEMPLATES.signup);
  });
});

describe('one "I have no document, refer me" option', () => {
  const before = {
    ...FORM_TEMPLATES.signup,
    identityRoutes: ['kebele_id', 'partner_referral', 'no_document'],
    fields: FORM_TEMPLATES.signup.fields.map((item) =>
      item.key === 'referral'
        ? { ...item, showIf: { field: 'identityRoute', in: ['no_document', 'partner_referral'] } }
        : item,
    ),
    customFields: [
      {
        key: 'helper',
        type: 'text',
        label: { en: 'Who suggested you ask?' },
        enabled: true,
        required: false,
        visibility: 'public',
        showIf: { field: 'identityRoute', equals: 'partner_referral' },
      },
    ],
  };

  it('is the label of the no-document route, and the only referral route offered', () => {
    expect(FORM_TEMPLATES.signup.identityRoutes).toContain('no_document');
    expect(FORM_TEMPLATES.signup.identityRoutes).not.toContain('partner_referral');
  });

  it('no longer lets a draft offer the retired route', () => {
    expect(formConfigSchema.safeParse(before).success).toBe(false);
  });

  it('upgrades a draft that offered both, pointing everything at no_document', () => {
    const after = mergeReferralRoutes(before);

    expect(after.identityRoutes).toEqual(['kebele_id', 'no_document']);
    expect(after.fields.find((item) => item.key === 'referral').showIf).toEqual({
      field: 'identityRoute',
      in: ['no_document'],
    });
    expect(after.customFields[0].showIf).toEqual({ field: 'identityRoute', equals: 'no_document' });
    expect(formConfigSchema.safeParse(after).success).toBe(true);
  });

  it('returns the same draft when it never used the retired route', () => {
    expect(mergeReferralRoutes(FORM_TEMPLATES.signup)).toBe(FORM_TEMPLATES.signup);
  });
});

describe('job application: identity and referral', () => {
  const job = FORM_TEMPLATES.jobApplication;
  const keys = job.fields.map((item) => item.key);

  it('ends with the identity question, the ID number, the document upload and the referral', () => {
    expect(keys.slice(-4)).toEqual(['identityRoute', 'documentId', 'identityDocumentFile', 'referral']);
    expect(job.fields.find((item) => item.key === 'referral').showIf).toEqual({
      field: 'identityRoute',
      in: ['no_document'],
    });
    expect(job.identityRoutes).toContain('no_document');
    expect(formConfigSchema.safeParse(job).success).toBe(true);
  });

  it('asks name and phone earlier, so the referral never asks for them again', () => {
    expect(keys.indexOf('name')).toBeLessThan(keys.indexOf('referral'));
    expect(keys.indexOf('phone')).toBeLessThan(keys.indexOf('referral'));
  });

  it('adds them to an older job draft, at the end', () => {
    const older = { ...job, fields: job.fields.filter((item) => !['identityRoute', 'documentId', 'identityDocumentFile', 'referral'].includes(item.key)) };
    const after = addJobIdentityQuestions(older);

    expect(after.fields.map((item) => item.key)).toEqual(keys);
    expect(formConfigSchema.safeParse(after).success).toBe(true);
    expect(addJobIdentityQuestions(after)).toBe(after);
    expect(addJobIdentityQuestions(FORM_TEMPLATES.signup)).toBe(FORM_TEMPLATES.signup);
  });

  it('words the accommodation question for the job, in its own private section', () => {
    const question = fieldCatalog.interviewAccommodations;

    expect(question.label.en).toBe('What would help you at this job?');
    expect(question.section).toBe('support');
    expect(question.private).toBe(true);
    expect(fieldCatalog.supportNeeds.section).toBe('support');
    expect(fieldCatalog.supportNote.section).toBe('support');
  });

  it('words the referral SMS for applying as well as registering', () => {
    const message = buildReferralMessage({ organisationName: 'Hope', learnerName: 'Abebe', link: 'https://x.example/r/1' });
    expect(message).toContain('to register or apply');
  });
});
