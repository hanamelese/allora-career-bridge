import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { eq } from 'drizzle-orm';
import { FORM_TEMPLATES, formConfigSchema } from '@onboarding/contracts';
import { createDatabase } from './db/client.js';
import { seedDatabase } from './db/seed.js';
import { partnerForms, referrals } from './db/schema.js';
import { createRateLimiter } from './referrals.js';
import { ensurePartnerForms, upgradeStoredDrafts } from './db/upgrades.js';
import { createApp } from './app.js';
import { verifyDeliveryToken } from './delivery.js';

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
      'account',
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
        field.key === 'identityRoute' ? { ...field, enabled: false } : field,
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

    /* The name and phone travel in the message only; nothing keeps them. */
    const [row] = app.locals.db.select().from(referrals).all();
    expect(row).toMatchObject({ learnerName: null, learnerPhone: null, status: 'sent' });

    const link = await request(app).get(`/api/v1/public/referrals/${tokenFrom(sms.sent[0].body)}`);
    expect(link.status).toBe(200);
    expect(link.body).toMatchObject({
      learnerName: null,
      learnerPhone: null,
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

describe('partner sign-up', () => {
  const details = {
    organisationName: 'Hope NGO',
    email: 'Staff@Hope.example',
    password: 'a-long-enough-password',
  };

  it('creates the organisation, signs it in, and gives it every form', async () => {
    const response = await request(app).post('/api/v1/auth/signup').send(details);

    expect(response.status).toBe(201);
    expect(response.body.partner.name).toBe('Hope NGO');
    expect(response.body.user.email).toBe('staff@hope.example');

    const forms = await request(app)
      .get('/api/v1/forms')
      .set('authorization', `Bearer ${response.body.token}`);

    expect(forms.body.map((form) => form.type).sort()).toEqual([
      'account',
      'employer',
      'jobApplication',
      'signup',
    ]);
  });

  it('can sign in afterwards with the same details', async () => {
    await request(app).post('/api/v1/auth/signup').send(details);
    const response = await signIn('staff@hope.example', details.password);

    expect(response.status).toBe(200);
    expect(response.body.partner.name).toBe('Hope NGO');
  });

  it('keeps a new organisation apart from every other', async () => {
    const created = await request(app).post('/api/v1/auth/signup').send(details);
    const theirs = await request(app)
      .get('/api/v1/forms')
      .set('authorization', `Bearer ${created.body.token}`);
    const ours = await authed('get', '/api/v1/forms');

    const theirIds = new Set(theirs.body.map((form) => form.formId ?? form.id));
    for (const form of ours.body) expect(theirIds.has(form.formId ?? form.id)).toBe(false);
  });

  it('refuses an email address already in use', async () => {
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...details, email: 'partner@alx.example' });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('email_taken');
  });

  it('says which details need fixing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send({ organisationName: '', email: 'nope', password: 'short' });

    expect(response.status).toBe(422);
    expect(response.body.issues.map((issue) => issue.path).sort()).toEqual([
      'email',
      'organisationName',
      'password',
    ]);
  });

  it('limits how many accounts one address can create', async () => {
    const { db } = app.locals;
    const limited = createApp(db, { signupLimiter: createRateLimiter({ limit: 1, windowMs: 60_000 }) });

    const first = await request(limited).post('/api/v1/auth/signup').send(details);
    const second = await request(limited)
      .post('/api/v1/auth/signup')
      .send({ ...details, email: 'other@hope.example' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(429);
  });
});

describe('upgrading existing data', () => {
  it('gives an existing partner the Sign up / Sign in form once', () => {
    const { db } = app.locals;
    db.delete(partnerForms)
      .where(eq(partnerForms.type, 'account'))
      .run();

    expect(ensurePartnerForms(db).created).toBe(1);
    expect(ensurePartnerForms(db).created).toBe(0);

    const form = db.select().from(partnerForms).where(eq(partnerForms.type, 'account')).get();
    expect(form.draftConfig.account.mode).toBe('signUp');
    expect(form.draftConfig.formId).toBe(form.id);
  });

  it('moves the identity questions to the end of an older learner draft', () => {
    const { db } = app.locals;
    const template = FORM_TEMPLATES.signup;
    const identity = template.fields.filter((f) => ['identityRoute', 'documentId'].includes(f.key));
    const rest = template.fields.filter((f) => !['identityRoute', 'documentId'].includes(f.key));
    const oldOrder = [...rest.slice(0, 5), ...identity, ...rest.slice(5)];

    db.update(partnerForms)
      .set({ draftConfig: { ...template, formId, fields: oldOrder } })
      .where(eq(partnerForms.id, formId))
      .run();

    expect(upgradeStoredDrafts(db).upgraded).toBe(1);

    const after = db.select().from(partnerForms).where(eq(partnerForms.id, formId)).get();
    expect(after.draftConfig.fields.map((f) => f.key).slice(-4)).toEqual([
      'identityRoute',
      'documentId',
      'identityDocumentFile',
      'referral',
    ]);
  });

  it('drops the learner permission question and merges "refer me" into "I have no document"', () => {
    const { db } = app.locals;
    const template = FORM_TEMPLATES.signup;
    const consent = { key: 'consent', enabled: true, required: true, locked: true, visibility: 'public' };
    const older = {
      ...template,
      formId,
      identityRoutes: [...template.identityRoutes.filter((r) => r !== 'no_document'), 'partner_referral', 'no_document'],
      fields: [
        ...template.fields
          .filter((f) => !['identityRoute', 'documentId', 'identityDocumentFile', 'referral'].includes(f.key))
          .concat(consent),
        ...template.fields
          .filter((f) => ['identityRoute', 'documentId', 'identityDocumentFile', 'referral'].includes(f.key))
          .map((f) =>
            f.key === 'referral'
              ? { ...f, showIf: { field: 'identityRoute', in: ['no_document', 'partner_referral'] } }
              : f,
          ),
      ],
    };

    db.update(partnerForms).set({ draftConfig: older }).where(eq(partnerForms.id, formId)).run();

    expect(upgradeStoredDrafts(db).upgraded).toBe(1);
    expect(upgradeStoredDrafts(db).upgraded).toBe(0);

    const { draftConfig } = db.select().from(partnerForms).where(eq(partnerForms.id, formId)).get();
    expect(draftConfig.fields.map((f) => f.key)).not.toContain('consent');
    expect(draftConfig.identityRoutes).not.toContain('partner_referral');
    expect(draftConfig.fields.find((f) => f.key === 'referral').showIf.in).toEqual(['no_document']);
    expect(formConfigSchema.safeParse(draftConfig).success).toBe(true);
  });
});

describe('embedding on a partner’s website', () => {
  const SITE = 'https://jobs.example.org';
  const publicPath = () => `/api/v1/public/forms/${formId}?key=${seeded.publicKey}`;

  it('lets a partner list, add and remove the websites that may show their forms', async () => {
    const added = await authed('post', '/api/v1/organisation/allowed-origins').send({ origin: `${SITE}/apply/now` });
    expect(added.status).toBe(201);
    expect(added.body.origin).toBe(SITE);

    const again = await authed('post', '/api/v1/organisation/allowed-origins').send({ origin: SITE });
    expect(again.status).toBe(200);

    const list = await authed('get', '/api/v1/organisation/allowed-origins');
    expect(list.body.map((row) => row.origin)).toEqual([SITE]);

    const bad = await authed('post', '/api/v1/organisation/allowed-origins').send({ origin: 'http://jobs.example.org' });
    expect(bad.status).toBe(422);

    const removed = await authed('delete', `/api/v1/organisation/allowed-origins/${added.body.id}`);
    expect(removed.status).toBe(204);
  });

  it('refuses a website that is not on the list, and allows one that is', async () => {
    await authed('post', `/api/v1/forms/${formId}/publish`);

    const refused = await request(app).get(publicPath()).set('origin', SITE);
    expect(refused.status).toBe(403);
    expect(refused.body.error).toBe('origin_not_allowed');
    expect(refused.headers['access-control-allow-origin']).toBeUndefined();

    await authed('post', '/api/v1/organisation/allowed-origins').send({ origin: SITE });

    const allowed = await request(app).get(publicPath()).set('origin', SITE);
    expect(allowed.status).toBe(200);
    expect(allowed.headers['access-control-allow-origin']).toBe(SITE);
    expect(allowed.body.organisationName).toBe('ALX Ethiopia');

    const preflight = await request(app)
      .options(`/api/v1/public/forms/${formId}/referrals?key=${seeded.publicKey}`)
      .set('origin', SITE)
      .set('access-control-request-method', 'POST')
      .set('access-control-request-headers', 'content-type');
    expect(preflight.status).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe(SITE);
  });

  it('does not let one partner’s website use another partner’s key', async () => {
    await authed('post', `/api/v1/forms/${formId}/publish`);
    await authed('post', '/api/v1/organisation/allowed-origins').send({ origin: SITE });

    const other = await request(app)
      .post('/api/v1/auth/signup')
      .send({ organisationName: 'Other NGO', email: 'other@ngo.example', password: 'another long password' });
    await request(app)
      .post('/api/v1/organisation/allowed-origins')
      .set('authorization', `Bearer ${other.body.token}`)
      .send({ origin: 'https://other.example' });

    const response = await request(app).get(publicPath()).set('origin', 'https://other.example');
    expect(response.status).toBe(403);
  });

  it('serves the widget script to any site, or says it is not built', async () => {
    const response = await request(app).get('/widget/v1/onboarding-widget.js');

    if (response.status === 200) {
      expect(response.headers['content-type']).toMatch(/javascript/);
      expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    } else {
      expect(response.body.error).toBe('widget_not_built');
    }
  });
});

describe('delivering a submitted form to the organisation', () => {
  const SITE = 'https://jobs.example.org';
  const RECEIVER = 'https://forms.alx.example/receive';
  const askForDelivery = (body, { id = formId, key = seeded.publicKey, origin = SITE, server = app } = {}) =>
    request(server).post(`/api/v1/public/forms/${id}/delivery?key=${key}`).set('origin', origin).send(body);

  beforeEach(async () => {
    await authed('post', '/api/v1/organisation/allowed-origins').send({ origin: SITE });
  });

  it('starts with no delivery address, and only accepts https (or http on localhost)', async () => {
    expect((await authed('get', '/api/v1/organisation/delivery')).body).toEqual({ url: null, secret: null });

    for (const url of ['http://forms.example.org/x', 'ftp://example.org', 'https://user:pw@example.org/x', 'not a url']) {
      const response = await authed('put', '/api/v1/organisation/delivery').send({ url });
      expect(response.status).toBe(422);
    }

    expect((await authed('put', '/api/v1/organisation/delivery').send({ url: 'http://localhost:4000/submissions' })).status).toBe(200);
  });

  it('saves an address with a signing secret, keeps the secret on a new address, renews it on request, and stops', async () => {
    const saved = await authed('put', '/api/v1/organisation/delivery').send({ url: RECEIVER });
    expect(saved.status).toBe(200);
    expect(saved.body.url).toBe(RECEIVER);
    expect(saved.body.secret).toMatch(/^dsec_/);
    expect(saved.headers['cache-control']).toBe('no-store');

    const moved = await authed('put', '/api/v1/organisation/delivery').send({ url: `${RECEIVER}/v2` });
    expect(moved.body.secret).toBe(saved.body.secret);

    const renewed = await authed('post', '/api/v1/organisation/delivery/secret');
    expect(renewed.body.secret).toMatch(/^dsec_/);
    expect(renewed.body.secret).not.toBe(saved.body.secret);

    const stopped = await authed('put', '/api/v1/organisation/delivery').send({ url: null });
    expect(stopped.body).toEqual({ url: null, secret: null });
  });

  it('keeps each organisation’s delivery settings to itself', async () => {
    await authed('put', '/api/v1/organisation/delivery').send({ url: RECEIVER });

    const other = await request(app)
      .post('/api/v1/auth/signup')
      .send({ organisationName: 'Other NGO', email: 'other@ngo.example', password: 'another long password' });
    const theirs = await request(app).get('/api/v1/organisation/delivery').set('authorization', `Bearer ${other.body.token}`);

    expect(theirs.body).toEqual({ url: null, secret: null });
  });

  it('tells the form whether answers also go to a server, without giving the address', async () => {
    await authed('post', `/api/v1/forms/${formId}/publish`);
    const read = () =>
      request(app).get(`/api/v1/public/forms/${formId}?key=${seeded.publicKey}`).set('origin', SITE);

    expect((await read()).body.delivery).toBe(false);
    await authed('put', '/api/v1/organisation/delivery').send({ url: RECEIVER });
    const form = (await read()).body;
    expect(form.delivery).toBe(true);
    expect(JSON.stringify(form)).not.toContain(RECEIVER);
  });

  it('says plainly when no address is set up, so nothing is sent anywhere', async () => {
    await authed('post', `/api/v1/forms/${formId}/publish`);

    const response = await askForDelivery({ version: 1 });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('delivery_not_configured');
  });

  it('gives the address and a signed, short-lived token that holds no answers', async () => {
    const { body: settings } = await authed('put', '/api/v1/organisation/delivery').send({ url: RECEIVER });
    await authed('post', `/api/v1/forms/${formId}/publish`);

    const response = await askForDelivery({ version: 1 });
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(SITE);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.deliveryUrl).toBe(RECEIVER);

    const claims = verifyDeliveryToken(settings.secret, response.body.token);
    expect(claims).toMatchObject({ formId, version: 1, publicKey: seeded.publicKey });
    expect(Object.keys(claims).sort()).toEqual(['exp', 'formId', 'iat', 'nonce', 'publicKey', 'version']);
    expect(claims.exp - claims.iat).toBe(600);

    /* Wrong secret, a changed payload, or after it expires: refused. */
    expect(verifyDeliveryToken('dsec_someone_else', response.body.token)).toBeNull();
    const [v, payload, sig] = response.body.token.split('.');
    const forged = Buffer.from(JSON.stringify({ ...claims, version: 2 })).toString('base64url');
    expect(verifyDeliveryToken(settings.secret, `${v}.${forged}.${sig}`)).toBeNull();
    expect(verifyDeliveryToken(settings.secret, `${v}.${payload}.${sig}`, (claims.exp + 1) * 1000)).toBeNull();
  });

  it('never delivers a sign-in form, and refuses an unpublished form, an unknown version, a wrong key or another website', async () => {
    await authed('put', '/api/v1/organisation/delivery').send({ url: RECEIVER });
    expect((await askForDelivery({ version: 1 })).body.error).toBe('form_not_published');

    const accountId = seeded.formIds.account;
    await authed('post', `/api/v1/forms/${accountId}/publish`);
    const account = await askForDelivery({ version: 1 }, { id: accountId });
    expect(account.status).toBe(422);
    expect(account.body.error).toBe('not_delivered');

    await authed('post', `/api/v1/forms/${formId}/publish`);
    expect((await askForDelivery({ version: 7 })).status).toBe(404);
    expect((await askForDelivery({ version: 1 }, { key: 'pk_live_nope' })).status).toBe(403);
    expect((await askForDelivery({ version: 1 }, { origin: 'https://elsewhere.example' })).status).toBe(403);
    expect((await askForDelivery({ version: 1, answers: { name: 'Hana' } })).status).toBe(422);
  });

  it('no longer accepts or lists learners’ answers', async () => {
    await authed('post', `/api/v1/forms/${formId}/publish`);

    const store = await request(app)
      .post(`/api/v1/public/forms/${formId}/submissions?key=${seeded.publicKey}`)
      .set('origin', SITE)
      .send({ version: 1, answers: { name: 'Hana Tesfaye' } });
    expect(store.status).toBe(404);
    expect((await authed('get', `/api/v1/forms/${formId}/submissions`)).status).toBe(404);
  });

  it('limits how many tokens one place can ask for', async () => {
    await authed('put', '/api/v1/organisation/delivery').send({ url: RECEIVER });
    await authed('post', `/api/v1/forms/${formId}/publish`);
    const limited = createApp(app.locals.db, { deliveryLimiter: createRateLimiter({ limit: 1 }) });

    expect((await askForDelivery({ version: 1 }, { server: limited })).status).toBe(200);
    expect((await askForDelivery({ version: 1 }, { server: limited })).status).toBe(429);
  });
});
