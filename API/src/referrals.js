import { randomBytes } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { buildReferralMessage } from '@onboarding/contracts';
import { config } from './config.js';
import { partners, referralPartners, referrals } from './db/schema.js';
import { hashSecretKey, newId } from './db/keys.js';
import { ApiError } from './middleware/errors.js';

/**
 * Sending a learner's referral to one or more referral partners.
 *
 * Shared by the public endpoint the embedded form uses and the dashboard's
 * test endpoint, so both send exactly the same message the learner was
 * shown (`buildReferralMessage`, from the contracts package).
 *
 * Honesty rules:
 * - With no SMS provider configured, nothing is recorded and the request
 *   fails with `sms_not_configured`.
 * - Each recipient's row says `sent` only after the provider accepted the
 *   message; otherwise `failed`, with the provider's error code.
 * - Only this partner's own active referral partners can be messaged, so
 *   the endpoint can never be used to text an arbitrary number.
 */
export async function sendReferrals(db, sms, { partnerId, partnerFormId, request, isTest = false }) {
  if (!sms) {
    throw new ApiError(
      503,
      'sms_not_configured',
      'Text messages cannot be sent: no SMS provider is set up for this service.',
    );
  }

  const recipients = db
    .select()
    .from(referralPartners)
    .where(
      and(
        eq(referralPartners.partnerId, partnerId),
        eq(referralPartners.status, 'active'),
        inArray(referralPartners.id, request.partnerIds),
      ),
    )
    .all();

  if (recipients.length !== request.partnerIds.length) {
    throw new ApiError(
      422,
      'unknown_referral_partner',
      'One or more of the chosen organisations is not available.',
    );
  }

  const organisation = db.select().from(partners).where(eq(partners.id, partnerId)).get();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.referralLifetimeDays * 86_400_000);

  const results = [];

  /* One at a time, in the order chosen: a handful of messages at most. */
  for (const partnerIdToSend of request.partnerIds) {
    const recipient = recipients.find((item) => item.id === partnerIdToSend);
    const token = randomBytes(24).toString('base64url');
    const id = newId('ref');

    db.insert(referrals)
      .values({
        id,
        partnerId,
        referralPartnerId: recipient.id,
        partnerFormId,
        learnerName: request.learner.name,
        learnerPhone: request.learner.phone || null,
        language: request.language,
        tokenHash: hashSecretKey(token),
        status: 'pending',
        isTest,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      })
      .run();

    const body = buildReferralMessage({
      organisationName: organisation.name,
      learnerName: request.learner.name,
      learnerPhone: request.learner.phone,
      link: `${config.publicAppUrl}/referrals/${token}`,
      language: request.language,
      isTest,
    });

    try {
      const { providerMessageId } = await sms.send({ to: recipient.phone, body });

      db.update(referrals)
        .set({ status: 'sent', providerMessageId: providerMessageId ?? null })
        .where(eq(referrals.id, id))
        .run();

      results.push({ partnerId: recipient.id, name: recipient.name, status: 'sent' });
    } catch (error) {
      /* The provider's reason is kept for staff; the learner is told only
         that it failed. No message body or number is logged. */
      db.update(referrals)
        .set({ status: 'failed', errorCode: String(error?.code ?? 'send_failed').slice(0, 60) })
        .where(eq(referrals.id, id))
        .run();

      results.push({ partnerId: recipient.id, name: recipient.name, status: 'failed' });
    }
  }

  return { results };
}

/** The referral a token points to, or an error a person can act on. */
export function findReferralByToken(db, token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) {
    throw new ApiError(404, 'referral_not_found', 'This referral link is not valid.');
  }

  const row = db.select().from(referrals).where(eq(referrals.tokenHash, hashSecretKey(token))).get();

  /* A link whose SMS never went out was never delivered, so it is treated
     as not existing. */
  if (!row || row.status === 'pending' || row.status === 'failed') {
    throw new ApiError(404, 'referral_not_found', 'This referral link is not valid.');
  }

  if (new Date(row.expiresAt) < new Date()) {
    throw new ApiError(410, 'referral_expired', 'This referral link has expired.');
  }

  return row;
}

export function presentReferral(db, row) {
  const organisation = db.select().from(partners).where(eq(partners.id, row.partnerId)).get();
  const recipient = db
    .select()
    .from(referralPartners)
    .where(eq(referralPartners.id, row.referralPartnerId))
    .get();

  return {
    organisationName: organisation?.name ?? '',
    referralPartnerName: recipient?.name ?? '',
    learnerName: row.learnerName,
    learnerPhone: row.learnerPhone,
    status: row.status,
    isTest: row.isTest,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    acceptedAt: row.acceptedAt,
  };
}

/**
 * A simple per-key, per-address limit on public sends. In memory, so it
 * resets on restart and is per process - enough to stop a page being used
 * to send texts in a loop; a deployment behind several processes would
 * move this to a shared store.
 */
export function createRateLimiter({ limit = 5, windowMs = 10 * 60_000 } = {}) {
  const hits = new Map();

  return function allow(key) {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);

    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }

    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}
