import { Router } from 'express';
import { and, asc, eq, desc } from 'drizzle-orm';
import { deliveryTokenRequestSchema, referralRequestSchema } from '@onboarding/contracts';
import {
  partnerForms,
  formVersions,
  apiKeys,
  partners,
  referralPartners,
  referrals,
} from '../db/schema.js';
import { signDeliveryToken } from '../delivery.js';
import { speechHandlers } from './speech.js';
import { ApiError } from '../middleware/errors.js';
import { validateBody } from '../middleware/validate.js';
import {
  createRateLimiter,
  findReferralByToken,
  presentReferral,
  sendReferrals,
} from '../referrals.js';

/**
 * The public form API.
 *
 * This is what the embedded widget reads. It serves published versions
 * only - a draft is never visible to a learner - and it is reached with a
 * public key, which allows nothing beyond reading a published config for
 * that partner's own forms and sending a learner's referral to that
 * partner's own registered referral partners, and issuing the token that
 * goes with a delivery to the organisation's own server (see delivery.js),
 * and reading that form's own text aloud (see speech.js).
 * A learner's answers never come here: their browser sends them straight
 * to the organisation.
 *
 * The referral link routes at the bottom need no key: the unguessable
 * token in the link is the credential.
 */
export function publicFormRoutes(
  db,
  {
    sms = null,
    rateLimiter = createRateLimiter(),
    /* Generous enough for a family sharing one connection, tight enough
       that a script cannot mint tokens in bulk. */
    deliveryLimiter = createRateLimiter({ limit: 20 }),
    /* Read-aloud audio: a few questions a minute for every learner on a
       shared connection, not a free speech service for anyone else. */
    speech = null,
    speechLimiter = createRateLimiter({ limit: 120, windowMs: 60_000 }),
  } = {},
) {
  const router = Router();

  function requireKey(request) {
    const publicKey = request.get('x-public-key') ?? request.query.key;

    if (typeof publicKey !== 'string' || !publicKey) {
      throw new ApiError(401, 'missing_public_key', 'A public key is required.');
    }

    const key = db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.publicKey, publicKey), eq(apiKeys.status, 'active')))
      .get();

    if (!key) {
      throw new ApiError(401, 'invalid_public_key', 'That public key is not valid.');
    }

    return key;
  }

  function findPublishedForm(key, formId) {
    const form = db
      .select()
      .from(partnerForms)
      .where(and(eq(partnerForms.id, formId), eq(partnerForms.partnerId, key.partnerId)))
      .get();

    if (!form || form.currentVersion === null) {
      throw new ApiError(404, 'form_not_published', 'That form has not been published.');
    }

    return form;
  }

  /* Names only. A learner never needs a referral partner's phone or email,
     and the server is the only place those are used. */
  function referralPartnerNames(partnerId) {
    return db
      .select({ id: referralPartners.id, name: referralPartners.name })
      .from(referralPartners)
      .where(and(eq(referralPartners.partnerId, partnerId), eq(referralPartners.status, 'active')))
      .orderBy(asc(referralPartners.name))
      .all();
  }

  router.get('/forms/:formId', (request, response) => {
    const key = requireKey(request);
    const form = findPublishedForm(key, request.params.formId);

    const requested = request.query.version ? Number(request.query.version) : form.currentVersion;

    if (!Number.isInteger(requested)) {
      throw new ApiError(400, 'invalid_version', 'The version must be a whole number.');
    }

    const version = db
      .select()
      .from(formVersions)
      .where(
        and(eq(formVersions.partnerFormId, form.id), eq(formVersions.version, requested)),
      )
      .orderBy(desc(formVersions.version))
      .get();

    if (!version) {
      throw new ApiError(404, 'version_not_found', `Version ${requested} does not exist.`);
    }

    const asksForReferral = (version.config.fields ?? []).some(
      (field) => field.key === 'referral' && field.enabled,
    );

    /* Checked with the server each time (cheaply: the ETag answers 304
       when nothing changed), so a referral partner added, or a website
       removed from the allowed list, takes effect at once. */
    response.set('Cache-Control', 'no-cache');

    /* The organisation's name is public anyway (it is on the form), and
       the learner's SMS preview needs it to match the message sent. */
    const organisation = db
      .select({ name: partners.name, deliveryUrl: partners.deliveryUrl })
      .from(partners)
      .where(eq(partners.id, key.partnerId))
      .get();

    response.json({
      formId: form.id,
      type: form.type,
      organisationName: organisation?.name ?? '',
      /* Whether sent answers also go to the organisation's own server (the
         address itself is given only with a delivery token). */
      delivery: form.type !== 'account' && Boolean(organisation?.deliveryUrl),
      version: version.version,
      publishedAt: version.publishedAt,
      config: version.config,
      referralPartners: asksForReferral ? referralPartnerNames(key.partnerId) : [],
    });
  });

  router.post(
    '/forms/:formId/referrals',
    validateBody(referralRequestSchema, 'This referral request was rejected.'),
    async (request, response) => {
      const key = requireKey(request);
      const form = findPublishedForm(key, request.params.formId);

      const published = db
        .select()
        .from(formVersions)
        .where(
          and(eq(formVersions.partnerFormId, form.id), eq(formVersions.version, form.currentVersion)),
        )
        .get();

      const asksForReferral = (published?.config.fields ?? []).some(
        (field) => field.key === 'referral' && field.enabled,
      );

      if (!asksForReferral) {
        throw new ApiError(404, 'referral_not_offered', 'This form does not offer referrals.');
      }

      if (!rateLimiter(`${key.publicKey}|${request.ip}`)) {
        throw new ApiError(
          429,
          'rate_limited',
          'Too many referral links were sent from here. Wait a few minutes and try again.',
        );
      }

      const result = await sendReferrals(db, sms, {
        partnerId: key.partnerId,
        partnerFormId: form.id,
        request: request.validated,
      });

      response.json(result);
    },
  );

  /* ---- A learner sends the form: where to, and the token to send with it ---- */

  router.post(
    '/forms/:formId/delivery',
    validateBody(deliveryTokenRequestSchema, 'This form could not be sent.'),
    (request, response) => {
      const key = requireKey(request);
      const form = findPublishedForm(key, request.params.formId);
      const { version: versionNumber } = request.validated;

      /* A sign-in form holds a password; it goes only to the website's own
         sign-in, never to a delivery address. */
      if (form.type === 'account') {
        throw new ApiError(422, 'not_delivered', 'Sign up and sign in forms are handled by the website itself.');
      }

      const version = db
        .select({ version: formVersions.version })
        .from(formVersions)
        .where(and(eq(formVersions.partnerFormId, form.id), eq(formVersions.version, versionNumber)))
        .get();

      if (!version) {
        throw new ApiError(404, 'version_not_found', `Version ${versionNumber} does not exist.`);
      }

      const organisation = db.select().from(partners).where(eq(partners.id, key.partnerId)).get();

      if (!organisation?.deliveryUrl || !organisation.deliverySecret) {
        throw new ApiError(
          409,
          'delivery_not_configured',
          'This organisation has not set up where its forms are sent, so this form cannot be sent yet.',
        );
      }

      if (!deliveryLimiter(`${key.publicKey}|${request.ip}`)) {
        throw new ApiError(429, 'rate_limited', 'Too many forms were sent from here. Wait a few minutes and try again.');
      }

      const { token, expiresAt } = signDeliveryToken(organisation.deliverySecret, {
        formId: form.id,
        version: version.version,
        publicKey: key.publicKey,
      });

      response.set('Cache-Control', 'no-store');
      response.json({ deliveryUrl: organisation.deliveryUrl, token, expiresAt });
    },
  );

  /* ---- Read aloud: the form's own text as audio (see ../speech.js) ---- */

  if (speech) {
    router.post(
      '/forms/:formId/speech',
      ...speechHandlers({
        speech,
        limiter: speechLimiter,
        keyOf: (request) => `${request.speechKey}|${request.ip}`,
        authorise(request) {
          const key = requireKey(request);
          findPublishedForm(key, request.params.formId);
          request.speechKey = key.publicKey;
        },
      }),
    );
  }

  /* ---- Referral links, opened by the referral partner ---- */

  router.get('/referrals/:token', (request, response) => {
    const row = findReferralByToken(db, request.params.token);

    response.set('Cache-Control', 'no-store');
    response.json(presentReferral(db, row));
  });

  router.post('/referrals/:token/accept', (request, response) => {
    const row = findReferralByToken(db, request.params.token);

    /* Accepting twice is harmless and keeps the first time. */
    const acceptedAt = row.acceptedAt ?? new Date().toISOString();

    if (row.status !== 'accepted') {
      db.update(referrals)
        .set({ status: 'accepted', acceptedAt })
        .where(eq(referrals.id, row.id))
        .run();
    }

    response.set('Cache-Control', 'no-store');
    response.json(presentReferral(db, { ...row, status: 'accepted', acceptedAt }));
  });

  return router;
}
