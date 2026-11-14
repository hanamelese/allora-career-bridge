import { Router } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import { referralPartnerSchema } from '@onboarding/contracts';
import { referralPartners } from '../db/schema.js';
import { newId } from '../db/keys.js';
import { validateBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errors.js';

const REJECTED = 'These referral partner details were rejected.';

/**
 * The signed-in partner's own organisation settings - today, the referral
 * partners their learners can be referred to.
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

  return router;
}
