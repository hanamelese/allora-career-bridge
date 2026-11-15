import { describe, it, expect } from 'vitest';
import { FORM_TEMPLATES } from '@onboarding/contracts';
import { formatAnswerText } from './accessibility.js';
import {
  getAccountQuestions,
  getEnabledProviders,
  validateAccount,
  validateAccountField,
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

describe('one screen at a time', () => {
  it('checks only the question on screen', () => {
    expect(validateAccountField(template, 'name', { name: 'Abebe' })).toBeNull();
    expect(validateAccountField(template, 'name', { name: ' A ' })).toBe(
      'Write your full name. It needs at least 2 letters.',
    );
    expect(validateAccountField(template, 'email', { email: 'nope' })).toBe(
      'Enter an email address, like name@example.com.',
    );
    expect(validateAccountField(template, 'email', { email: 'a@example.org' })).toBeNull();
    expect(validateAccountField(template, 'password', { password: 'short' })).toBe('Use at least 8 characters.');
  });

  it('names the question when labels are given, like the full check', () => {
    expect(
      validateAccountField(template, 'email', {}, { labels: { email: 'Email address' } }),
    ).toBe('Email address: Enter your email address.');
  });
});

describe('questions the partner added', () => {
  const withCustom = (mode) => ({
    ...withAccount({ mode }),
    customFields: [
      {
        key: 'cohort',
        type: 'choice',
        label: { en: 'Which cohort are you joining?' },
        enabled: true,
        required: true,
        options: [
          { value: 'jan', label: { en: 'January' } },
          { value: 'jul', label: { en: 'July' } },
        ],
      },
      {
        key: 'cohort_note',
        type: 'text',
        label: { en: 'Anything about July we should know?' },
        enabled: true,
        required: false,
        showIf: { field: 'cohort', equals: 'jul' },
      },
      { key: 'switched_off', type: 'yesNo', label: { en: 'Off' }, enabled: false, required: false },
    ],
  });

  it('asks them after the standard questions when signing up', () => {
    const questions = getAccountQuestions(withCustom('signUp'));

    expect(questions.map((q) => q.key)).toEqual(['name', 'email', 'password', 'cohort']);
    expect(questions.at(-1)).toMatchObject({ isCustom: true, label: 'Which cohort are you joining?', required: true });
    expect(questions.at(-1).options.map((option) => option.label)).toEqual(['January', 'July']);
  });

  it('shows a dependent question only when its condition is met', () => {
    expect(getAccountQuestions(withCustom('signUp'), {}, { cohort: 'jul' }).map((q) => q.key)).toContain('cohort_note');
    expect(getAccountQuestions(withCustom('signUp'), {}, { cohort: 'jan' }).map((q) => q.key)).not.toContain('cohort_note');
  });

  it('never asks them when signing in, and never lets them block signing in', () => {
    expect(getAccountQuestions(withCustom('signIn')).map((q) => q.key)).toEqual(['email', 'password']);
    expect(validateAccount(withCustom('signIn'), { email: 'a@example.org', password: 'long enough' }).valid).toBe(true);
  });

  it('requires a required one when signing up, naming it in screen order', () => {
    const answers = { name: 'Abebe Kebede', email: 'a@example.org', password: 'long enough' };
    const result = validateAccount(withCustom('signUp'), answers, { labels: { cohort: 'Which cohort are you joining?' } });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({ cohort: 'Which cohort are you joining?: Please answer this before moving on.' });
    expect(validateAccountField(withCustom('signUp'), 'cohort', { ...answers, cohort: 'jul' })).toBeNull();

    const complete = validateAccount(withCustom('signUp'), { ...answers, cohort: 'jul', cohort_note: 'Evenings' });
    expect(complete).toMatchObject({ valid: true, data: { cohort: 'jul', cohort_note: 'Evenings' } });
  });

  it('drops the answer to a dependent question that is no longer shown', () => {
    const answers = { name: 'Abebe Kebede', email: 'a@example.org', password: 'long enough', cohort: 'jan', cohort_note: 'stale' };
    const result = validateAccount(withCustom('signUp'), answers);

    expect(result.valid).toBe(true);
    expect(result.data).not.toHaveProperty('cohort_note');
  });
});
