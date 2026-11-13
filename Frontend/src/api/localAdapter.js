import { FORM_TYPES } from '../formTypes.js';
import { SEED_CONFIGS } from './seedConfigs.js';

/**
 * PHASE 1 STAND-IN - not the real backend.
 *
 * `API/src/app.js` is currently empty: the Express + Drizzle + SQLite
 * server is declared but unwritten. Rather than invent endpoints, this
 * adapter answers the same calls locally so the dashboard can be built
 * and reviewed. Phase 4 implements the real API and this file is deleted;
 * nothing outside `formsClient.js` imports it, so no component changes.
 *
 * It deliberately keeps the awkward parts of a network: a short delay, so
 * loading states are real rather than theoretical, and failures surfaced
 * as the same error shape the real client will throw.
 */

const STORAGE_KEY = 'partner-dashboard.phase1.forms';
const LATENCY_MS = 320;

function delay(ms = LATENCY_MS) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildInitialForms() {
  return FORM_TYPES.map((formType) => ({
    formId: SEED_CONFIGS[formType.id].formId,
    type: formType.id,
    status: 'draft',
    currentVersion: null,
    updatedAt: null,
    publishedAt: null,
    draftConfig: SEED_CONFIGS[formType.id],
    versions: [],
  }));
}

/* localStorage can be unavailable or blocked, and a read can throw. The
   dashboard must still work when it does, so every access is guarded and
   falls back to the seeded defaults. */
function readStore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialForms();

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : buildInitialForms();
  } catch {
    return buildInitialForms();
  }
}

function writeStore(forms) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
  } catch {
    /* Persistence is a convenience here, never a requirement. */
  }
}

function findForm(forms, formId) {
  const form = forms.find((candidate) => candidate.formId === formId);

  if (!form) {
    const error = new Error(`No form exists with the id "${formId}".`);
    error.code = 'form_not_found';
    throw error;
  }

  return form;
}

export const localAdapter = {
  async listForms() {
    await delay();
    return readStore().map(({ versions, draftConfig, ...summary }) => ({
      ...summary,
      fieldCount: draftConfig.fields.filter((item) => item.enabled).length,
      versionCount: versions.length,
    }));
  },

  async getForm(formId) {
    await delay();
    return structuredClone(findForm(readStore(), formId));
  },

  async saveDraft(formId, config) {
    await delay();
    const forms = readStore();
    const form = findForm(forms, formId);

    form.draftConfig = config;
    form.updatedAt = new Date().toISOString();
    writeStore(forms);

    return structuredClone(form);
  },

  async publish(formId) {
    await delay();
    const forms = readStore();
    const form = findForm(forms, formId);

    const version = (form.currentVersion ?? 0) + 1;
    const publishedAt = new Date().toISOString();

    /* Published versions are immutable: a publish appends a frozen
       snapshot and never edits an existing one. */
    form.versions = [
      ...form.versions,
      {
        version,
        publishedAt,
        config: { ...structuredClone(form.draftConfig), version: String(version) },
      },
    ];
    form.currentVersion = version;
    form.status = 'published';
    form.publishedAt = publishedAt;
    writeStore(forms);

    return structuredClone(form);
  },

  async listVersions(formId) {
    await delay();
    return structuredClone(findForm(readStore(), formId).versions);
  },
};
