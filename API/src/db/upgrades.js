import { and, eq } from 'drizzle-orm';
import {
  FORM_TEMPLATES,
  formConfigSchema,
  moveIdentityToEnd,
  upgradeLearnerDraft,
} from '@onboarding/contracts';
import { partners, partnerForms } from './schema.js';
import { insertForm } from './partners.js';

/**
 * Brings stored drafts forward to the current templates. Runs at start-up
 * and is idempotent: a draft that is already current is not written.
 *
 * Only drafts change. Published versions are immutable (see the triggers
 * in client.js), so a website pinned to one is unaffected.
 *
 * For the learner form (`signup`) it merges in each partner's Learner
 * Profile & Support draft (`learner`) - that row is left in place, unused,
 * so nothing is destroyed - and moves the identity questions to the end.
 */
export function upgradeStoredDrafts(db) {
  const signupForms = db.select().from(partnerForms).where(eq(partnerForms.type, 'signup')).all();
  let upgraded = 0;

  for (const form of signupForms) {
    const profile = db
      .select()
      .from(partnerForms)
      .where(and(eq(partnerForms.partnerId, form.partnerId), eq(partnerForms.type, 'learner')))
      .get();

    /* Merge in the profile questions, then put the identity questions
       last, beside the referral step they lead to. */
    const next = moveIdentityToEnd(
      upgradeLearnerDraft(form.draftConfig, profile?.draftConfig ?? null),
    );

    if (next === form.draftConfig) continue;

    /* Never store something the draft endpoint itself would refuse. */
    if (!formConfigSchema.safeParse(next).success) {
      console.warn(`Draft ${form.id} could not be upgraded automatically; left unchanged.`);
      continue;
    }

    db.update(partnerForms)
      .set({ draftConfig: next, updatedAt: new Date().toISOString() })
      .where(eq(partnerForms.id, form.id))
      .run();

    upgraded += 1;
  }

  return { upgraded };
}

/**
 * Gives every partner a draft of any form type added since they joined -
 * the Sign up / Sign in form, for a partner created before it existed.
 * Idempotent: a partner that already has the form is left alone.
 */
export function ensurePartnerForms(db) {
  const all = db.select({ id: partners.id }).from(partners).all();
  let created = 0;

  for (const { id: partnerId } of all) {
    const existing = new Set(
      db
        .select({ type: partnerForms.type })
        .from(partnerForms)
        .where(eq(partnerForms.partnerId, partnerId))
        .all()
        .map((row) => row.type),
    );

    for (const type of Object.keys(FORM_TEMPLATES)) {
      if (existing.has(type)) continue;
      insertForm(db, partnerId, type);
      created += 1;
    }
  }

  return { created };
}
