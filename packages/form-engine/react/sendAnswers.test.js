import { describe, it, expect, vi } from 'vitest';
import { sendAnswers } from './sendAnswers.js';

function track() {
  const calls = [];
  return {
    calls,
    handlers: {
      onSending: () => calls.push('sending'),
      onSent: () => calls.push('sent'),
      onFailed: () => calls.push('failed'),
    },
  };
}

describe('handing the answers to the host', () => {
  it('is sent at once when the host returns nothing, as the preview does', async () => {
    const { calls, handlers } = track();
    const onSubmit = vi.fn();

    expect(await sendAnswers(onSubmit, { name: 'Hana' }, handlers)).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Hana' });
    expect(calls).toEqual(['sent']);
  });

  it('says sent only once the host has stored the answers', async () => {
    const { calls, handlers } = track();
    let resolve;
    const pending = sendAnswers(() => new Promise((done) => (resolve = done)), {}, handlers);

    expect(calls).toEqual(['sending']);
    resolve();
    expect(await pending).toBe(true);
    expect(calls).toEqual(['sending', 'sent']);
  });

  it('reports a failure without saying sent, so the learner can try again', async () => {
    const { calls, handlers } = track();

    expect(await sendAnswers(() => Promise.reject(new Error('offline')), {}, handlers)).toBe(false);
    expect(calls).toEqual(['sending', 'failed']);

    expect(await sendAnswers(() => Promise.resolve(), {}, handlers)).toBe(true);
    expect(calls).toEqual(['sending', 'failed', 'sending', 'sent']);
  });

  it('treats a host that throws as a failure', async () => {
    const { calls, handlers } = track();

    expect(await sendAnswers(() => { throw new Error('bug'); }, {}, handlers)).toBe(false);
    expect(calls).toEqual(['failed']);
  });
});
