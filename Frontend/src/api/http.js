import { translate } from '../i18n/index.js';

/* The dashboard language, as <html lang> shows it (see display/). */
const currentLanguage = () => (document.documentElement.lang === 'am' ? 'am' : 'en');

/**
 * The HTTP layer.
 *
 * Holds the signed-in token and turns a failed response into an error
 * carrying a code and a message that can be shown to a partner as-is.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

/** Called when the server says the session has ended. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(status, code, message, issues) {
    super(message);
    this.status = status;
    this.code = code;
    this.issues = issues ?? [];
  }
}

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};

  if (body !== undefined) headers['content-type'] = 'application/json';
  if (auth && authToken) headers.authorization = `Bearer ${authToken}`;

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      'offline',
      translate(currentLanguage(), 'common.offline'),
    );
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && auth) {
      onUnauthorized?.();
    }

    throw new ApiError(
      response.status,
      payload.error ?? 'request_failed',
      payload.message ?? translate(currentLanguage(), 'common.requestFailed'),
      payload.issues,
    );
  }

  return payload;
}

/**
 * Read-aloud audio, so the preview speaks with the voices learners hear
 * (including Amharic): the form's text, and answers read back (`private`:
 * never cached). Rejects on any failure; the form then uses the browser's
 * own voice.
 */
export async function fetchSpeech(text, language, { private: isPrivate = false } = {}) {
  const response = await fetch(`${BASE_URL}/speech`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ text, lang: language === 'am' ? 'am' : 'en', private: isPrivate }),
  });
  if (!response.ok) throw new ApiError(response.status, 'speech_unavailable', 'Read aloud is not available.');
  return response.blob();
}
