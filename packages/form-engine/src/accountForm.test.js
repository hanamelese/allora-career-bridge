import { describe, it, expect } from 'vitest';
import { FORM_TEMPLATES } from '@onboarding/contracts';
import { formatAnswerText } from './accessibility.js';
import {
  getAccountQuestions,
  getEnabledProviders,
  validateAccount,
} from './accountForm.js';

const template = FORM_TEMPLATES.account;
const withAccount = (changes) => ({ ...template, account: { ...template.account, ...changes } });

describe('Sign up / Sign in form', () => {
  it('asks for a name only when signing up', () => {
    expect(getAccountQuestions(template).map((q) => q.key)).toEqual(['name', 'email', 'password']);
    expect(getAccountQuestions(withAccount({ mode: 'signIn' })).map((q) => q.key)).toEqual([
      'email',
      'password',
    ]);
  });

  it('gives password managers the right hint for each mode', () => {
    const signUp = getAccountQuestions(template).find((q) => q.key === 'password');
    const signIn = getAccountQuestions(withAccount({ mode: 'signIn' })).find((q) => q.key === 'password');

    expect(signUp.autocomplete).toBe('new-password');
    expect(signIn.autocomplete).toBe('current-password');
    expect(signUp.voiceInput).toBe(false);
  });

  it('only offers providers that are on and have an address', () => {
    const config = withAccount({
      socialProviders: [
        { key: 'google', enabled: true, url: 'https://example.org/auth/google' },
        { key: 'linkedin', enabled: false, url: 'https://example.org/auth/linkedin' },
      ],
    });

    expect(getEnabledProviders(config)).toEqual([
      { key: 'google', name: 'Google', url: 'https://example.org/auth/google' },
    ]);
  });

  it('names each problem, in screen order', () => {
    const result = validateAccount(template, { email: 'nope', password: 'short' }, {
      labels: { name: 'Full name', email: 'Email address', password: 'Password' },
    });

    expect(result.valid).toBe(false);
    expect(Object.entries(result.errors)).toEqual([
      ['name', 'Full name: Enter your full name.'],
      ['email', 'Email address: Enter an email address, like name@example.com.'],
      ['password', 'Password: Use at least 8 characters.'],
    ]);
  });

  it('accepts a complete sign-in without a name', () => {
    const result = validateAccount(withAccount({ mode: 'signIn' }), {
      name: 'ignored',
      email: ' abebe@example.org ',
      password: 'secret words',
    });

    expect(result).toEqual({ valid: true, data: { email: 'abebe@example.org', password: 'secret words' } });
  });

  it('never reads a password back', () => {
    expect(formatAnswerText({ type: 'password' }, 'hunter22')).toBe('Entered (hidden)');
  });
});
