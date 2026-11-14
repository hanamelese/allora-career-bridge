import { FORM_TEMPLATES } from '@onboarding/contracts';
import { partners, partnerUsers, apiKeys, formTemplates, partnerForms } from './schema.js';
import { newId, createKeyPair, hashSecretKey, hashPassword } from './keys.js';

/**
 * Creates a partner organisation with its owner, its key pair and one
 * draft of every form, in a single transaction - so a failure part-way
 * never leaves an organisation that can sign in but has no forms.
 *
 * Used by the seed script and by partner sign-up. The caller checks the
 * email is free first; the unique index is the backstop.
 *
 * Returns the secret key, because this is the only moment it exists in
 * readable form. Only its hash is stored.
 */
export function createPartnerAccount(db, { partnerName, email, password }) {
  const now = new Date().toISOString();
  const partnerId = newId('ptn');
  const userId = newId('usr');
  const { publicKey, secretKey } = createKeyPair();
  const formIds = {};

  db.transaction((tx) => {
    tx.insert(partners).values({ id: partnerId, name: partnerName, status: 'active', createdAt: now }).run();

    tx.insert(partnerUsers)
      .values({
        id: userId,
        partnerId,
        email,
        passwordHash: hashPassword(password),
        role: 'owner',
        createdAt: now,
      })
      .run();

    tx.insert(apiKeys)
      .values({
        id: newId('key'),
        partnerId,
        publicKey,
        secretKeyHash: hashSecretKey(secretKey),
        status: 'active',
        createdAt: now,
      })
      .run();

    for (const [type, template] of Object.entries(FORM_TEMPLATES)) {
      formIds[type] = insertForm(tx, partnerId, type, template);
    }
  });

  return { partnerId, userId, publicKey, secretKey, formIds };
}

/**
 * One draft form of a type, from its template. Form ids are generated, not
 * derived from the type: one partner's id must never collide with
 * another's. The dashboard finds a form by its type.
 */
export function insertForm(db, partnerId, type, template = FORM_TEMPLATES[type]) {
  db.insert(formTemplates)
    .values({ id: newId('tpl'), type, defaultConfig: template })
    .onConflictDoNothing()
    .run();

  const formId = newId('frm');

  db.insert(partnerForms)
    .values({
      id: formId,
      partnerId,
      type,
      /* The stored draft names the form it belongs to, which is what the
         draft endpoint checks before accepting an update. */
      draftConfig: { ...template, formId },
      currentVersion: null,
      status: 'draft',
      updatedAt: null,
      publishedAt: null,
    })
    .run();

  return formId;
}
