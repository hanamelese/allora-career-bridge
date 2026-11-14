import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { eq } from 'drizzle-orm';
import { FORM_TEMPLATES } from '@onboarding/contracts';
import { createDatabase } from './db/client.js';
import { seedDatabase } from './db/seed.js';
import { partnerForms, referrals } from './db/schema.js';
import { createRateLimiter } from './referrals.js';
import { upgradeStoredDrafts } from './db/upgrades.js';
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

  it('lists the partner‘s forms', async () => {
    const response = await authed('get', '/api/v1/forms');

    expect(response.status).toBe(200);
    expect(response.body.map((form) => form.type).sort()).toEqual([
      'employer',
      'jobApplication',
      'signup',
    ]);
  });

  it('does not list a retired form type that is still stored', async () => {
    const { db } = app.locals;
    db.insert(partnerForms)
      .values({
        id: 'frm_legacy',
        partnerId: seeded.partnerId,
        type: 'learner',
        draftConfig: { ...FORM_TEMPLATES.signup, type: 'learner', formId: 'frm_legacy' },
        status: 'draft',
      })
      .run();

    const response = await authed('get', '/api/v1/forms');

    expect(response.body.map((form) => form.type)).not.toContain('learner');
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

  it('keeps the language settings and field structure in the version', async () => {
    const before = await authed('get', `/api/v1/forms/${formId}`);
    await authed('post', `/api/v1/forms/${formId}/publish`);

    const versions = await authed('get', `/api/v1/forms/${formId}/versions`);
    const published = versions.body[0].config;

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
      defaultLanguage: 'am',
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

describe('upgrading stored learner drafts', () => {
  it('merges the old profile form into registration, once', () => {
    const { db } = app.locals;
    const profileOnly = ['education', 'currentLevel', 'skills', 'careerGoal', 'supportNeeds', 'supportNote'];

    /* Put the registration draft back to its pre-merge shape, and add the
       partner's old profile draft with one setting changed. */
    const current = db.select().from(partnerForms).where(eq(partnerForms.id, formId)).get();
    db.update(partnerForms)
      .set({
        draftConfig: {
          ...current.draftConfig,
          fields: current.draftConfig.fields.filter((field) => !profileOnly.includes(field.key)),
        },
      })
      .where(eq(partnerForms.id, formId))
      .run();

    db.insert(partnerForms)
      .values({
        id: 'frm_profile',
        partnerId: seeded.partnerId,
        type: 'learner',
        draftConfig: {
          ...FORM_TEMPLATES.signup,
          type: 'learner',
          formId: 'frm_profile',
          fields: FORM_TEMPLATES.signup.fields.map((field) =>
            field.key === 'skills' ? { ...field, enabled: false } : field,
          ),
        },
        status: 'draft',
      })
      .run();

    expect(upgradeStoredDrafts(db).upgraded).toBe(1);

    const after = db.select().from(partnerForms).where(eq(partnerForms.id, formId)).get();
    const keys = after.draftConfig.fields.map((field) => field.key);

    for (const key of profileOnly) expect(keys).toContain(key);
    expect(after.draftConfig.fields.find((field) => field.key === 'skills').enabled).toBe(false);

    expect(upgradeStoredDrafts(db).upgraded).toBe(0);
  });
});

describe('referral partners', () => {
  const partner = { name: 'Bole Kebele Office', email: 'help@bole.example', phone: '+251 911 234 567' };

  it('starts with none', async () => {
    const response = await authed('get', '/api/v1/organisation/referral-partners');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('adds, edits and removes a partner', async () => {
    const created = await authed('post', '/api/v1/organisation/referral-partners').send(partner);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject(partner);

    const edited = await authed('put', `/api/v1/organisation/referral-partners/${created.body.id}`).send({
      ...partner,
      name: 'Bole Sub-city Office',
    });
    expect(edited.body.name).toBe('Bole Sub-city Office');

    const removed = await authed('delete', `/api/v1/organisation/referral-partners/${created.body.id}`);
    expect(removed.status).toBe(204);

    const list = await authed('get', '/api/v1/organisation/referral-partners');
    expect(list.body).toEqual([]);
  });

  it('requires a name, an email address and an international phone number', async () => {
    for (const bad of [
      { ...partner, name: '' },
      { ...partner, email: 'not-an-email' },
      { ...partner, phone: '0911234567' },
      { name: partner.name, email: partner.email },
    ]) {
      const response = await authed('post', '/api/v1/organisation/referral-partners').send(bad);
      expect(response.status).toBe(422);
    }
  });

  it('needs a sign-in', async () => {
    const response = await request(app).get('/api/v1/organisation/referral-partners');

    expect(response.status).toBe(401);
  });

  it('keeps each partner’s list to themselves', async () => {
    const created = await authed('post', '/api/v1/organisation/referral-partners').send(partner);

    seedDatabase(app.locals.db, { partnerName: 'Other NGO', email: 'other@ngo.example', password: PASSWORD });
    const other = (await signIn('other@ngo.example')).body.token;
    const asOther = (method, path) => request(app)[method](path).set('authorization', `Bearer ${other}`);

    expect((await asOther('get', '/api/v1/organisation/referral-partners')).body).toEqual([]);
    expect((await asOther('put', `/api/v1/organisation/referral-partners/${created.body.id}`).send(partner)).status).toBe(404);
    expect((await asOther('delete', `/api/v1/organisation/referral-partners/${created.body.id}`)).status).toBe(404);
  });
});

describe('referral links', () => {
  const details = { name: 'Bole Kebele Office', email: 'help@bole.example', phone: '+251 911 234 567' };
  const learner = { name: 'Abebe Kebede', phone: '0911234567' };

  /* A stand-in SMS provider for tests: records what it was asked to send,
     and accepts or refuses it. */
  function fakeSms({ fail = false } = {}) {
    const sent = [];
    return {
      name: 'test',
      sent,
      async send(message) {
        if (fail) {
          const error = new Error('provider refused');
          error.code = 'provider_refused';
          throw error;
        }
        sent.push(message);
        return { providerMessageId: `msg_${sent.length}` };
      },
    };
  }

  const withSms = (sms, options = {}) => createApp(app.locals.db, { sms, ...options });
  const tokenFrom = (body) => body.match(/referrals\/([A-Za-z0-9_-]+)/)[1];

  async function addPartner(extra = {}) {
    const response = await authed('post', '/api/v1/organisation/referral-partners').send({ ...details, ...extra });
    return response.body;
  }

  async function publish() {
    await authed('post', `/api/v1/forms/${formId}/publish`);
  }

  it('refuses to send, and records nothing, when no SMS provider is set up', async () => {
    const partner = await addPartner();

    const response = await authed('post', `/api/v1/forms/${formId}/referrals/test`).send({
      partnerIds: [partner.id],
      learner,
    });

    expect(response.status).toBe(503);
    expect(response.body.error).toBe('sms_not_configured');
    expect(app.locals.db.select().from(referrals).all()).toEqual([]);
  });

  it('sends the learner’s name and a working link from the preview, marked as a test', async () => {
    const partner = await addPartner();
    const sms = fakeSms();

    const response = await request(withSms(sms))
      .post(`/api/v1/forms/${formId}/referrals/test`)
      .set('authorization', `Bearer ${token}`)
      .send({ partnerIds: [partner.id], learner });

    expect(response.status).toBe(200);
    expect(response.body.results).toEqual([{ partnerId: partner.id, name: details.name, status: 'sent' }]);
    expect(sms.sent).toHaveLength(1);
    expect(sms.sent[0].to).toBe(details.phone);
    expect(sms.sent[0].body).toMatch(/^\[TEST\] ALX Ethiopia: Abebe Kebede/);
    expect(sms.sent[0].body).toContain('0911234567');

    const link = await request(app).get(`/api/v1/public/referrals/${tokenFrom(sms.sent[0].body)}`);
    expect(link.status).toBe(200);
    expect(link.body).toMatchObject({
      learnerName: 'Abebe Kebede',
      learnerPhone: '0911234567',
      organisationName: 'ALX Ethiopia',
      referralPartnerName: details.name,
      status: 'sent',
      isTest: true,
    });

    const accepted = await request(app).post(`/api/v1/public/referrals/${tokenFrom(sms.sent[0].body)}/accept`);
    expect(accepted.body.status).toBe('accepted');
    expect(accepted.body.acceptedAt).toBeTruthy();
  });

  it('reports a failed send as failed, and its link does not work', async () => {
    const partner = await addPartner();

    const response = await request(withSms(fakeSms({ fail: true })))
      .post(`/api/v1/forms/${formId}/referrals/test`)
      .set('authorization', `Bearer ${token}`)
      .send({ partnerIds: [partner.id], learner });

    expect(response.body.results[0].status).toBe('failed');

    const [row] = app.locals.db.select().from(referrals).all();
    expect(row.status).toBe('failed');
    expect(row.errorCode).toBe('provider_refused');
  });

  it('only sends to this partner’s own active referral partners', async () => {
    const removed = await addPartner();
    await authed('delete', `/api/v1/organisation/referral-partners/${removed.id}`);

    const response = await request(withSms(fakeSms()))
      .post(`/api/v1/forms/${formId}/referrals/test`)
      .set('authorization', `Bearer ${token}`)
      .send({ partnerIds: [removed.id], learner });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('unknown_referral_partner');
  });

  it('gives the published form the referral partners’ names, never their contact details', async () => {
    await addPartner();
    await publish();

    const response = await request(app)
      .get(`/api/v1/public/forms/${formId}`)
      .set('x-public-key', seeded.publicKey);

    expect(response.body.referralPartners).toEqual([{ id: expect.any(String), name: details.name }]);
    expect(JSON.stringify(response.body)).not.toContain('bole.example');
    expect(JSON.stringify(response.body)).not.toContain('911 234');
  });

  it('lets the published form send, with a limit on how often', async () => {
    const partner = await addPartner();
    await publish();
    const sms = fakeSms();
    const limited = withSms(sms, { rateLimiter: createRateLimiter({ limit: 1 }) });

    const send = () =>
      request(limited)
        .post(`/api/v1/public/forms/${formId}/referrals`)
        .set('x-public-key', seeded.publicKey)
        .send({ partnerIds: [partner.id], learner, language: 'am' });

    const first = await send();
    expect(first.status).toBe(200);
    expect(first.body.results[0].status).toBe('sent');
    expect(sms.sent[0].body).not.toContain('[TEST]');
    expect(sms.sent[0].body).toContain('Abebe Kebede');
    expect(sms.sent[0].body).toContain('ለመቀጠል');

    const second = await send();
    expect(second.status).toBe(429);
  });

  it('needs the public key to send from a published form', async () => {
    const partner = await addPartner();
    await publish();

    const response = await request(withSms(fakeSms()))
      .post(`/api/v1/public/forms/${formId}/referrals`)
      .send({ partnerIds: [partner.id], learner });

    expect(response.status).toBe(401);
  });

  it('says a link has expired rather than showing it', async () => {
    const partner = await addPartner();
    const sms = fakeSms();

    await request(withSms(sms))
      .post(`/api/v1/forms/${formId}/referrals/test`)
      .set('authorization', `Bearer ${token}`)
      .send({ partnerIds: [partner.id], learner });

    app.locals.db.update(referrals).set({ expiresAt: '2000-01-01T00:00:00.000Z' }).run();

    const response = await request(app).get(`/api/v1/public/referrals/${tokenFrom(sms.sent[0].body)}`);
    expect(response.status).toBe(410);
  });

  it('does not recognise a made-up link', async () => {
    const response = await request(app).get('/api/v1/public/referrals/abcdefghijklmnopqrstuvwxyz012345');

    expect(response.status).toBe(404);
  });
});
