import { and, eq } from 'drizzle-orm';
import { formConfigSchema, upgradeLearnerDraft } from '@onboarding/contracts';
import { partnerForms } from './schema.js';

/**
 * Brings stored drafts forward to the current templates. Runs at start-up
 * and is idempotent: a draft that is already current is not written.
 *
 * Only drafts change. Published versions are immutable (see the triggers
 * in client.js), so a website pinned to one is unaffected.
 *
 * Today this has one job: merging each partner's Learner Profile & Support
 * draft (`learner`) into their Learner Registration draft (`signup`). The
 * `learner` row is left in place, unused, so nothing is destroyed.
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

    const next = upgradeLearnerDraft(form.draftConfig, profile?.draftConfig ?? null);

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
