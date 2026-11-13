import { IDENTITY_ROUTE_KEYS } from '@onboarding/contracts';
import { FORM_TYPES } from '../formTypes.js';

/**
 * Starting configuration for each form type.
 *
 * Phase 1 needs just enough of a real config to drive the dashboard and to
 * prove it validates against `formConfigSchema`, so it uses the nine
 * fields the shared catalog defines today.
 *
 * Phase 2 moves these defaults into `formTemplates.js` in
 * @onboarding/contracts - the API needs the same ones - and adds the
 * job-application and employer fields, which the catalog does not have yet.
 */

/** A field entry. A `locked` field stays on, and the dashboard says why. */
function field(key, { required = false, locked = false, enabled = true, visibility = 'public' } = {}) {
  return { key, enabled, required, locked, visibility };
}

/** Which fields each form type starts with, and how. */
const FIELDS_BY_TYPE = {
  signup: [
    field('name', { required: true, locked: true }),
    field('phone'),
    field('identityRoute', { required: true, locked: true }),
    field('documentId'),
    field('location'),
    field('address', { enabled: false }),
    field('consent', { required: true, locked: true }),
  ],

  learner: [
    field('name', { required: true, locked: true }),
    field('currentLevel', { required: true }),
    field('location'),
    field('address', { enabled: false }),
    field('supportNeeds', { visibility: 'private' }),
    field('consent', { required: true, locked: true }),
  ],

  jobApplication: [
    field('name', { required: true, locked: true }),
    field('phone', { required: true }),
    field('currentLevel'),
    field('supportNeeds', { visibility: 'private' }),
    field('consent', { required: true, locked: true }),
  ],

  employer: [
    field('name', { required: true, locked: true }),
    field('phone', { required: true }),
    field('location', { required: true }),
    field('address'),
    field('consent', { required: true, locked: true }),
  ],
};

/** Accessibility features each form type starts with switched on. */
const FEATURES_BY_TYPE = {
  signup: { voiceInput: true, readAloud: true, lowLiteracy: false },
  learner: { voiceInput: true, readAloud: true, lowLiteracy: true },
  jobApplication: { voiceInput: true, readAloud: true, lowLiteracy: false },
  employer: { voiceInput: false, readAloud: true, lowLiteracy: false },
};

/**
 * `version: 'draft'` marks a configuration that has never been published.
 * Publishing stamps the new version number onto its frozen snapshot.
 */
export const SEED_CONFIGS = Object.fromEntries(
  FORM_TYPES.map((formType) => [
    formType.id,
    {
      schemaVersion: 1,
      formId: formType.formId,
      type: formType.id,
      version: 'draft',
      languages: ['en', 'am'],
      defaultLanguage: 'en',
      features: FEATURES_BY_TYPE[formType.id],
      fields: FIELDS_BY_TYPE[formType.id],
      identityRoutes: IDENTITY_ROUTE_KEYS,
      customFields: [],
    },
  ]),
);
