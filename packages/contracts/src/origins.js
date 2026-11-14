// packages/contracts/src/origins.js
//
// The websites a partner allows to show their embedded forms.

import { z } from 'zod';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/**
 * The origin ("https://www.example.org") of an address a partner typed,
 * or null if it cannot be one. A path is dropped, since a browser only
 * ever reports the origin. Only https is accepted, except on this
 * computer (localhost), where testing over http is normal.
 */
export function normalizeOrigin(input) {
  let url;

  try {
    url = new URL(String(input).trim());
  } catch {
    return null;
  }

  const isLocal = LOCAL_HOSTS.includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) return null;
  if (url.username || url.password) return null;

  return url.origin;
}

export const allowedOriginSchema = z
  .string()
  .trim()
  .min(1, 'Enter your website’s address.')
  .max(200)
  .transform((value, context) => {
    const origin = normalizeOrigin(value);

    if (!origin) {
      context.addIssue({
        code: 'custom',
        message: 'Enter the address your form will be on, starting with https://, like https://www.example.org.',
      });
      return z.NEVER;
    }

    return origin;
  });

export const allowedOriginRequestSchema = z.object({ origin: allowedOriginSchema }).strict();
