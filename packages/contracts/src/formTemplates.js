// packages/contracts/src/formTemplates.js
//
// The configuration each form type starts from, and the plain-language
// reason behind every locked field.
//
// This lives in the contracts package because the dashboard and the API
// need the same defaults: the dashboard seeds a new form from them, and
// the server seeds `form_templates` from them.

import { IDENTITY_ROUTES, fieldCatalog } from './fieldCatalog.js';

const LANGUAGES = ['en', 'am'];

/* Every identity route is offered by default, including "no document". */
const ALL_IDENTITY_ROUTES = IDENTITY_ROUTES.map((route) => route.key);

/**
 * One field entry.
 *
 * `visibility` defaults to whatever the catalogue says: a field the
 * catalogue marks private is private here too, so a template cannot
 * accidentally publish private answers.
 */
function field(key, { required = false, locked = false, enabled = true, showIf } = {}) {
  const definition = fieldCatalog[key];

  return {
    key,
    enabled,
    required,
    locked,
    visibility: definition?.private === true ? 'private' : 'public',
    ...(showIf ? { showIf } : {}),
  };
}

function template(type, formId, features, fields) {
  return {
    schemaVersion: 1,
    formId,
    type,
    version: 'draft',
    languages: LANGUAGES,
    defaultLanguage: 'en',
    features,
    fields,
    identityRoutes: ALL_IDENTITY_ROUTES,
    customFields: [],
  };
}

export const FORM_TEMPLATES = {
  /* ---- Learner Registration ---- */
  signup: template(
    'signup',
    'frm_learner_registration',
    { voiceInput: true, readAloud: true, lowLiteracy: false },
    [
      field('name', { required: true, locked: true }),
      field('phone', { required: true }),
      field('email'),
      field('identityRoute', { required: true, locked: true }),
      /* Only asked when the chosen document actually carries a number, so a
         learner with no document never meets it. */
      field('documentId', {
        showIf: { field: 'identityRoute', in: ['kebele_id', 'passport', 'refugee_id'] },
      }),
      field('location'),
      field('address', { enabled: false }),
      // Partner-assisted registration: an optional extra, off by default.
      field('assistedBy', { enabled: false }),
      field('assistedConsent', { enabled: false }),
      field('consent', { required: true, locked: true }),
    ],
  ),

  /* ---- Learner Profile & Support ---- */
  learner: template(
    'learner',
    'frm_learner_profile',
    { voiceInput: true, readAloud: true, lowLiteracy: true },
    [
      field('name', { required: true, locked: true }),
      field('education'),
      field('currentLevel', { required: true }),
      field('skills'),
      field('careerGoal'),
      field('location'),
      field('address', { enabled: false }),
      // Locked on, never required: always offered, never forced.
      field('supportNeeds', { locked: true }),
      field('supportNote'),
      field('consent', { required: true, locked: true }),
    ],
  ),

  /* ---- Job Application ---- */
  jobApplication: template(
    'jobApplication',
    'frm_job_application',
    { voiceInput: true, readAloud: true, lowLiteracy: false },
    [
      field('name', { required: true, locked: true }),
      field('phone', { required: true }),
      field('email'),
      field('jobReference', { required: true }),
      field('experience'),
      field('motivation'),
      field('skills'),
      field('availability'),
      field('interviewAccommodations', { locked: true }),
      field('consent', { required: true, locked: true }),
    ],
  ),

  /* ---- Employer & Workplace Accessibility ---- */
  employer: template(
    'employer',
    'frm_employer_accessibility',
    { voiceInput: false, readAloud: true, lowLiteracy: false },
    [
      field('organisationName', { required: true, locked: true }),
      field('contactName', { required: true }),
      field('contactEmail', { required: true }),
      field('website'),
      field('sector'),
      field('jobTitle'),
      field('jobLocation'),
      field('employmentType'),
      field('workplaceAccommodations', { locked: true }),
      field('consent', { required: true, locked: true }),
    ],
  ),
};

/**
 * Why each locked field cannot be switched off, in words a partner can
 * act on. Dashboard copy, so it is not part of the published config.
 */
export const LOCK_REASONS = {
  signup: {
    name: 'A registration cannot be completed without a name.',
    identityRoute:
      'Every learner must be offered a way to identify themselves, including the option of having no document at all.',
    consent: 'Learners must agree before any of their answers are submitted.',
  },
  learner: {
    name: 'The profile is attached to a learner, so it needs a name.',
    supportNeeds:
      'Learners must always be able to ask for support. It stays optional to answer, and private when they do.',
    consent: 'Learners must agree before any of their answers are submitted.',
  },
  jobApplication: {
    name: 'An employer cannot act on an application with no name.',
    interviewAccommodations:
      'Applicants must always be able to ask for interview accommodations. The request is private and never shown to the employer as a disability.',
    consent: 'Applicants must agree before their application is submitted.',
  },
  employer: {
    organisationName: 'An opportunity must say which organisation is offering it.',
    workplaceAccommodations:
      'Candidates rely on this to judge whether a job will work for them before they apply.',
    consent: 'The contact must agree before these details are submitted.',
  },
};

export function getTemplate(type) {
  return FORM_TEMPLATES[type] ?? null;
}

export function getLockReason(type, fieldKey) {
  return LOCK_REASONS[type]?.[fieldKey] ?? null;
}
