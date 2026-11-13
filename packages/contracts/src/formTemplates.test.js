import { describe, it, expect } from 'vitest';

import { formConfigSchema } from './formConfig.js';
import { FORM_TEMPLATES, LOCK_REASONS } from './formTemplates.js';
import {
  buildSubmissionSchema,
  buildProgressSchema,
  getPartnerSafeAnswers,
} from './submissionSchema.js';
import { fieldCatalog } from './fieldCatalog.js';

const TYPES = Object.keys(FORM_TEMPLATES);

describe('form templates', () => {
  it.each(TYPES)('%s is a valid form config', (type) => {
    const result = formConfigSchema.safeParse(FORM_TEMPLATES[type]);

    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });

  it.each(TYPES)('%s explains every locked field', (type) => {
    const locked = FORM_TEMPLATES[type].fields
      .filter((field) => field.locked)
      .map((field) => field.key);

    expect(locked.length).toBeGreaterThan(0);

    for (const key of locked) {
      expect(LOCK_REASONS[type]?.[key]).toBeTruthy();
    }
  });

  it.each(TYPES)('%s keeps private fields private', (type) => {
    for (const field of FORM_TEMPLATES[type].fields) {
      if (fieldCatalog[field.key]?.private) {
        expect(field.visibility).toBe('private');
      }
    }
  });

  it('never requires a learner to disclose a support need', () => {
    const supportFields = ['supportNeeds', 'supportNote', 'interviewAccommodations'];

    for (const type of TYPES) {
      for (const field of FORM_TEMPLATES[type].fields) {
        if (supportFields.includes(field.key)) {
          expect(field.required).toBe(false);
        }
      }
    }
  });
});

describe('new field types', () => {
  // The progress schema checks the shape of each answer without demanding
  // a complete form, which is what these cases are about.
  const schemaFor = (type) => buildProgressSchema(FORM_TEMPLATES[type]);

  it('accepts a valid email and rejects a malformed one', () => {
    const schema = schemaFor('employer');

    expect(schema.safeParse({ contactEmail: 'hr@example.org' }).success).toBe(true);
    expect(schema.safeParse({ contactEmail: 'hr-at-example' }).success).toBe(false);
  });

  it('accepts a valid web address and rejects a bare word', () => {
    const schema = schemaFor('employer');

    expect(schema.safeParse({ website: 'https://example.org' }).success).toBe(true);
    expect(schema.safeParse({ website: 'example' }).success).toBe(false);
  });

  it('accepts long text answers', () => {
    const schema = schemaFor('jobApplication');

    expect(schema.safeParse({ motivation: 'I have wanted to do this work for years.' }).success).toBe(
      true,
    );
  });
});

describe('multi-choice options come from the named catalogue', () => {
  it('accepts an interview accommodation on a job application', () => {
    const schema = buildProgressSchema(FORM_TEMPLATES.jobApplication);

    expect(schema.safeParse({ interviewAccommodations: ['extra_time'] }).success).toBe(true);
  });

  it('rejects a workplace option on the interview question', () => {
    const schema = buildProgressSchema(FORM_TEMPLATES.jobApplication);

    expect(schema.safeParse({ interviewAccommodations: ['transport_support'] }).success).toBe(false);
  });

  it('accepts a workplace accommodation on the employer form', () => {
    const schema = buildProgressSchema(FORM_TEMPLATES.employer);

    expect(
      schema.safeParse({ workplaceAccommodations: ['step_free_access', 'flexible_hours'] }).success,
    ).toBe(true);
  });

  it('rejects the same option twice', () => {
    const schema = buildProgressSchema(FORM_TEMPLATES.employer);

    expect(
      schema.safeParse({ workplaceAccommodations: ['flexible_hours', 'flexible_hours'] }).success,
    ).toBe(false);
  });
});

describe('required answers', () => {
  it('rejects a consent question answered false, not just an empty one', () => {
    const config = {
      ...FORM_TEMPLATES.signup,
      fields: [{ key: 'consent', enabled: true, required: true, locked: true, visibility: 'public' }],
    };

    const schema = buildSubmissionSchema(config);

    expect(schema.safeParse({ consent: false }).success).toBe(false);
    expect(schema.safeParse({ consent: true }).success).toBe(true);
  });

  it('treats a second consent question the same way', () => {
    const config = {
      ...FORM_TEMPLATES.signup,
      fields: [
        { key: 'assistedConsent', enabled: true, required: true, locked: false, visibility: 'public' },
      ],
    };

    const schema = buildSubmissionSchema(config);

    expect(schema.safeParse({ assistedConsent: false }).success).toBe(false);
    expect(schema.safeParse({ assistedConsent: true }).success).toBe(true);
  });

  it('rejects a required multi-choice question left empty', () => {
    const config = {
      ...FORM_TEMPLATES.employer,
      fields: [
        {
          key: 'workplaceAccommodations',
          enabled: true,
          required: true,
          locked: true,
          visibility: 'public',
        },
      ],
    };

    const schema = buildSubmissionSchema(config);

    expect(schema.safeParse({ workplaceAccommodations: [] }).success).toBe(false);
    expect(schema.safeParse({ workplaceAccommodations: ['quiet_workspace'] }).success).toBe(true);
  });
});

describe('private answers are withheld from partners', () => {
  it('drops interview accommodations from a job application', () => {
    const safe = getPartnerSafeAnswers(FORM_TEMPLATES.jobApplication, {
      name: 'Miruk',
      jobReference: 'Bookkeeper',
      interviewAccommodations: ['extra_time', 'quiet_room'],
    });

    expect(safe).toEqual({ name: 'Miruk', jobReference: 'Bookkeeper' });
  });

  it('keeps the accommodations an employer offers, which are meant to be seen', () => {
    const safe = getPartnerSafeAnswers(FORM_TEMPLATES.employer, {
      organisationName: 'Habesha Trails',
      workplaceAccommodations: ['step_free_access'],
    });

    expect(safe.workplaceAccommodations).toEqual(['step_free_access']);
  });
});
