import { eq } from 'drizzle-orm';
import { FORM_TEMPLATES } from '@onboarding/contracts';
import { createDatabase } from './client.js';
import { config } from '../config.js';
import {
  partners,
  partnerUsers,
  apiKeys,
  formTemplates,
  partnerForms,
} from './schema.js';
import { newId, createKeyPair, hashSecretKey, hashPassword } from './keys.js';

/**
 * Puts one partner in place with their four forms.
 *
 * The form defaults come from `FORM_TEMPLATES` in the shared contracts
 * package - the same object the dashboard seeds a new form from - so the
 * two cannot drift apart.
 *
 * Returns the secret key, because this is the only moment it exists in
 * readable form. Only its hash is stored.
 */
export function seedDatabase(db, { partnerName, email, password }) {
  const now = new Date().toISOString();

  const existing = db.select().from(partnerUsers).where(eq(partnerUsers.email, email)).get();

  if (existing) {
    return { alreadySeeded: true, partnerId: existing.partnerId, secretKey: null };
  }

  const partnerId = newId('ptn');

  db.insert(partners).values({ id: partnerId, name: partnerName, status: 'active', createdAt: now }).run();

  db.insert(partnerUsers)
    .values({
      id: newId('usr'),
      partnerId,
      email,
      passwordHash: hashPassword(password),
      role: 'owner',
      createdAt: now,
    })
    .run();

  const { publicKey, secretKey } = createKeyPair();

  db.insert(apiKeys)
    .values({
      id: newId('key'),
      partnerId,
      publicKey,
      secretKeyHash: hashSecretKey(secretKey),
      status: 'active',
      createdAt: now,
    })
    .run();

  const formIds = {};

  for (const [type, template] of Object.entries(FORM_TEMPLATES)) {
    db.insert(formTemplates)
      .values({ id: newId('tpl'), type, defaultConfig: template })
      .onConflictDoNothing()
      .run();

    /* Form ids are generated, not derived from the type: every partner
       gets their own four forms, and one partner's id must never collide
       with another's. The dashboard finds a form by its type. */
    const formId = newId('frm');
    formIds[type] = formId;

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
  }

  return { alreadySeeded: false, partnerId, publicKey, secretKey, formIds };
}

/* Run directly: node src/db/seed.js */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { db } = createDatabase(config.databaseUrl);

  const result = seedDatabase(db, {
    partnerName: process.env.SEED_PARTNER_NAME ?? 'ALX Ethiopia',
    email: process.env.SEED_EMAIL ?? 'partner@alx.example',
    password: process.env.SEED_PASSWORD ?? 'onboarding-demo',
  });

  if (result.alreadySeeded) {
    console.log('Already seeded. Nothing to do.');
  } else {
    console.log('Seeded one partner with four forms.\n');
    console.log(`  Sign in with : ${process.env.SEED_EMAIL ?? 'partner@alx.example'}`);
    console.log(`  Password     : ${process.env.SEED_PASSWORD ?? 'onboarding-demo'}`);
    console.log(`  Public key   : ${result.publicKey}`);
    console.log(`  Secret key   : ${result.secretKey}`);
    console.log('\nThe secret key is shown this once only - it is stored as a hash.');
    console.log('It belongs on your server. Never put it in a web page.');
  }
}
