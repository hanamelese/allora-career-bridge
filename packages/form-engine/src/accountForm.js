/**
 * The Sign up / Sign in form, without any rendering.
 *
 * Unlike the other forms it is one screen, not one question per screen:
 * that is what people expect of a sign-in, and what assistive technology
 * users already know how to move through. The questions, wording and
 * checks still come from the same catalogue and schema as every other
 * form, so a partner's reworded label shows here exactly as it would
 * anywhere else.
 */

import { fieldCatalog } from '@onboarding/contracts/fieldCatalog.js';
import { buildSubmissionSchema } from '@onboarding/contracts/submissionSchema.js';
import { getSocialProvider } from '@onboarding/contracts/socialProviders.js';
import { getQuestionContent } from './accessibility.js';

export const ACCOUNT_COPY = {
  en: {
    signUp: 'Sign up',
    signIn: 'Sign in',
    signUpIntro: 'Create your account. Every option below works with a keyboard and a screen reader.',
    signInIntro: 'Welcome back. Every option below works with a keyboard and a screen reader.',
    withProvider: (mode, name) => `${mode === 'signIn' ? 'Sign in' : 'Sign up'} with ${name}`,
    socialGroup: (mode) => `${mode === 'signIn' ? 'Sign in' : 'Sign up'} with another account`,
    or: 'or',
    orLong: (mode) => `Or ${mode === 'signIn' ? 'sign in' : 'sign up'} with your email address`,
    showPassword: 'Show password',
    submitSignUp: 'Create account',
    submitSignIn: 'Sign in',
    toSignIn: 'Already have an account? Sign in',
    toSignUp: 'New here? Create an account',
    errorSummary: (count) =>
      count === 1 ? 'There is 1 problem to fix before you continue.' : `There are ${count} problems to fix before you continue.`,
    errors: {
      nameEmpty: 'Enter your full name.',
      emailEmpty: 'Enter your email address.',
      emailInvalid: 'Enter an email address, like name@example.com.',
      passwordEmpty: 'Enter your password.',
      passwordShort: 'Use at least 8 characters.',
      invalid: 'Check this answer.',
    },
    done: (mode) => (mode === 'signIn' ? 'You are signing in…' : 'Your details have been sent.'),
    noOptions: 'No way to sign in has been switched on for this form yet.',
  },
  am: {
    signUp: 'ይመዝገቡ',
    signIn: 'ይግቡ',
    signUpIntro: 'መለያዎን ይፍጠሩ። ከታች ያሉት ሁሉም አማራጮች በቁልፍ ሰሌዳና በስክሪን አንባቢ ይሠራሉ።',
    signInIntro: 'እንኳን ደህና መጡ። ከታች ያሉት ሁሉም አማራጮች በቁልፍ ሰሌዳና በስክሪን አንባቢ ይሠራሉ።',
    withProvider: (mode, name) => `በ${name} ${mode === 'signIn' ? 'ይግቡ' : 'ይመዝገቡ'}`,
    socialGroup: (mode) => `በሌላ መለያ ${mode === 'signIn' ? 'ይግቡ' : 'ይመዝገቡ'}`,
    or: 'ወይም',
    orLong: (mode) => `ወይም በኢሜይል አድራሻዎ ${mode === 'signIn' ? 'ይግቡ' : 'ይመዝገቡ'}`,
    showPassword: 'የይለፍ ቃሉን አሳይ',
    submitSignUp: 'መለያ ፍጠር',
    submitSignIn: 'ግባ',
    toSignIn: 'መለያ አለዎት? ይግቡ',
    toSignUp: 'አዲስ ነዎት? መለያ ይፍጠሩ',
    errorSummary: (count) => `ከመቀጠልዎ በፊት መስተካከል ያለባቸው ${count} ችግሮች አሉ።`,
    errors: {
      nameEmpty: 'ሙሉ ስምዎን ያስገቡ።',
      emailEmpty: 'የኢሜይል አድራሻዎን ያስገቡ።',
      emailInvalid: 'እንደ name@example.com ያለ የኢሜይል አድራሻ ያስገቡ።',
      passwordEmpty: 'የይለፍ ቃልዎን ያስገቡ።',
      passwordShort: 'ቢያንስ 8 ፊደላት ይጠቀሙ።',
      invalid: 'ይህን መልስ ያረጋግጡ።',
    },
    done: (mode) => (mode === 'signIn' ? 'በመግባት ላይ…' : 'ዝርዝሮችዎ ተልከዋል።'),
    noOptions: 'ለዚህ ቅጽ እስካሁን የመግቢያ መንገድ አልበራም።',
  },
};

