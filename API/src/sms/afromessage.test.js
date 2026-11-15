import { describe, expect, it } from 'vitest';
import { AFROMESSAGE_SEND_URL, createAfroMessage } from './providers/afromessage.js';
import { createSmsSender } from './index.js';

const ENV = { SMS_PROVIDER: 'afromessage', AFROMESSAGE_API_KEY: 'test-token', IDENTIFIER_KEY: 'id-123' };

/* A stand-in for AfroMessage: records the request and answers as told. */
function fakeFetch(reply) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    if (reply instanceof Error) throw reply;
    return new Response(JSON.stringify(reply.body ?? {}), { status: reply.status ?? 200 });
  };
  return { calls, fetchImpl };
}

describe('AfroMessage SMS provider', () => {
  it('sends the API’s own message to the number, with the token and identifier, and returns the message id', async () => {
    const { calls, fetchImpl } = fakeFetch({ body: { acknowledge: 'success', response: { code: '202', message_id: 'am-42' } } });
    const sms = createAfroMessage(ENV, { fetchImpl });

    const result = await sms.send({ to: '+251911234567', body: 'ALX Ethiopia: a learner asks for your help. https://bridge.example/referrals/abc' });

    expect(result).toEqual({ providerMessageId: 'am-42' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(AFROMESSAGE_SEND_URL);
    expect(calls[0].options.headers.Authorization).toBe('Bearer test-token');
    expect(calls[0].body).toEqual({
      to: '+251911234567',
      message: 'ALX Ethiopia: a learner asks for your help. https://bridge.example/referrals/abc',
      from: 'id-123',
    });
  });

  it('adds an approved sender name only when one is set', async () => {
    const { calls, fetchImpl } = fakeFetch({ body: { acknowledge: 'success', response: {} } });
    await createAfroMessage({ ...ENV, IDENTIFIER_KEY: '', AFROMESSAGE_SENDER: 'ALX' }, { fetchImpl }).send({ to: '0911', body: 'x' });
    expect(calls[0].body).toEqual({ to: '0911', message: 'x', sender: 'ALX' });
  });

  it('throws (so nothing is marked sent) when AfroMessage refuses the message', async () => {
    const { fetchImpl } = fakeFetch({ body: { acknowledge: 'error', response: { errors: ['bad number'] } } });
    await expect(createAfroMessage(ENV, { fetchImpl }).send({ to: '1', body: 'x' })).rejects.toMatchObject({ code: 'afromessage_rejected' });
  });

  it('throws on an HTTP error and when AfroMessage cannot be reached', async () => {
    const http = fakeFetch({ status: 401, body: { acknowledge: 'error' } });
    await expect(createAfroMessage(ENV, { fetchImpl: http.fetchImpl }).send({ to: '1', body: 'x' })).rejects.toMatchObject({ code: 'afromessage_401' });

    const down = fakeFetch(new TypeError('fetch failed'));
    await expect(createAfroMessage(ENV, { fetchImpl: down.fetchImpl }).send({ to: '1', body: 'x' })).rejects.toMatchObject({ code: 'afromessage_unreachable' });
  });

  it('refuses to start without an API key', () => {
    expect(() => createAfroMessage({ SMS_PROVIDER: 'afromessage' })).toThrow(/AFROMESSAGE_API_KEY/);
  });
});

describe('choosing the SMS provider', () => {
  it('none when SMS_PROVIDER is unset; AfroMessage when it says so (any case)', () => {
    expect(createSmsSender({})).toBeNull();
    expect(createSmsSender({ ...ENV, SMS_PROVIDER: 'AfroMessage' }).name).toBe('afromessage');
  });

  it('a provider it does not know is an error at start-up, not a silent no-op', () => {
    expect(() => createSmsSender({ SMS_PROVIDER: 'pigeon' })).toThrow(/Supported: afromessage/);
  });
});
