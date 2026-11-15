import { Router } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import { allowedOriginRequestSchema, deliverySettingsSchema, referralPartnerSchema } from '@onboarding/contracts';
import { allowedOrigins, partners, referralPartners } from '../db/schema.js';
import { newDeliverySecret } from '../delivery.js';
import { newId } from '../db/keys.js';
import { validateBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errors.js';

const REJECTED = 'These referral partner details were rejected.';

/**
 * The signed-in partner's own organisation settings: the referral partners
 * their learners can be referred to, the websites allowed to show their
 * forms, and where submitted forms are delivered.
 *
 * Every query is scoped by the partner id in the token, so another
 * partner's referral partner is simply not found.
 */
export function organisationRoutes(db) {
  const router = Router();

  function present(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  function findActive(partnerId, id) {
    const row = db
      .select()
      .from(referralPartners)
      .where(
        and(
          eq(referralPartners.id, id),
          eq(referralPartners.partnerId, partnerId),
          eq(referralPartners.status, 'active'),
        ),
      )
      .get();

    if (!row) {
      throw new ApiError(404, 'referral_partner_not_found', 'That referral partner does not exist.');
    }

    return row;
  }

  router.get('/referral-partners', (request, response) => {
    const rows = db
      .select()
      .from(referralPartners)
      .where(
        and(
          eq(referralPartners.partnerId, request.auth.partnerId),
          eq(referralPartners.status, 'active'),
        ),
      )
      .orderBy(asc(referralPartners.name))
      .all();

    response.json(rows.map(present));
  });

  router.post('/referral-partners', validateBody(referralPartnerSchema, REJECTED), (request, response) => {
    const row = {
      id: newId('rp'),
      partnerId: request.auth.partnerId,
      ...request.validated,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    db.insert(referralPartners).values(row).run();
    response.status(201).json(present(row));
  });

  router.put('/referral-partners/:id', validateBody(referralPartnerSchema, REJECTED), (request, response) => {
    const existing = findActive(request.auth.partnerId, request.params.id);
    const updatedAt = new Date().toISOString();

    db.update(referralPartners)
      .set({ ...request.validated, updatedAt })
      .where(eq(referralPartners.id, existing.id))
      .run();

    response.json(present({ ...existing, ...request.validated, updatedAt }));
  });

  /* Archived, not deleted: a referral already sent keeps saying who it
     went to. An archived partner is never offered to a learner again. */
  router.delete('/referral-partners/:id', (request, response) => {
    const existing = findActive(request.auth.partnerId, request.params.id);

    db.update(referralPartners)
      .set({ status: 'archived', updatedAt: new Date().toISOString() })
      .where(eq(referralPartners.id, existing.id))
      .run();

    response.status(204).end();
  });

  /* ---- Websites allowed to show this partner's embedded forms ---- */

  function listOrigins(partnerId) {
    return db
      .select({ id: allowedOrigins.id, origin: allowedOrigins.origin, createdAt: allowedOrigins.createdAt })
      .from(allowedOrigins)
      .where(eq(allowedOrigins.partnerId, partnerId))
      .orderBy(asc(allowedOrigins.origin))
      .all();
  }

  router.get('/allowed-origins', (request, response) => {
    response.json(listOrigins(request.auth.partnerId));
  });

  router.post(
    '/allowed-origins',
    validateBody(allowedOriginRequestSchema, 'That website address was rejected.'),
    (request, response) => {
      const { origin } = request.validated;
      const partnerId = request.auth.partnerId;
      const existing = listOrigins(partnerId).find((row) => row.origin === origin);

      /* Adding one that is already there is harmless. */
      if (existing) return response.status(200).json(existing);

      const row = { id: newId('org'), partnerId, origin, createdAt: new Date().toISOString() };
      db.insert(allowedOrigins).values(row).run();

      response.status(201).json({ id: row.id, origin: row.origin, createdAt: row.createdAt });
    },
  );

  /* ---- Where submitted forms are delivered ----
     The organisation's own address. Learners' browsers post answers there
     directly; this service only signs the token that goes with them. The
     signing secret is made when an address is first saved and shown only
     to the signed-in partner. */

  function presentDelivery(partnerId) {
    const row = db
      .select({ url: partners.deliveryUrl, secret: partners.deliverySecret })
      .from(partners)
      .where(eq(partners.id, partnerId))
      .get();

    return { url: row?.url ?? null, secret: row?.url ? row.secret : null };
  }

  router.get('/delivery', (request, response) => {
    response.set('Cache-Control', 'no-store');
    response.json(presentDelivery(request.auth.partnerId));
  });

  router.put(
    '/delivery',
    validateBody(deliverySettingsSchema, 'That delivery address was rejected.'),
    (request, response) => {
      const partnerId = request.auth.partnerId;
      const { url } = request.validated;
      const current = db.select({ secret: partners.deliverySecret }).from(partners).where(eq(partners.id, partnerId)).get();

      db.update(partners)
        .set({ deliveryUrl: url, deliverySecret: url ? (current?.secret ?? newDeliverySecret()) : current?.secret ?? null })
        .where(eq(partners.id, partnerId))
        .run();

      response.set('Cache-Control', 'no-store');
      response.json(presentDelivery(partnerId));
    },
  );

  /* A new secret, if the old one was exposed. Deliveries signed with the
     old one stop passing the receiver's check at once. */
  router.post('/delivery/secret', (request, response) => {
    const partnerId = request.auth.partnerId;

    if (!presentDelivery(partnerId).url) {
      throw new ApiError(409, 'delivery_not_configured', 'Save a delivery address first.');
    }

    db.update(partners).set({ deliverySecret: newDeliverySecret() }).where(eq(partners.id, partnerId)).run();

    response.set('Cache-Control', 'no-store');
    response.json(presentDelivery(partnerId));
  });

  router.delete('/allowed-origins/:id', (request, response) => {
    const result = db
      .delete(allowedOrigins)
      .where(and(eq(allowedOrigins.id, request.params.id), eq(allowedOrigins.partnerId, request.auth.partnerId)))
      .run();

    if (result.changes === 0) {
      throw new ApiError(404, 'allowed_origin_not_found', 'That website is not on your list.');
    }

    response.status(204).end();
  });

  return router;
}
