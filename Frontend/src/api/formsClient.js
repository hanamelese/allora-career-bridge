import { apiFetch } from './http.js';

/**
 * The one seam between the dashboard and its data.
 *
 * These call the API described in the system design:
 *   listForms()              GET    /api/v1/forms
 *   getForm(id)              GET    /api/v1/forms/:id
 *   saveDraft(id, config)    PUT    /api/v1/forms/:id/draft
 *   publish(id)              POST   /api/v1/forms/:id/publish
 *   listVersions(id)         GET    /api/v1/forms/:id/versions
 */

export function listForms() {
  return apiFetch('/forms');
}

export function getForm(formId) {
  return apiFetch(`/forms/${encodeURIComponent(formId)}`);
}

export function saveDraft(formId, config) {
  return apiFetch(`/forms/${encodeURIComponent(formId)}/draft`, {
    method: 'PUT',
    body: config,
  });
}

export function publish(formId) {
  return apiFetch(`/forms/${encodeURIComponent(formId)}/publish`, { method: 'POST' });
}

export function listVersions(formId) {
  return apiFetch(`/forms/${encodeURIComponent(formId)}/versions`);
}

/**
 * Find a form by its type.
 *
 * Form ids are issued by the server and differ between partners, so the
 * dashboard looks a form up by the type its URL names rather than assuming
 * an id. The list is small - four forms - so this is one extra request.
 */
export async function getFormByType(type) {
  const forms = await listForms();
  const match = forms.find((form) => form.type === type);

  if (!match) {
    const error = new Error('Your organisation does not have a form of this kind.');
    error.code = 'form_not_found';
    throw error;
  }

  return getForm(match.formId);
}
