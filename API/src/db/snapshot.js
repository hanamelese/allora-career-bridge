import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { partners, partnerUsers, apiKeys, partnerForms, formVersions, allowedOrigins } from './schema.js';
import { newId, hashPassword, hashSecretKey } from './keys.js';

/**
 * A demo snapshot: one organisation's forms, with their ids and public key,
 * so a server whose disk is wiped on every restart (a free hosting plan)
 * comes back with the same forms, and the embed tags already pasted on a
 * website keep working.
 *
 * What a snapshot holds is form configuration only: the organisation's id
 * and name, its public key (public by design: it is in every embed tag),
 * its forms and their published versions. It never holds users,
 * passwords, the secret key, the delivery secret, submissions or referrals.
 * The owner's sign-in comes from the server's environment at restore time.
 */

export const SNAPSHOT_FORMAT = 1;

export function exportSnapshot(db, publicKey) {
  const key = db.select().from(apiKeys).where(eq(apiKeys.publicKey, publicKey)).get();
  if (!key) throw new Error(`No organisation has the public key ${publicKey}.`);

  const partner = db.select().from(partners).where(eq(partners.id, key.partnerId)).get();
  const forms = db.select().from(partnerForms).where(eq(partnerForms.partnerId, partner.id)).all();
  const versions = forms.flatMap((form) =>
    db.select().from(formVersions).where(eq(formVersions.partnerFormId, form.id)).all(),
  );

  return {
    format: SNAPSHOT_FORMAT,
    partner: { id: partner.id, name: partner.name, createdAt: partner.createdAt },
    apiKey: { id: key.id, publicKey: key.publicKey, createdAt: key.createdAt },
    forms: forms.map(({ id, type, draftConfig, currentVersion, status, updatedAt, publishedAt }) => ({
      id,
      type,
      draftConfig,
      currentVersion,
      status,
      updatedAt,
      publishedAt,
    })),
    versions: versions.map(({ id, partnerFormId, version, config, publishedAt }) => ({
      id,
      partnerFormId,
      version,
      config,
      publishedAt,
    })),
  };
}

/**
 * Puts a snapshot's organisation in place if it is not there yet; does
 * nothing if it is. Returns whether it restored.
 */
export function restoreSnapshot(db, snapshot, { ownerEmail, ownerPassword, allowedOrigins: origins = [] }) {
  if (snapshot?.format !== SNAPSHOT_FORMAT) throw new Error('Not a demo snapshot this server understands.');
  if (!ownerEmail || !ownerPassword) {
    throw new Error('Restoring the demo snapshot needs DEMO_OWNER_EMAIL and DEMO_OWNER_PASSWORD.');
  }

  const now = new Date().toISOString();
  const partnerId = snapshot.partner.id;
  const exists = db.select().from(partners).where(eq(partners.id, partnerId)).get();

  db.transaction((tx) => {
    if (!exists) {
      tx.insert(partners)
        .values({ id: partnerId, name: snapshot.partner.name, status: 'active', createdAt: snapshot.partner.createdAt ?? now })
        .run();

      /* The secret key is not part of a snapshot; a fresh one is made and
         thrown away. Nothing in the demo signs with it. */
      tx.insert(apiKeys)
        .values({
          id: snapshot.apiKey.id,
          partnerId,
          publicKey: snapshot.apiKey.publicKey,
          secretKeyHash: hashSecretKey(`sk_live_${randomBytes(24).toString('hex')}`),
          status: 'active',
          createdAt: snapshot.apiKey.createdAt ?? now,
        })
        .run();

      for (const form of snapshot.forms) tx.insert(partnerForms).values({ ...form, partnerId }).run();
      for (const version of snapshot.versions) tx.insert(formVersions).values(version).run();
    }

    /* The owner and the websites are checked every start, so changing
       them in the environment takes effect at the next restart. */
    const owner = tx.select().from(partnerUsers).where(eq(partnerUsers.email, ownerEmail)).get();
    if (!owner) {
      tx.insert(partnerUsers)
        .values({ id: newId('usr'), partnerId, email: ownerEmail, passwordHash: hashPassword(ownerPassword), role: 'owner', createdAt: now })
        .run();
    }

    for (const origin of origins) {
      const listed = tx
        .select()
        .from(allowedOrigins)
        .where(and(eq(allowedOrigins.partnerId, partnerId), eq(allowedOrigins.origin, origin)))
        .get();
      if (!listed) tx.insert(allowedOrigins).values({ id: newId('org'), partnerId, origin, createdAt: now }).run();
    }
  });

  return !exists;
}

/** From the server's environment; does nothing unless DEMO_SNAPSHOT is set. */
export function restoreSnapshotFromEnv(db, env = process.env, log = console) {
  const file = env.DEMO_SNAPSHOT?.trim();
  if (!file) return false;

  const snapshot = JSON.parse(readFileSync(file, 'utf8'));
  const restored = restoreSnapshot(db, snapshot, {
    ownerEmail: env.DEMO_OWNER_EMAIL?.trim(),
    ownerPassword: env.DEMO_OWNER_PASSWORD,
    allowedOrigins: (env.DEMO_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  });
  log.log(
    restored
      ? `[api] demo snapshot restored: ${snapshot.partner.name}, ${snapshot.forms.length} forms`
      : `[api] demo snapshot already in place: ${snapshot.partner.name}`,
  );
  return restored;
}

/* Run directly: node src/db/snapshot.js <public key> [out file] */
if (import.meta.url === `file://${process.argv[1]}`) {
  const [publicKey, out = 'demo/alx-snapshot.json'] = process.argv.slice(2);
  if (!publicKey) {
    console.error('Usage: npm run db:export-snapshot -w api -- <public key> [out file]');
    process.exit(1);
  }
  const { config } = await import('../config.js');
  const { createDatabase } = await import('./client.js');
  const { db } = createDatabase(config.databaseUrl);
  const snapshot = exportSnapshot(db, publicKey);
  writeFileSync(out, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${out}: ${snapshot.partner.name}, ${snapshot.forms.length} forms, ${snapshot.versions.length} versions.`);
}
