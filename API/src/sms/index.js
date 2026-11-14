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
 * No provider is wired up yet. With `SMS_PROVIDER` unset, `createSmsSender`
 * returns null and every send is refused with `sms_not_configured` - the
 * API never pretends a message went out.
 *
 * To add a provider: write `providers/<name>.js` exporting
 * `create(env) -> { name, send({ to, body }) }`, register it in PROVIDERS,
 * and put its credentials in API/.env. Credentials stay on the server; the
 * browser never sees them or any phone number.
 */

const PROVIDERS = {
  // africastalking: (env) => createAfricasTalking(env),
  // twilio: (env) => createTwilio(env),
};

export function createSmsSender(env = process.env) {
  const name = env.SMS_PROVIDER?.trim();

  if (!name) return null;

  const create = PROVIDERS[name];

  if (!create) {
    throw new Error(
      `SMS_PROVIDER is set to "${name}", which is not a provider this API supports. ` +
        `Supported: ${Object.keys(PROVIDERS).join(', ') || 'none yet'}. Unset it to run without SMS.`,
    );
  }

  return create(env);
}
