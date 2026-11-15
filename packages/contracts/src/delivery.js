// packages/contracts/src/delivery.js
//
// Delivering a submitted form to the organisation that owns it.
//
// This service never receives or keeps a learner's answers. When a learner
// sends an embedded form, their browser posts the answers straight to an
// address the organisation runs (its "delivery URL"), with a short-lived
// token this service signed. The token says which published form and
// version it was issued for and when - never anything the learner wrote -
// so the organisation can check a delivery came through its own form.

import { z } from 'zod';

/** How long a delivery token is good for. */
export const DELIVERY_TOKEN_LIFETIME_SECONDS = 10 * 60;

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/**
 * Whether `value` may be used as a delivery URL: https, or plain http only
 * for this computer (testing a receiver locally). No user name or password
 * in the address, since it is handed to every learner's browser.
 */
export function isAllowedDeliveryUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.username || url.password) return false;
  if (url.protocol === 'https:') return true;
  return url.protocol === 'http:' && LOCAL_HOSTS.includes(url.hostname);
}

export const deliveryUrlSchema = z
  .string()
  .trim()
  .max(500, 'Use an address of 500 characters or fewer.')
  .refine(isAllowedDeliveryUrl, {
    message: 'Enter a full https:// address, like https://forms.example.org/receive. http:// is allowed only for localhost while testing.',
  });

/** What the dashboard saves: an address, or null to stop delivery. */
export const deliverySettingsSchema = z.object({ url: deliveryUrlSchema.nullable() }).strict();

/** What the embedded form asks for before sending: the version answered. */
export const deliveryTokenRequestSchema = z.object({ version: z.number().int().positive() }).strict();
