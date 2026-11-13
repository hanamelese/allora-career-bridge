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
      'The dashboard could not reach the server. Check that the API is running.',
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
      payload.message ?? 'The request could not be completed.',
      payload.issues,
    );
  }

  return payload;
}
