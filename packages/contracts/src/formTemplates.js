// packages/contracts/src/formTemplates.js
//
// The configuration each form type starts from, and the plain-language
// reason behind every locked field.
//
// This lives in the contracts package because the dashboard and the API
// need the same defaults: the dashboard seeds a new form from them, and
// the server seeds `form_templates` from them.

import { OFFERED_IDENTITY_ROUTES, fieldCatalog } from './fieldCatalog.js';
import { defaultAccountSettings } from './socialProviders.js';

const LANGUAGES = ['en', 'am'];

/* Every identity route is offered by default, including "no document". */
const ALL_IDENTITY_ROUTES = OFFERED_IDENTITY_ROUTES.map((route) => route.key);

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

function template(type, formId, fields) {
  return {
    schemaVersion: 1,
    formId,
    type,
    version: 'draft',
    languages: LANGUAGES,
    defaultLanguage: 'en',
    fields,
    identityRoutes: ALL_IDENTITY_ROUTES,
    customFields: [],
  };
}

/**
 * Form types that are no longer offered. `learner` (Learner Profile &
 * Support) was merged into `signup`; existing rows are upgraded by the API
 * and the type stays valid in the schema so stored versions still parse.
 */
export const LEGACY_FORM_TYPES = ['learner'];

/**
 * How a person identifies themselves, shared by the learner and job
 * application forms: the question, the ID number (only for a document that
 * carries one) and - for "I have no document, refer me" - the referral to
 * a partner organisation. Their name and phone are already known by then,
 * so nothing is asked twice.
 */
export const IDENTITY_FIELD_KEYS = ['identityRoute', 'documentId', 'identityDocumentFile', 'referral'];

/* Every route where the learner has some document to show. */
const DOCUMENT_ROUTES = ['kebele_id', 'passport', 'refugee_id', 'other_document'];

function IDENTITY_FIELDS() {
  return [
    field('identityRoute', { required: true, locked: true }),
    field('documentId', {
      showIf: { field: 'identityRoute', in: ['kebele_id', 'passport', 'refugee_id'] },
    }),
    /* Not everyone has a standard ID card, so any document can be
       uploaded - but never has to be. */
    field('identityDocumentFile', {
      showIf: { field: 'identityRoute', in: DOCUMENT_ROUTES },
    }),
    field('referral', {
      locked: true,
      showIf: { field: 'identityRoute', in: ['no_document'] },
    }),
  ];
}

export const FORM_TEMPLATES = {
  /* ---- Sign up / Sign in ----
     An accessible sign-in component for the partner's own site. The name
     is only asked when the form is set to Sign up. */
  account: {
    ...template('account', 'frm_account', [
      field('name', { required: true }),
      field('email', { required: true, locked: true }),
      field('password', { required: true, locked: true }),
    ]),
    account: defaultAccountSettings(),
  },

  /* ---- Learner Registration & Profile ----
     One learner form: who they are, how they can be identified, their
     background, and a private way to ask for support. */
  signup: template(
    'signup',
    'frm_learner_registration',
    [
      field('name', { required: true, locked: true }),
      field('phone', { required: true }),
      field('email'),
      field('location'),
      field('address', { enabled: false }),
      field('education'),
      field('currentLevel', { required: true }),
      field('skills'),
      field('careerGoal'),
      // Locked on, never required: always offered, never forced.
      field('supportNeeds', { locked: true }),
      field('supportNote'),
      // Partner-assisted registration: an optional extra, off by default.
      field('assistedBy', { enabled: false }),
      field('assistedConsent', { enabled: false }),
      /* The identity questions come last, so that "How can
         we identify you?" -> ID number, or -> referral, is one unbroken
         run at the end rather than interrupting the ordinary questions. */
      ...IDENTITY_FIELDS(),
    ],
  ),

  /* ---- Job Application ---- */
  jobApplication: template(
    'jobApplication',
    'frm_job_application',
    [
      field('name', { required: true, locked: true }),
      field('phone', { required: true }),
      field('email'),
      field('jobReference', { required: true }),
      field('experience'),
      field('motivation'),
      field('skills'),
      field('cvFile'),
      field('availability'),
      field('interviewAccommodations', { locked: true }),
      /* The same identity questions as the learner form, last, so "How can
         we identify you?" -> ID number, or -> referral, is one unbroken run
         at the end. Name and phone are already asked above, so a referral
         never asks for them again. */
      ...IDENTITY_FIELDS(),
    ],
  ),

  /* ---- Employer & Workplace Accessibility ---- */
  employer: template(
    'employer',
    'frm_employer_accessibility',
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
  account: {
    email: 'People need an email address to sign up or sign in with a password.',
    password: 'A password is how an email sign-up or sign-in is checked. It is never read aloud or shown back.',
  },
  signup: {
    name: 'A registration cannot be completed without a name.',
    identityRoute:
      'Every learner must be offered a way to identify themselves, including the option of having no document at all.',
    supportNeeds:
      'Learners must always be able to ask for support. It stays optional to answer, and private when they do.',
    referral:
      'A learner with no identity document must always have a way forward. It is only asked of learners who choose "I have no document, refer me", and it never has to be answered.',
  },
  jobApplication: {
    name: 'An employer cannot act on an application with no name.',
    interviewAccommodations:
      'Applicants must always be able to say what would help them at the job. The request is private and never shown to the employer as a disability.',
    identityRoute:
      'Every applicant must be offered a way to identify themselves, including the option of having no document at all.',
    referral:
      'An applicant with no identity document must always have a way forward. It is only asked of applicants who choose "I have no document, refer me", and it never has to be answered.',
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
