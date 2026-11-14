/**
 * Building the embed tag, from a published version only.
 *
 * The widget script is served by this project's own API (step-free: no
 * CDN), under a versioned path, and works out where the API is from its
 * own address - so the tag needs no API address of its own.
 */

export const WIDGET_VERSION = 'v1';

/* Where the widget and the public API are reached from a partner's site.
   In development the dashboard's own origin proxies /api and /widget to
   the API; in production set VITE_PUBLIC_API_ORIGIN to the API's public
   address if it is not the dashboard's. */
export function publicApiOrigin() {
  const configured = import.meta.env.VITE_PUBLIC_API_ORIGIN;
  return (configured || window.location.origin).replace(/\/+$/, '');
}

export function widgetUrl() {
  return `${publicApiOrigin()}/widget/${WIDGET_VERSION}/onboarding-widget.js`;
}

/** The latest published version, or null if there is none. */
export function latestPublished(form) {
  if (!form.currentVersion) return null;
  return (form.versions ?? []).find((version) => version.version === form.currentVersion) ?? null;
}

/* The draft carries `version: 'draft'` and a published copy its number;
   everything else is compared as it is. */
function comparable(config) {
  if (!config) return null;
  const { version: _version, ...rest } = config;
  return JSON.stringify(rest);
}

/** Has the saved draft changed since the latest version was published? */
export function draftDiffersFromPublished(form) {
  const published = latestPublished(form);
  if (!published) return false;
  return comparable(form.draftConfig) !== comparable(published.config);
}

export function buildEmbedTag({ formId, publicKey, version, language }) {
  return [
    `<script src="${widgetUrl()}" async></script>`,
    '',
    '<onboarding-form',
    `  form-id="${formId}"`,
    `  public-key="${publicKey}"`,
    `  form-version="${version}"`,
    `  lang="${language}">`,
    '</onboarding-form>',
  ].join('\n');
}
