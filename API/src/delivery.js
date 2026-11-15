import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { DELIVERY_TOKEN_LIFETIME_SECONDS } from '@onboarding/contracts';

/**
 * Delivery tokens: proof that a delivery came through an organisation's
 * own published form.
 *
 * Before sending, the embedded form asks this service for a token. It is
 * signed with the organisation's delivery secret (HMAC-SHA256) and names
 * only the form, the version, when it was issued and when it expires -
 * never anything the learner wrote. The learner's browser then posts the
 * answers, with the token, straight to the organisation's delivery URL;
 * this service never sees them.
 *
 *   v1.<payload>.<signature>     both base64url; payload is JSON:
 *   { formId, version, publicKey, iat, exp, nonce }   (times in seconds)
 *
 * What it does not prove: anyone who can load the published form can ask
 * for a token, so it shows a delivery came through the form recently - not
 * that a real learner filled it in. The nonce lets a receiver refuse the
 * same token twice.
 */

export function newDeliverySecret() {
  return `dsec_${randomBytes(24).toString('base64url')}`;
}

const sign = (secret, payload) => createHmac('sha256', secret).update(payload).digest('base64url');

export function signDeliveryToken(secret, { formId, version, publicKey }, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      formId,
      version,
      publicKey,
      iat,
      exp: iat + DELIVERY_TOKEN_LIFETIME_SECONDS,
      nonce: randomBytes(12).toString('base64url'),
    }),
  ).toString('base64url');

  return { token: `v1.${payload}.${sign(secret, payload)}`, expiresAt: new Date((iat + DELIVERY_TOKEN_LIFETIME_SECONDS) * 1000).toISOString() };
}

/**
 * Checks a token as a receiver would. Returns its payload, or null if it
 * is malformed, wrongly signed or expired. (The receiver in
 * tools/delivery-receiver does the same in a few lines of its own.)
 */
export function verifyDeliveryToken(secret, token, now = Date.now()) {
  const [version, payload, signature] = String(token ?? '').split('.');
  if (version !== 'v1' || !payload || !signature) return null;

  const expected = Buffer.from(sign(secret, payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  return claims.exp * 1000 > now ? claims : null;
}
