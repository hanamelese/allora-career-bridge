import { describe, it, expect } from 'vitest';

import { FORM_TEMPLATES } from './formTemplates.js';
import { isFieldVisible } from './fieldVisibility.js';
import { buildSubmissionSchema } from './submissionSchema.js';
import {
  buildReferralMessage,
  referralPartnerSchema,
  referralRequestSchema,
} from './referrals.js';

const referralField = FORM_TEMPLATES.signup.fields.find((field) => field.key === 'referral');

describe('the referral step', () => {
  it('comes last, right after the identity question', () => {
    const keys = FORM_TEMPLATES.signup.fields.map((field) => field.key);

    expect(keys.at(-1)).toBe('referral');
    expect(keys.indexOf('identityRoute')).toBeLessThan(keys.indexOf('referral'));
  });

  it('is only asked of a learner who chose "I have no document, refer me"', () => {
    expect(isFieldVisible(referralField, { identityRoute: 'no_document' })).toBe(true);
    expect(isFieldVisible(referralField, { identityRoute: 'partner_referral' })).toBe(false);
    expect(isFieldVisible(referralField, { identityRoute: 'passport' })).toBe(false);
    expect(isFieldVisible(referralField, {})).toBe(false);
  });

  it('is always on and never has to be answered', () => {
    expect(referralField).toMatchObject({ locked: true, enabled: true, required: false });
  });

  it('accepts the chosen partner ids as the answer', () => {
    const schema = buildSubmissionSchema(FORM_TEMPLATES.signup);
    const answers = { name: 'Abebe', phone: '0911234567', identityRoute: 'no_document', currentLevel: 'beginner' };

    expect(schema.safeParse({ ...answers, referral: ['rp_1', 'rp_2'] }).success).toBe(true);
    expect(schema.safeParse({ ...answers, referral: ['rp_1', 'rp_1'] }).success).toBe(false);
  });
});

describe('the referral message', () => {
  const message = buildReferralMessage({
    organisationName: 'ALX Ethiopia',
    learnerName: 'Abebe Kebede',
    learnerPhone: '0911234567',
    link: 'https://example.org/referrals/abc',
  });

  it('names the learner and the organisation, and carries the link', () => {
    expect(message).toContain('Abebe Kebede');
    expect(message).toContain('ALX Ethiopia');
    expect(message).toContain('0911234567');
    expect(message).toContain('https://example.org/referrals/abc');
  });

  it('leaves out a phone number the learner did not give', () => {
    const withoutPhone = buildReferralMessage({
      organisationName: 'ALX Ethiopia',
      learnerName: 'Abebe Kebede',
      link: 'x',
    });

    expect(withoutPhone).not.toContain('Phone');
  });

  it('marks a test send from the dashboard', () => {
    expect(
      buildReferralMessage({ organisationName: 'A', learnerName: 'B', link: 'c', isTest: true }),
    ).toMatch(/^\[TEST\]/);
  });
});

describe('referral partner details', () => {
  const good = { name: 'Bole Kebele', email: 'a@b.org', phone: '+251 911 234 567' };

  it('needs a name, an email and an international mobile number', () => {
    expect(referralPartnerSchema.safeParse(good).success).toBe(true);
    expect(referralPartnerSchema.safeParse({ ...good, phone: '0911234567' }).success).toBe(false);
    expect(referralPartnerSchema.safeParse({ ...good, email: 'nope' }).success).toBe(false);
    expect(referralPartnerSchema.safeParse({ ...good, name: ' ' }).success).toBe(false);
  });
});

describe('a referral request', () => {
  const learner = { name: 'Abebe' };

  it('needs between one and five different partners', () => {
    expect(referralRequestSchema.safeParse({ partnerIds: [], learner }).success).toBe(false);
    expect(referralRequestSchema.safeParse({ partnerIds: ['a'], learner }).success).toBe(true);
    expect(referralRequestSchema.safeParse({ partnerIds: ['a', 'a'], learner }).success).toBe(false);
    expect(
      referralRequestSchema.safeParse({ partnerIds: ['a', 'b', 'c', 'd', 'e', 'f'], learner }).success,
    ).toBe(false);
  });
});
