/**
 * AfroMessage (https://afromessage.com), an Ethiopian SMS gateway.
 *
 * Settings, in API/.env (never in the browser):
 *   SMS_PROVIDER=afromessage
 *   AFROMESSAGE_API_KEY   the account's API token (sent as a Bearer token)
 *   IDENTIFIER_KEY        optional: the identifier ("from") to send with
 *   AFROMESSAGE_SENDER    optional: an approved sender name ("sender")
 *
 * `send({ to, body })` resolves with `{ providerMessageId }` only once
 * AfroMessage has accepted the message, and throws otherwise (with a
 * `code`), so a referral is marked "sent" only when it really was. The
 * text itself is built by the API (buildReferralMessage), with the
 * organisation's name and the referral's own link. Nothing here logs the
 * number or the message.
 *
 * First written by Hana Melese on the dev-3 branch; reshaped here to the
 * API's sender interface.
 */

export const AFROMESSAGE_SEND_URL = 'https://api.afromessage.com/api/send';

function failure(code, message, extra = {}) {
  return Object.assign(new Error(message), { code, ...extra });
}

export function createAfroMessage(env = process.env, { fetchImpl = globalThis.fetch, timeoutMs = 15_000 } = {}) {
  const apiKey = env.AFROMESSAGE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('SMS_PROVIDER is "afromessage" but AFROMESSAGE_API_KEY is not set in API/.env.');
  }
  const identifier = env.IDENTIFIER_KEY?.trim() || null;
  const sender = env.AFROMESSAGE_SENDER?.trim() || null;

  return {
    name: 'afromessage',

    async send({ to, body }) {
      if (!to) throw failure('recipient_missing', 'No phone number to send to.');

      let response;
      try {
        response = await fetchImpl(AFROMESSAGE_SEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            to,
            message: body,
            ...(identifier ? { from: identifier } : {}),
            ...(sender ? { sender } : {}),
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        throw failure(error?.name === 'TimeoutError' ? 'afromessage_timeout' : 'afromessage_unreachable', 'AfroMessage could not be reached.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.acknowledge !== 'success') {
        throw failure(
          `afromessage_${response.ok ? 'rejected' : response.status}`,
          'AfroMessage did not accept the message.',
        );
      }

      return { providerMessageId: data.response?.message_id ?? null };
    },
  };
}
