// packages/contracts/src/formUpgrades.js
//
// Bringing stored drafts forward when a template changes shape.
//
// Learner Registration (`signup`) and Learner Profile & Support (`learner`)
// used to be two forms asking for much the same thing. They are now one
// form, stored under the `signup` type. A partner's existing `signup` draft
// is upgraded with the profile questions it lacks, carrying over whatever
// that partner had already set on their `learner` draft, so their wording,
// options and on/off choices are not lost.
//
// Published versions are never touched: they are immutable, and a website
// pinned to one keeps getting exactly what it was published with.

import { FORM_TEMPLATES, IDENTITY_FIELD_KEYS } from './formTemplates.js';

/**
 * Returns the upgraded `signup` draft, or the same object when nothing
 * needs to change (so a caller can skip the write).
 */
export function upgradeLearnerDraft(signupDraft, learnerDraft = null) {
  const template = FORM_TEMPLATES.signup;
  const existing = new Map(signupDraft.fields.map((field) => [field.key, field]));
  const fromProfile = new Map((learnerDraft?.fields ?? []).map((field) => [field.key, field]));

  const missing = template.fields.filter((field) => !existing.has(field.key));

  if (missing.length === 0) {
    return signupDraft;
  }

  const fields = template.fields.map((templateField) => {
    if (existing.has(templateField.key)) {
      return existing.get(templateField.key);
    }

    const carried = fromProfile.get(templateField.key);

    if (!carried) {
      return templateField;
    }

    /* The merged template decides what is locked; a locked question is
       always on. Everything the partner chose otherwise is kept. */
    return {
      ...carried,
      locked: templateField.locked,
      enabled: templateField.locked ? true : carried.enabled,
      required: templateField.locked ? templateField.required : carried.required,
      visibility: templateField.visibility === 'private' ? 'private' : carried.visibility,
    };
  });

  /* Anything the stored draft had that the template does not name is kept,
     at the end, rather than silently dropped. */
  const templateKeys = new Set(template.fields.map((field) => field.key));
  const extras = signupDraft.fields.filter((field) => !templateKeys.has(field.key));

  const builtInKeys = new Set([...templateKeys, ...extras.map((field) => field.key)]);
  const customKeys = new Set((signupDraft.customFields ?? []).map((field) => field.key));
  const carriedCustom = (learnerDraft?.customFields ?? []).filter(
    (field) => !customKeys.has(field.key) && !builtInKeys.has(field.key),
  );

  return {
    ...signupDraft,
    fields: [...fields, ...extras],
    customFields: [...(signupDraft.customFields ?? []), ...carriedCustom],
  };
}

const IDENTITY_KEYS = ['identityRoute', 'documentId', 'identityDocumentFile'];

/**
 * Moves "How can we identify you?" and the ID number to the end of a
 * learner draft, just before the referral step, so the identity questions
 * and the referral that may follow them are one unbroken run.
 *
 * Every other question keeps its place. Returns the same object when the
 * draft is already in that order.
 */
export function moveIdentityToEnd(draft) {
  const identity = IDENTITY_KEYS.map((key) => draft.fields.find((field) => field.key === key)).filter(
    Boolean,
  );

  if (identity.length === 0) return draft;

  const rest = draft.fields.filter((field) => !IDENTITY_KEYS.includes(field.key));
  const referralIndex = rest.findIndex((field) => field.key === 'referral');
  const at = referralIndex === -1 ? rest.length : referralIndex;
  const fields = [...rest.slice(0, at), ...identity, ...rest.slice(at)];

  const unchanged = fields.every((field, index) => field === draft.fields[index]);

  return unchanged ? draft : { ...draft, fields };
}

/**
 * "Refer me through a partner" and "I have no document" both led to the
 * same referral step, so they are one option now: "I have no document,
 * refer me" (`no_document`). This takes the retired route out of a draft,
 * and points anything that was shown for it at `no_document` instead.
 *
 * Returns the same object when the draft never used it.
 */
export function mergeReferralRoutes(draft) {
  const RETIRED = 'partner_referral';

  const usesRetired =
    (draft.identityRoutes ?? []).includes(RETIRED) ||
    [...(draft.fields ?? []), ...(draft.customFields ?? [])].some((field) =>
      field.showIf?.in?.includes(RETIRED) || field.showIf?.equals === RETIRED,
    );

  if (!usesRetired) return draft;

  function redirect(field) {
    const showIf = field.showIf;
    if (!showIf) return field;

    if (Array.isArray(showIf.in) && showIf.in.includes(RETIRED)) {
      const values = [...new Set(showIf.in.map((value) => (value === RETIRED ? 'no_document' : value)))];
      return { ...field, showIf: { ...showIf, in: values } };
    }

    if (showIf.equals === RETIRED) {
      return { ...field, showIf: { ...showIf, equals: 'no_document' } };
    }

    return field;
  }

  return {
    ...draft,
    identityRoutes: (draft.identityRoutes ?? []).filter((route) => route !== RETIRED),
    fields: draft.fields.map(redirect),
    customFields: (draft.customFields ?? []).map(redirect),
  };
}

/* Form types that no longer ask the learner's own permission question. */
const WITHOUT_CONSENT = ['signup', 'jobApplication'];

/**
 * The learner's own permission question ("Your permission") is no longer
 * part of the learner or job application forms. This drops it from a
 * stored draft of those types. The staff "Permission to register on their
 * behalf" question is a different field and is left alone, as is the
 * employer form's contact permission.
 *
 * Returns the same object when there is nothing to remove.
 */
export function removeLearnerConsent(draft) {
  if (!WITHOUT_CONSENT.includes(draft.type)) return draft;
  if (!draft.fields.some((field) => field.key === 'consent')) return draft;

  return { ...draft, fields: draft.fields.filter((field) => field.key !== 'consent') };
}

/**
 * Gives a job application draft the identity questions - "How can we
 * identify you?", the ID number and the referral - at the end, as the
 * template now has them. A draft that already has any of them is left as
 * it is, so a partner's own choices are never overwritten.
 *
 * Returns the same object when there is nothing to add.
 */
export function addJobIdentityQuestions(draft) {
  if (draft.type !== 'jobApplication') return draft;

  const has = new Set(draft.fields.map((field) => field.key));
  if (IDENTITY_FIELD_KEYS.some((key) => has.has(key))) return draft;

  const added = FORM_TEMPLATES.jobApplication.fields.filter((field) => IDENTITY_FIELD_KEYS.includes(field.key));

  return { ...draft, fields: [...draft.fields, ...added] };
}

/**
 * Adds the upload questions a draft's template now has but the draft does
 * not: the identity document upload (after the ID number) on the learner
 * and job application forms, and the CV upload (after skills) on the job
 * application. Everything the partner already set is kept.
 *
 * Returns the same object when there is nothing to add.
 */
export function addUploadQuestions(draft) {
  const template = FORM_TEMPLATES[draft.type];
  if (!template) return draft;

  const wanted = [
    { key: 'identityDocumentFile', after: 'documentId' },
    { key: 'cvFile', after: 'skills' },
  ].filter(({ key }) => template.fields.some((field) => field.key === key));

  let fields = draft.fields;

  for (const { key, after } of wanted) {
    if (fields.some((field) => field.key === key)) continue;
    /* Only beside the question it follows; without that, leave it out. */
    const at = fields.findIndex((field) => field.key === after);
    if (at === -1) continue;

    const entry = template.fields.find((field) => field.key === key);
    fields = [...fields.slice(0, at + 1), entry, ...fields.slice(at + 1)];
  }

  return fields === draft.fields ? draft : { ...draft, fields };
}
