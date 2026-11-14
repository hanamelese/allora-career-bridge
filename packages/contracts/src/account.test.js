import { describe, it, expect } from 'vitest';

import { formConfigSchema } from './formConfig.js';
import { FORM_TEMPLATES } from './formTemplates.js';
import { buildSubmissionSchema } from './submissionSchema.js';
import { moveIdentityToEnd } from './formUpgrades.js';
import { partnerSignupSchema } from './partnerSignup.js';
import { isSignInUrl } from './socialProviders.js';

const account = FORM_TEMPLATES.account;

function withProviders(providers, extra = {}) {
  return { ...account, account: { ...account.account, ...extra, socialProviders: providers } };
}

describe('Sign up / Sign in form', () => {
  it('is the first template', () => {
    expect(Object.keys(FORM_TEMPLATES)[0]).toBe('account');
  });

  it('starts with every provider listed and switched off', () => {
    expect(account.account.mode).toBe('signUp');
    expect(account.account.socialProviders.map((p) => p.key)).toEqual([
      'google',
      'linkedin',
      'facebook',
      'microsoft',
      'apple',
    ]);
    expect(account.account.socialProviders.every((p) => !p.enabled)).toBe(true);
  });

  it('needs an https address before a provider can be switched on', () => {
    const noUrl = withProviders([{ key: 'google', enabled: true, url: '' }]);
    const http = withProviders([{ key: 'google', enabled: true, url: 'http://example.org/auth' }]);
    const ok = withProviders([{ key: 'google', enabled: true, url: 'https://example.org/auth/google' }]);

    expect(formConfigSchema.safeParse(noUrl).success).toBe(false);
    expect(formConfigSchema.safeParse(http).success).toBe(false);
    expect(formConfigSchema.safeParse(ok).success).toBe(true);
  });

  it('never lets a page script run from a provider address', () => {
    expect(isSignInUrl('javascript:alert(1)')).toBe(false);
    expect(isSignInUrl('http://localhost:3000/auth')).toBe(true);
  });

  it('needs at least one way to sign in', () => {
    const none = withProviders([], { allowEmailPassword: false });
    expect(formConfigSchema.safeParse(none).success).toBe(false);
  });

  it('keeps sign-in options off every other form', () => {
    const wrong = { ...FORM_TEMPLATES.employer, account: account.account };
    expect(formConfigSchema.safeParse(wrong).success).toBe(false);
  });

  it('checks the password length', () => {
    const schema = buildSubmissionSchema(account);
    const base = { name: 'Abebe', email: 'abebe@example.org' };

    expect(schema.safeParse({ ...base, password: 'short' }).success).toBe(false);
    expect(schema.safeParse({ ...base, password: 'long enough' }).success).toBe(true);
  });
});

describe('learner form order', () => {
  it('asks the identity questions last, just before the referral', () => {
    const keys = FORM_TEMPLATES.signup.fields.map((field) => field.key);
    expect(keys.slice(-4)).toEqual(['identityRoute', 'documentId', 'identityDocumentFile', 'referral']);
  });

  it('moves identity questions in an older draft and keeps everything else', () => {
    const template = FORM_TEMPLATES.signup;
    const old = {
      ...template,
      fields: [
        template.fields[0],
        ...template.fields.filter((f) => ['identityRoute', 'documentId'].includes(f.key)),
        ...template.fields.slice(1).filter((f) => !['identityRoute', 'documentId'].includes(f.key)),
      ],
    };

    const upgraded = moveIdentityToEnd(old);

    expect(upgraded.fields.map((f) => f.key)).toEqual(template.fields.map((f) => f.key));
    expect(formConfigSchema.safeParse(upgraded).success).toBe(true);
    expect(moveIdentityToEnd(upgraded)).toBe(upgraded);
  });
});

describe('partner sign-up', () => {
  it('accepts a complete sign-up and normalises the email', () => {
    const result = partnerSignupSchema.parse({
      organisationName: 'Hope NGO',
      email: ' Staff@Hope.ORG ',
      password: 'a-long-password',
    });

    expect(result.email).toBe('staff@hope.org');
  });

  it('rejects a short password', () => {
    expect(
      partnerSignupSchema.safeParse({ organisationName: 'Hope', email: 'a@b.org', password: 'short' })
        .success,
    ).toBe(false);
  });
});
