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
          `${failed} Check your connection. If you run this website, make sure its address is on your list of allowed websites in the Partner Dashboard.`,
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
    getForm(formId, version) {
      const query = version ? `?version=${encodeURIComponent(version)}` : '';
      return call(`/forms/${encodeURIComponent(formId)}${query}`);
    },

    /* The answers that may be stored - see `toStorableSubmission`. */
    sendSubmission(formId, submission) {
      return call(`/forms/${encodeURIComponent(formId)}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      }, 'The answers could not be sent.');
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
