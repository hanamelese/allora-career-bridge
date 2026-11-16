import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createDatabase } from './db/client.js';
import { seedDatabase } from './db/seed.js';
import { exportSnapshot, restoreSnapshot, restoreSnapshotFromEnv } from './db/snapshot.js';
import { partnerUsers, submissions } from './db/schema.js';
import { createApp } from './app.js';

process.env.NODE_ENV = 'test';

const OWNER = { ownerEmail: 'demo@alx.example', ownerPassword: 'a-demo-password' };
const SITE = 'https://alx-savanna.vercel.app';

async function publishedSnapshot() {
  const { db } = createDatabase(':memory:');
  const seeded = seedDatabase(db, { partnerName: 'ALX Ethiopia', email: 'partner@alx.example', password: 'onboarding-demo' });
  const app = createApp(db);
  const { token } = (await request(app).post('/api/v1/auth/login').send({ email: 'partner@alx.example', password: 'onboarding-demo' })).body;
  await request(app).post(`/api/v1/forms/${seeded.formIds.signup}/publish`).set('authorization', `Bearer ${token}`);
  return { snapshot: exportSnapshot(db, seeded.publicKey), seeded };
}

describe('demo snapshot', () => {
  it('holds forms only: no users, passwords, secret keys or answers', async () => {
    const { snapshot } = await publishedSnapshot();
    const text = JSON.stringify(snapshot);
    expect(text).not.toMatch(/partner@alx\.example|sk_live_|secret|passwordHash|\$2[aby]\$/);
    expect(Object.keys(snapshot).sort()).toEqual(['apiKey', 'format', 'forms', 'partner', 'versions']);
  });

  it('restores the same form ids and key on an empty server, which then serves the form to the allowed site', async () => {
    const { snapshot, seeded } = await publishedSnapshot();
    const { db } = createDatabase(':memory:');

    expect(restoreSnapshot(db, snapshot, { ...OWNER, allowedOrigins: [SITE] })).toBe(true);
    const app = createApp(db);

    const form = await request(app)
      .get(`/api/v1/public/forms/${seeded.formIds.signup}?key=${seeded.publicKey}`)
      .set('origin', SITE);
    expect(form.status).toBe(200);
    expect(form.headers['access-control-allow-origin']).toBe(SITE);

    const elsewhere = await request(app)
      .get(`/api/v1/public/forms/${seeded.formIds.signup}?key=${seeded.publicKey}`)
      .set('origin', 'https://elsewhere.example');
    expect(elsewhere.status).toBe(403);

    const login = await request(app).post('/api/v1/auth/login').send({ email: OWNER.ownerEmail, password: OWNER.ownerPassword });
    expect(login.status).toBe(200);
    expect(db.select().from(submissions).all()).toEqual([]);
  });

  it('does nothing the second time, and needs the owner from the environment', async () => {
    const { snapshot } = await publishedSnapshot();
    const { db } = createDatabase(':memory:');
    restoreSnapshot(db, snapshot, OWNER);
    expect(restoreSnapshot(db, snapshot, OWNER)).toBe(false);
    expect(db.select().from(partnerUsers).all()).toHaveLength(1);
    expect(() => restoreSnapshot(db, snapshot, { ownerEmail: 'x@y.z' })).toThrow(/DEMO_OWNER_PASSWORD/);
  });

  it('is off unless DEMO_SNAPSHOT is set; the committed ALX snapshot restores', () => {
    const { db } = createDatabase(':memory:');
    expect(restoreSnapshotFromEnv(db, {})).toBe(false);

    const file = new URL('../demo/alx-snapshot.json', import.meta.url).pathname;
    const restored = restoreSnapshotFromEnv(
      db,
      { DEMO_SNAPSHOT: file, DEMO_OWNER_EMAIL: OWNER.ownerEmail, DEMO_OWNER_PASSWORD: OWNER.ownerPassword, DEMO_ALLOWED_ORIGINS: `${SITE}/` },
      { log() {} },
    );
    expect(restored).toBe(true);
    const ids = JSON.parse(readFileSync(file, 'utf8')).forms.map((form) => form.id);
    expect(ids).toEqual(expect.arrayContaining(['frm_9907f7fc0113c63a', 'frm_bf1e9d4908a45f48', 'frm_b883f8fd2a3f719f']));
  });
});
