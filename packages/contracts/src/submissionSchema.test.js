
import { describe, it, expect } from 'vitest';

import {
  buildSubmissionSchema,
  buildProgressSchema,
  getPartnerSafeAnswers,
} from './submissionSchema.js';

const baseConfig = {
  fields: [
    { key: 'name', enabled: true, required: true },
    { key: 'currentLevel', enabled: true, required: true },
    { key: 'supportNeeds', enabled: true, required: false },
    { key: 'consent', enabled: true, required: true },
  ],
  identityRoutes: [
    'kebele_id',
    'passport',
    'refugee_id',
    'other_document',
    'partner_referral',
    'no_document',
  ],
  customFields: [],
};

describe('Submission schema', () => {
  it('accepts a valid completed submission', () => {
    const schema = buildSubmissionSchema(baseConfig);

    const result = schema.safeParse({
      name: 'Test Learner',
      currentLevel: 'beginner',
      supportNeeds: [],
      consent: true,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a submission with missing required answers', () => {
    const schema = buildSubmissionSchema(baseConfig);

    const result = schema.safeParse({
      name: 'Test Learner',
    });

    expect(result.success).toBe(false);
  });

  it('accepts incomplete progress', () => {
    const schema = buildProgressSchema(baseConfig);

    const result = schema.safeParse({
      name: 'Test Learner',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid current level', () => {
    const schema = buildSubmissionSchema(baseConfig);

    const result = schema.safeParse({
      name: 'Test Learner',
      currentLevel: 'expert',
      supportNeeds: [],
      consent: true,
    });

    expect(result.success).toBe(false);
  });

  it('accepts no-document and partner-referral routes', () => {
    const schema = buildSubmissionSchema({
      fields: [
        { key: 'identityRoute', enabled: true, required: true },
      ],
      identityRoutes: baseConfig.identityRoutes,
      customFields: [],
    });

    expect(
      schema.safeParse({ identityRoute: 'no_document' }).success
    ).toBe(true);

    expect(
      schema.safeParse({ identityRoute: 'partner_referral' }).success
    ).toBe(true);
  });

  it('rejects an answer for a disabled field', () => {
    const schema = buildSubmissionSchema({
      fields: [
        { key: 'name', enabled: true, required: true },
        { key: 'phone', enabled: false, required: false },
      ],
      identityRoutes: ['no_document'],
      customFields: [],
    });

    const result = schema.safeParse({
      name: 'Test Learner',
      phone: '+251911123456',
    });

    expect(result.success).toBe(false);
  });

  it('requires an ID number only when the condition is met', () => {
    const schema = buildSubmissionSchema({
      fields: [
        { key: 'identityRoute', enabled: true, required: true },
      ],
      identityRoutes: baseConfig.identityRoutes,
      customFields: [
        {
          key: 'identityNumber',
          type: 'text',
          enabled: true,
          required: true,
          showIf: {
            field: 'identityRoute',
            equals: 'kebele_id',
          },
        },
      ],
    });

    expect(
      schema.safeParse({
        identityRoute: 'kebele_id',
        identityNumber: '123456',
      }).success
    ).toBe(true);

    expect(
      schema.safeParse({
        identityRoute: 'kebele_id',
      }).success
    ).toBe(false);

    expect(
      schema.safeParse({
        identityRoute: 'no_document',
      }).success
    ).toBe(true);
  });
});

describe('Partner-safe answers', () => {
  it('does not include private support answers', () => {
    const answers = {
      name: 'Test Learner',
      supportNeeds: ['large_text'],
      consent: true,
    };

    const safeAnswers = getPartnerSafeAnswers(
      baseConfig,
      answers
    );

    expect(safeAnswers.name).toBe('Test Learner');
    expect(safeAnswers.consent).toBe(true);
    expect(safeAnswers).not.toHaveProperty('supportNeeds');
  });
});
