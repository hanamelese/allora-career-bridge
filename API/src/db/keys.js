import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';

/**
 * Identifiers and API keys.
 *
 * A key pair is issued once per partner. The public key is handed out
 * freely - it appears in the embed tag on a partner's own website. The
 * secret key is shown exactly once and stored only as a hash.
 */

export function newId(prefix) {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}

export function createKeyPair() {
  const publicKey = `pk_live_${randomBytes(12).toString('hex')}`;
  const secretKey = `sk_live_${randomBytes(24).toString('hex')}`;

  return { publicKey, secretKey };
}

/* A plain SHA-256 is right for a long random key: it needs to be looked up
   on every request, and there is no low-entropy password to protect. */
export function hashSecretKey(secretKey) {
  return createHash('sha256').update(secretKey).digest('hex');
}

/* Passwords are a different matter - they are chosen by people, so they
   get a deliberately slow hash. */
export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}
