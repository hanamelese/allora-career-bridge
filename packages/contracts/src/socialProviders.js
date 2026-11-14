// packages/contracts/src/socialProviders.js
//
// The social sign-in buttons a partner can switch on in the Sign up /
// Sign in form.
//
// The form does no authentication itself. It is a component a partner puts
// in place of their own sign-in screen: each button simply goes to the
// address the partner gives - normally the start of their own OAuth flow,
// like https://example.org/auth/google - so no client secret ever passes
// through this system.

import { z } from 'zod';

export const SOCIAL_PROVIDERS = [
  { key: 'google', name: 'Google' },
  { key: 'linkedin', name: 'LinkedIn' },
  { key: 'facebook', name: 'Facebook' },
  { key: 'microsoft', name: 'Microsoft' },
  { key: 'apple', name: 'Apple' },
];

export const SOCIAL_PROVIDER_KEYS = SOCIAL_PROVIDERS.map((provider) => provider.key);

export const ACCOUNT_MODES = ['signUp', 'signIn'];

export function getSocialProvider(key) {
  return SOCIAL_PROVIDERS.find((provider) => provider.key === key) ?? null;
}

/** True for an https address (http is allowed for localhost while testing). */
export function isSignInUrl(value) {
  if (typeof value !== 'string' || !value) return false;

  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export const socialProviderConfigSchema = z
  .object({
    key: z.enum(SOCIAL_PROVIDER_KEYS),
    enabled: z.boolean(),
    url: z.string().trim().max(500).default(''),
  })
  .strict()
  .superRefine((provider, ctx) => {
    if (provider.enabled && !isSignInUrl(provider.url)) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: 'Enter the https address this button should open, like https://example.org/auth/google.',
      });
    }
  });

export const accountSettingsSchema = z
  .object({
    mode: z.enum(ACCOUNT_MODES).default('signUp'),
    allowEmailPassword: z.boolean().default(true),
    socialProviders: z.array(socialProviderConfigSchema).default([]),
  })
  .strict()
  .superRefine((account, ctx) => {
    const keys = account.socialProviders.map((provider) => provider.key);

    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['socialProviders'],
        message: 'Each sign-in option can only be listed once.',
      });
    }

    if (!account.allowEmailPassword && !account.socialProviders.some((provider) => provider.enabled)) {
      ctx.addIssue({
        code: 'custom',
        path: ['allowEmailPassword'],
        message: 'Keep email and password, or switch on at least one other way to sign in.',
      });
    }
  });

/** The default: every provider listed, none switched on yet. */
export function defaultAccountSettings() {
  return {
    mode: 'signUp',
    allowEmailPassword: true,
    socialProviders: SOCIAL_PROVIDERS.map((provider) => ({ key: provider.key, enabled: false, url: '' })),
  };
}
