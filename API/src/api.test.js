import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { createDatabase } from './db/client.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';

/* NODE_ENV=test makes the config use a fixed signing secret, so these
   tests do not need a .env file. */
process.env.NODE_ENV = 'test';

const PASSWORD = 'onboarding-demo';

let app;
let seeded;
let token;
let formId;

async function signIn(email, password = PASSWORD) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  return response;
}

beforeEach(async () => {
  const { db } = createDatabase(':memory:');

  seeded = seedDatabase(db, {
    partnerName: 'ALX Ethiopia',
    email: 'partner@alx.example',
    password: PASSWORD,
  });

  app = createApp(db);
  app.locals.db = db;

  const response = await signIn('partner@alx.example');
  token = response.body.token;
  formId = seeded.formIds.signup;
});

const authed = (method, path) => request(app)[method](path).set('authorization', `Bearer ${token}`);

describe('signing in', () => {
  it('returns a token and the partner', async () => {
    const response = await signIn('partner@alx.example');

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.partner.name).toBe('ALX Ethiopia');
  });

  it('refuses a wrong password', async () => {
    const response = await signIn('partner@alx.example', 'not-the-password');

    expect(response.status).toBe(401);
  });

  it('says the same thing for an unknown address as for a wrong password', async () => {
    const unknown = await signIn('nobody@alx.example');
    const wrong = await signIn('partner@alx.example', 'not-the-password');

    expect(unknown.status).toBe(401);
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it('never returns a password hash', async () => {
    const response = await signIn('partner@alx.example');

    expect(JSON.stringify(response.body)).not.toContain('$2');
  });
});

describe('reaching the dashboard API', () => {
  it('refuses a request with no token', async () => {
    const response = await request(app).get('/api/v1/forms');

    expect(response.status).toBe(401);
  });

  it('refuses a token that was not signed by us', async () => {
    const response = await request(app)
      .get('/api/v1/forms')
      .set('authorization', 'Bearer not.a.real.token');

    expect(response.status).toBe(401);
  });

  it('lists the partner‘s four forms', async () => {
    const response = await authed('get', '/api/v1/forms');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(4);
    expect(response.body.map((form) => form.type).sort()).toEqual([
      'employer',
      'jobApplication',
      'learner',
      'signup',
    ]);
  });

  it('returns a form with its draft and the public key, but no secret key', async () => {
    const response = await authed('get', `/api/v1/forms/${formId}`);

    expect(response.status).toBe(200);
    expect(response.body.draftConfig.type).toBe('signup');
    expect(response.body.publicKey).toMatch(/^pk_live_/);
    expect(JSON.stringify(response.body)).not.toContain('sk_live_');
  });
});

describe('saving a draft', () => {
  it('stores the change', async () => {
    const before = await authed('get', `/api/v1/forms/${formId}`);
    const config = {
      ...before.body.draftConfig,
      fields: before.body.draftConfig.fields.map((field) =>
        field.key === 'location' ? { ...field, enabled: false, required: false } : field,
      ),
    };

    const saved = await authed('put', `/api/v1/forms/${formId}/draft`).send(config);
    expect(saved.status).toBe(200);
    expect(saved.body.updatedAt).toBeTruthy();

    const after = await authed('get', `/api/v1/forms/${formId}`);
    const location = after.body.draftConfig.fields.find((field) => field.key === 'location');
    expect(location.enabled).toBe(false);
  });

  it('rejects a configuration the shared schema does not accept', async () => {
    const before = await authed('get', `/api/v1/forms/${formId}`);
    const config = {
      ...before.body.draftConfig,
      /* Switching off a locked question - the dashboard prevents it, and
         the server does not take the dashboard's word for it. */
      fields: before.body.draftConfig.fields.map((field) =>
        field.key === 'consent' ? { ...field, enabled: false } : field,
      ),
    };

    const response = await authed('put', `/api/v1/forms/${formId}/draft`).send(config);

    expect(response.status).toBe(422);
    expect(response.body.issues.length).toBeGreaterThan(0);
  });

  it('refuses a draft that belongs to another form', async () => {
    const before = await authed('get', `/api/v1/forms/${formId}`);

    const response = await authed('put', `/api/v1/forms/${formId}/draft`).send({
      ...before.body.draftConfig,
      formId: 'frm_somewhere_else',
    });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('form_id_mismatch');
  });
});

describe('publishing', () => {
  it('creates version 1 and marks the form published', async () => {
    const response = await authed('post', `/api/v1/forms/${formId}/publish`);

    expect(response.status).toBe(201);
    expect(response.body.currentVersion).toBe(1);
    expect(response.body.status).toBe('published');
    expect(response.body.versions).toHaveLength(1);
  });

  it('numbers each publish in turn', async () => {
    await authed('post', `/api/v1/forms/${formId}/publish`);
    const second = await authed('post', `/api/v1/forms/${formId}/publish`);

    expect(second.body.currentVersion).toBe(2);
    expect(second.body.versions.map((version) => version.version)).toEqual([1, 2]);
  });

  it('keeps the accessibility settings and field structure in the version', async () => {
    const before = await authed('get', `/api/v1/forms/${formId}`);
    await authed('post', `/api/v1/forms/${formId}/publish`);

    const versions = await authed('get', `/api/v1/forms/${formId}/versions`);
    const published = versions.body[0].config;

    expect(published.features).toEqual(before.body.draftConfig.features);
    expect(published.identityRoutes).toEqual(before.body.draftConfig.identityRoutes);
    expect(published.fields).toEqual(before.body.draftConfig.fields);
    expect(published.languages).toEqual(['en', 'am']);
  });

  /* The promise the whole versioning scheme rests on. */
  it('leaves a published version untouched when the draft changes afterwards', async () => {
    await authed('post', `/api/v1/forms/${formId}/publish`);

    const afterPublish = await authed('get', `/api/v1/forms/${formId}/versions`);
    const original = JSON.stringify(afterPublish.body[0].config);

    const form = await authed('get', `/api/v1/forms/${formId}`);
    await authed('put', `/api/v1/forms/${formId}/draft`).send({
      ...form.body.draftConfig,
      fields: form.body.draftConfig.fields.map((field) =>
        field.key === 'location' ? { ...field, enabled: false, required: false } : field,
      ),
      features: { voiceInput: false, readAloud: false, lowLiteracy: false },
    });

    const afterEdit = await authed('get', `/api/v1/forms/${formId}/versions`);

    expect(JSON.stringify(afterEdit.body[0].config)).toBe(original);
  });

  it('will not publish a draft that is no longer valid', async () => {
    const { db } = createDatabase(':memory:');
    const local = seedDatabase(db, {
      partnerName: 'Broken',
      email: 'broken@alx.example',
      password: PASSWORD,
    });

    /* Write past the API to produce a draft the schema would reject. */
    db.$client
      .prepare('update partner_forms set draft_config = ? where id = ?')
      .run(JSON.stringify({ nonsense: true }), local.formIds.signup);

    const brokenApp = createApp(db);
    const signedIn = await request(brokenApp)
      .post('/api/v1/auth/login')
      .send({ email: 'broken@alx.example', password: PASSWORD });

    const response = await request(brokenApp)
      .post(`/api/v1/forms/${local.formIds.signup}/publish`)
      .set('authorization', `Bearer ${signedIn.body.token}`);

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('draft_invalid');
  });
});

describe('the database refuses to alter a published version', () => {
  it('aborts an update', async () => {
    const { db } = createDatabase(':memory:');
    const local = seedDatabase(db, {
      partnerName: 'Trigger Test',
      email: 'trigger@alx.example',
      password: PASSWORD,
    });

    const localApp = createApp(db);
    const signedIn = await request(localApp)
      .post('/api/v1/auth/login')
      .send({ email: 'trigger@alx.example', password: PASSWORD });

    await request(localApp)
      .post(`/api/v1/forms/${local.formIds.signup}/publish`)
      .set('authorization', `Bearer ${signedIn.body.token}`);

    expect(() =>
      db.$client.prepare('update form_versions set config = ?').run('{"tampered":true}'),
    ).toThrow(/cannot be changed/);

    expect(() => db.$client.prepare('delete from form_versions').run()).toThrow(
      /cannot be deleted/,
    );
  });
});

describe('one partner cannot reach another‘s forms', () => {
  it('does not find a form belonging to someone else', async () => {
    const { db } = createDatabase(':memory:');

    const first = seedDatabase(db, {
      partnerName: 'Partner One',
      email: 'one@alx.example',
      password: PASSWORD,
    });
    const second = seedDatabase(db, {
      partnerName: 'Partner Two',
      email: 'two@alx.example',
      password: PASSWORD,
    });

    const sharedApp = createApp(db);
    const secondSignIn = await request(sharedApp)
      .post('/api/v1/auth/login')
      .send({ email: 'two@alx.example', password: PASSWORD });

    const asSecond = (path) =>
      request(sharedApp).get(path).set('authorization', `Bearer ${secondSignIn.body.token}`);

    expect(first.formIds.signup).not.toBe(second.formIds.signup);
    expect((await asSecond(`/api/v1/forms/${first.formIds.signup}`)).status).toBe(404);
    expect((await asSecond(`/api/v1/forms/${second.formIds.signup}`)).status).toBe(200);

    const list = await asSecond('/api/v1/forms');
    expect(list.body.map((form) => form.formId)).not.toContain(first.formIds.signup);
  });
});

describe('the public form API', () => {
  const publicPath = () => `/api/v1/public/forms/${formId}`;

  it('needs a public key', async () => {
    const response = await request(app).get(publicPath());

    expect(response.status).toBe(401);
  });

  it('refuses an unknown public key', async () => {
    const response = await request(app).get(publicPath()).set('x-public-key', 'pk_live_nope');

    expect(response.status).toBe(401);
  });

  it('serves nothing until the form is published', async () => {
    const response = await request(app).get(publicPath()).set('x-public-key', seeded.publicKey);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('form_not_published');
  });

  it('serves the published configuration', async () => {
    await authed('post', `/api/v1/forms/${formId}/publish`);

    const response = await request(app).get(publicPath()).set('x-public-key', seeded.publicKey);

    expect(response.status).toBe(200);
    expect(response.body.version).toBe(1);
    expect(response.body.config.type).toBe('signup');
    expect(response.body.config.version).toBe('1');
  });

  it('keeps serving a pinned older version after a newer one is published', async () => {
    await authed('post', `/api/v1/forms/${formId}/publish`);
    const first = await request(app)
      .get(`${publicPath()}?version=1`)
      .set('x-public-key', seeded.publicKey);

    await authed('post', `/api/v1/forms/${formId}/publish`);
    const stillFirst = await request(app)
      .get(`${publicPath()}?version=1`)
      .set('x-public-key', seeded.publicKey);

    expect(stillFirst.status).toBe(200);
    expect(stillFirst.body.config).toEqual(first.body.config);
  });

  it('reports a version that does not exist', async () => {
    await authed('post', `/api/v1/forms/${formId}/publish`);

    const response = await request(app)
      .get(`${publicPath()}?version=99`)
      .set('x-public-key', seeded.publicKey);

    expect(response.status).toBe(404);
  });
});
