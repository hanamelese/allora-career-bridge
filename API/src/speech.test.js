import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createDatabase } from './db/client.js';
import { seedDatabase } from './db/seed.js';
import { createRateLimiter } from './referrals.js';
import { createApp } from './app.js';
import { cleanSpeechText, createSpeech, MAX_SPEECH_CHARS } from './speech.js';

process.env.NODE_ENV = 'test';

const PASSWORD = 'onboarding-demo';
const MP3 = Buffer.from('ID3-fake-mp3');
const quiet = { warn() {} };

describe('the speech service', () => {
  it('uses the first provider that works, and caches by language and text', async () => {
    const calls = [];
    const failing = async (text, lang) => {
      calls.push(['edge', text, lang]);
      throw new Error('edge down');
    };
    const working = async (text, lang) => {
      calls.push(['google', text, lang]);
      return MP3;
    };
    const speak = createSpeech({ providers: [failing, working], log: quiet });

    expect(await speak('  Full   name.  ', 'am')).toBe(MP3);
    expect(calls).toEqual([
      ['edge', 'Full name.', 'am'],
      ['google', 'Full name.', 'am'],
    ]);

    await speak('Full name.', 'am');
    expect(calls).toHaveLength(2);

    await speak('Full name.', 'en');
    expect(calls).toHaveLength(4);
  });

  it('never caches a learner’s answer (cache: false)', async () => {
    let calls = 0;
    const speak = createSpeech({
      providers: [
        async () => {
          calls += 1;
          return MP3;
        },
      ],
      log: quiet,
    });

    await speak('Selam Bekele', 'en', { cache: false });
    await speak('Selam Bekele', 'en', { cache: false });
    expect(calls).toBe(2);

    // And it was not left behind for an ordinary request either.
    await speak('Selam Bekele', 'en');
    expect(calls).toBe(3);
  });

  it('rejects when every provider fails', async () => {
    const fail = (message) => async () => {
      throw new Error(message);
    };
    const speak = createSpeech({ providers: [fail('edge down'), fail('google down')], log: quiet });
    await expect(speak('Hello', 'en')).rejects.toThrow('speech_unavailable');
  });

  it('tidies and limits the text', () => {
    expect(cleanSpeechText(' a\n\n b ')).toBe('a b');
    expect(cleanSpeechText('x'.repeat(900))).toHaveLength(MAX_SPEECH_CHARS);
  });
});

describe('speech routes', () => {
  let db;
  let seeded;
  let token;
  let spoken;

  const app = (options = {}) =>
    createApp(db, {
      speech: async (text, lang) => {
        spoken.push([text, lang]);
        return MP3;
      },
      ...options,
    });

  beforeEach(async () => {
    ({ db } = createDatabase(':memory:'));
    seeded = seedDatabase(db, { partnerName: 'ALX Ethiopia', email: 'partner@alx.example', password: PASSWORD });
    spoken = [];
    token = (await request(app()).post('/api/v1/auth/login').send({ email: 'partner@alx.example', password: PASSWORD })).body.token;
    await request(app())
      .post(`/api/v1/forms/${seeded.formIds.signup}/publish`)
      .set('authorization', `Bearer ${token}`);
  });

  const publicSpeech = (server, body, formId = seeded.formIds.signup, key = seeded.publicKey) =>
    request(server).post(`/api/v1/public/forms/${formId}/speech?key=${key}`).send(body);

  it('a published form’s page gets MP3 for its text', async () => {
    const response = await publicSpeech(app(), { text: 'ሙሉ ስም', lang: 'am' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/audio\/mpeg/);
    expect(Buffer.from(response.body)).toEqual(MP3);
    expect(spoken).toEqual([['ሙሉ ስም', 'am']]);
  });

  it('defaults to English and refuses empty text', async () => {
    await publicSpeech(app(), { text: 'Full name' });
    expect(spoken).toEqual([['Full name', 'en']]);

    const empty = await publicSpeech(app(), { text: '   ' });
    expect(empty.status).toBe(422);

    const badLanguage = await publicSpeech(app(), { text: 'Hi', lang: 'fr' });
    expect(badLanguage.status).toBe(422);
  });

  it('passes a learner’s answer on uncached, and the browser is told not to keep it', async () => {
    const options = [];
    const server = createApp(db, {
      speech: async (text, lang, opts) => {
        options.push([text, lang, opts]);
        return MP3;
      },
    });

    const answer = await publicSpeech(server, { text: 'ሰላም በቀለ', lang: 'am', private: true });
    expect(answer.status).toBe(200);
    expect(answer.headers['cache-control']).toBe('no-store');

    const question = await publicSpeech(server, { text: 'Full name' });
    expect(question.headers['cache-control']).toMatch(/max-age/);

    expect(options).toEqual([
      ['ሰላም በቀለ', 'am', { cache: false }],
      ['Full name', 'en', { cache: true }],
    ]);
  });

  it('needs a valid public key and a published form of that partner', async () => {
    expect((await publicSpeech(app(), { text: 'Hi' }, seeded.formIds.signup, 'pk_live_nope')).status).toBe(401);
    expect((await publicSpeech(app(), { text: 'Hi' }, 'frm_missing')).status).toBe(404);
    expect((await publicSpeech(app(), { text: 'Hi' }, seeded.formIds.jobApplication)).status).toBe(404);
    expect(spoken).toEqual([]);
  });

  it('refuses a website that is not on the organisation’s list', async () => {
    const response = await publicSpeech(app(), { text: 'Hi' }).set('origin', 'https://elsewhere.example');
    expect(response.status).toBe(403);
    expect(spoken).toEqual([]);
  });

  it('limits how much is read from one place', async () => {
    const server = app({ speechLimiter: createRateLimiter({ limit: 1, windowMs: 60_000 }) });
    expect((await publicSpeech(server, { text: 'One' })).status).toBe(200);
    const second = await publicSpeech(server, { text: 'Two' });
    expect(second.status).toBe(429);
    expect(second.body.error).toBe('rate_limited');
  });

  it('says so when no voice could be made (the form then uses the browser’s voice)', async () => {
    const server = createApp(db, { speech: async () => { throw new Error('speech_unavailable'); } });
    const response = await publicSpeech(server, { text: 'Hi' });
    expect(response.status).toBe(502);
    expect(response.body.error).toBe('speech_unavailable');
  });

  it('the dashboard route is for signed-in partners only', async () => {
    expect((await request(app()).post('/api/v1/speech').send({ text: 'Hi' })).status).toBe(401);

    const response = await request(app())
      .post('/api/v1/speech')
      .set('authorization', `Bearer ${token}`)
      .send({ text: 'Preview question', lang: 'en' });
    expect(response.status).toBe(200);
    expect(spoken).toEqual([['Preview question', 'en']]);
  });
});
