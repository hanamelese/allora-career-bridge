import { createAfroMessage } from './providers/afromessage.js';

/**
 * Sending SMS.
 *
 * The rest of the API talks to one small interface:
 *
 *   sender.send({ to, body }) -> Promise<{ providerMessageId }>
 *
 * It resolves only once the provider has accepted the message, and throws
 * otherwise. That is what lets the API say "sent" honestly.
 *
 * With `SMS_PROVIDER` unset, `createSmsSender` returns null and every send
 * is refused with `sms_not_configured` - the API never pretends a message
 * went out.
 *
 * Providers:
 *   afromessage   AfroMessage, Ethiopia (see providers/afromessage.js)
 *
 * To add one: write `providers/<name>.js` exporting a function
 * `(env) -> { name, send({ to, body }) }`, register it in PROVIDERS, and
 * put its credentials in API/.env. Credentials stay on the server; the
 * browser never sees them or any phone number.
 */

const PROVIDERS = {
  afromessage: (env) => createAfroMessage(env),
};

export function createSmsSender(env = process.env) {
  const name = env.SMS_PROVIDER?.trim().toLowerCase();

  if (!name) return null;

  const create = PROVIDERS[name];

  if (!create) {
    throw new Error(
      `SMS_PROVIDER is set to "${name}", which is not a provider this API supports. ` +
        `Supported: ${Object.keys(PROVIDERS).join(', ')}. Unset it to run without SMS.`,
    );
  }

  return create(env);
}
