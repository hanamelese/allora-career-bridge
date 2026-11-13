import { localAdapter } from './localAdapter.js';

/**
 * The one seam between the dashboard and its data.
 *
 * Every component talks to these five functions and nothing else, so when
 * Phase 4 implements the real `/api/v1` endpoints only the adapter behind
 * this module changes.
 *
 * The method shapes match the endpoints in the system design:
 *   listForms()              GET    /api/v1/forms
 *   getForm(id)              GET    /api/v1/forms/:id
 *   saveDraft(id, config)    PUT    /api/v1/forms/:id/draft
 *   publish(id)              POST   /api/v1/forms/:id/publish
 *   listVersions(id)         GET    /api/v1/forms/:id/versions
 */

const adapter = localAdapter;

/** True while the dashboard is running against the Phase 1 stand-in. */
export const USING_LOCAL_ADAPTER = adapter === localAdapter;

export function listForms() {
  return adapter.listForms();
}

export function getForm(formId) {
  return adapter.getForm(formId);
}

export function saveDraft(formId, config) {
  return adapter.saveDraft(formId, config);
}

export function publish(formId) {
  return adapter.publish(formId);
}

export function listVersions(formId) {
  return adapter.listVersions(formId);
}