/** The form's config with the name question dropped when signing in. */
export function effectiveAccountConfig(config) {
  const mode = config.account?.mode ?? 'signUp';
  const allowEmail = config.account?.allowEmailPassword !== false;

  return {
    ...config,
    fields: config.fields.map((field) => {
      const off = !allowEmail || (mode === 'signIn' && field.key === 'name');
      return off ? { ...field, enabled: false, required: false } : field;
    }),
  };
}

/** The questions on screen, worded for the language chosen. */
export function getAccountQuestions(config, settings = {}) {
  const mode = config.account?.mode ?? 'signUp';

  return effectiveAccountConfig(config)
    .fields.filter((field) => field.enabled)
    .map(({ voiceInput: _retired, ...field }) => {
      const question = getQuestionContent({ ...(fieldCatalog[field.key] ?? {}), ...field }, settings, config);

      /* The catalogue's email help ("only if you have one") is for learner
         registration; here the address is what the account is. A partner's
         own help text still shows. */
      if (field.key === 'email' && !field.helpText) question.helpText = null;

      if (field.key === 'password') {
        question.autocomplete = mode === 'signIn' ? 'current-password' : 'new-password';
        if (mode === 'signIn' && !field.helpText) question.helpText = null;
      }

      if (field.key === 'email') question.autocomplete = mode === 'signIn' ? 'username' : 'email';

      return question;
    });
}

/** The switched-on social providers, in the order the partner listed them. */
export function getEnabledProviders(config) {
  return (config.account?.socialProviders ?? [])
    .filter((provider) => provider.enabled && provider.url)
    .map((provider) => ({ ...getSocialProvider(provider.key), url: provider.url }))
    .filter((provider) => provider.key);
}

/**
 * Checks the answers. Returns `{ valid, data }` or `{ valid: false, errors }`,
 * with each error in plain words and naming its question, in screen order.
 */
export function validateAccount(config, answers, { language = 'en', labels = {} } = {}) {
  const copy = (ACCOUNT_COPY[language] ?? ACCOUNT_COPY.en).errors;
  const effective = effectiveAccountConfig(config);
  const enabledKeys = effective.fields.filter((field) => field.enabled).map((field) => field.key);

  const cleaned = {};
  for (const key of enabledKeys) {
    const value = typeof answers[key] === 'string' ? answers[key].trim() : answers[key];
    /* The password is sent exactly as typed; spaces can be part of it. */
    const kept = key === 'password' ? answers[key] : value;
    if (kept !== undefined && kept !== '') cleaned[key] = kept;
  }

  const result = buildSubmissionSchema(effective).safeParse(cleaned);

  if (result.success) return { valid: true, data: result.data };

  const errors = {};

  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (!key || errors[key]) continue;

    const empty = cleaned[key] === undefined;
    const message =
      key === 'name'
        ? copy.nameEmpty
        : key === 'email'
          ? empty
            ? copy.emailEmpty
            : copy.emailInvalid
          : key === 'password'
            ? empty
              ? copy.passwordEmpty
              : copy.passwordShort
            : copy.invalid;

    errors[key] = labels[key] ? `${labels[key]}: ${message}` : message;
  }

  /* Screen order, so the first error is the first field to fix. */
  const ordered = {};
  for (const key of enabledKeys) if (errors[key]) ordered[key] = errors[key];

  return { valid: false, errors: ordered };
}
