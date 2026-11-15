/**
 * The widget's calls to the public form API.
 *
 * The public key travels in the address (`?key=`), so the browser's CORS
 * preflight carries it too and the API can check the partner's own list
 * of allowed websites.
 */
export function createPublicApi({ scriptSrc, apiOrigin, publicKey }) {
  const origin = (apiOrigin || new URL(scriptSrc, window.location.href).origin).replace(/\/+$/, '');
  const base = `${origin}/api/v1/public`;

  async function call(path, options = {}, failed = 'The form could not be loaded.') {
    const url = `${base}${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(publicKey)}`;
    let response;

    try {
      response = await fetch(url, { ...options, credentials: 'omit' });
    } catch {
      /* A refused CORS check or no network: the browser says no more. */
      throw Object.assign(
        new Error(
          `${failed} Check your connection. If you run this website, make sure its address is on your list of allowed websites in Allora Accessibility Bridge.`,
        ),
        { code: 'network_error' },
      );
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw Object.assign(new Error(body.message ?? failed), {
        code: body.error ?? 'request_failed',
        status: response.status,
        issues: body.issues,
      });
    }

    return body;
  }

  return {
    origin,

    getForm(formId, version) {
      const query = version ? `?version=${encodeURIComponent(version)}` : '';
      return call(`/forms/${encodeURIComponent(formId)}${query}`);
    },

    /**
     * Sends the answers to the organisation's own server.
     *
     * This service is asked only where to send them and for a short-lived
     * token (see API/src/delivery.js); the answers go from this browser
     * straight to the organisation's delivery address. Resolves with the
     * receiver's `receiptId`, if it gave one.
     */
    async deliver(formId, { version, type, language, answers }) {
      const failed = 'Your answers could not be sent.';
      const { deliveryUrl, token } = await call(
        `/forms/${encodeURIComponent(formId)}/delivery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version }),
        },
        failed,
      );

      let response;
      try {
        response = await fetch(deliveryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit',
          body: JSON.stringify({
            token,
            formId,
            version,
            type,
            ...(language ? { language } : {}),
            submittedAt: new Date().toISOString(),
            answers,
          }),
        });
      } catch {
        throw Object.assign(new Error(`${failed} The organisation's server could not be reached.`), {
          code: 'delivery_unreachable',
        });
      }

      if (!response.ok) {
        throw Object.assign(new Error(`${failed} The organisation's server did not accept them.`), {
          code: 'delivery_rejected',
          status: response.status,
        });
      }

      const receipt = await response.json().catch(() => ({}));
      return { receiptId: typeof receipt?.receiptId === 'string' ? receipt.receiptId.slice(0, 200) : null };
    },

    sendReferral(formId, request) {
      return call(`/forms/${encodeURIComponent(formId)}/referrals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    },
  };
}
