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

import { FORM_TEMPLATES } from './formTemplates.js';

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

const IDENTITY_KEYS = ['identityRoute', 'documentId'];

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
