import { eq } from 'drizzle-orm';
import { createDatabase } from './client.js';
import { config } from '../config.js';
import { partnerUsers } from './schema.js';
import { createPartnerAccount } from './partners.js';

/**
 * Puts one partner in place with one form of each type.
 *
 * The form defaults come from `FORM_TEMPLATES` in the shared contracts
 * package - the same object the dashboard seeds a new form from - so the
 * two cannot drift apart.
 *
 * Returns the secret key, because this is the only moment it exists in
 * readable form. Only its hash is stored.
 */
export function seedDatabase(db, { partnerName, email, password }) {

  const existing = db.select().from(partnerUsers).where(eq(partnerUsers.email, email)).get();

  if (existing) {
    return { alreadySeeded: true, partnerId: existing.partnerId, secretKey: null };
  }

  const { partnerId, publicKey, secretKey, formIds } = createPartnerAccount(db, {
    partnerName,
    email,
    password,
  });

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
    console.log(`Seeded one partner with ${Object.keys(result.formIds).length} forms.\n`);
    console.log(`  Sign in with : ${process.env.SEED_EMAIL ?? 'partner@alx.example'}`);
    console.log(`  Password     : ${process.env.SEED_PASSWORD ?? 'onboarding-demo'}`);
    console.log(`  Public key   : ${result.publicKey}`);
    console.log(`  Secret key   : ${result.secretKey}`);
    console.log('\nThe secret key is shown this once only - it is stored as a hash.');
    console.log('It belongs on your server. Never put it in a web page.');
  }
}
