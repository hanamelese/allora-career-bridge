// packages/contracts/src/submissions.js
//
// What an embedded form delivers to the organisation's own server (see
// delivery.js). This service keeps none of it.
//
// Left out, in the browser before anything is sent:
//   - private answers: support needs, accommodations, the referral choice,
//     and the identity document file (see `private` in the field catalog
//     and `getPartnerSafeAnswers`);
//   - ID numbers (`documentId`);
//   - the contents of any file. A CV is described by its name, size and
//     type; the file itself is handed to the website the form is on, in
//     the onboarding-submit event, along with the private answers.

import { z } from 'zod';
import { fieldCatalog } from './fieldCatalog.js';
import { getPartnerSafeAnswers } from './submissionSchema.js';
import { isFileLike } from './uploads.js';

/* Never stored, whatever a form's configuration says. */
export const NEVER_STORED_KEYS = ['documentId'];

/** A file, reduced to what may be stored about it. */
export function describeFile(file) {
  return { name: String(file.name), size: Number(file.size), type: String(file.type) };
}

/**
 * The answers that may be stored, from everything a learner gave.
 * Hidden questions, private answers and ID numbers are dropped, and each
 * file becomes `{ name, size, type }`.
 */
export function toStorableSubmission(config, answers) {
  const safe = getPartnerSafeAnswers(config, answers);
  const stored = {};

  for (const [key, value] of Object.entries(safe)) {
    if (NEVER_STORED_KEYS.includes(key) || value === undefined) continue;
    stored[key] = isFileLike(value) ? describeFile(value) : value;
  }

  return stored;
}

function isStored(field, definition) {
  return !(
    NEVER_STORED_KEYS.includes(field.key) ||
    field.visibility === 'private' ||
    definition?.private === true
  );
}

/**
 * The form as the server checks a stored submission: questions whose
 * answers are never sent are not required there. Everything else keeps its
 * rules, including which questions must be answered.
 */
export function storedSubmissionConfig(config) {
  return {
    ...config,
    fields: (config.fields ?? []).map((field) =>
      isStored(field, fieldCatalog[field.key]) ? field : { ...field, required: false },
    ),
    customFields: (config.customFields ?? []).map((field) =>
      isStored(field, null) ? field : { ...field, required: false },
    ),
  };
}

/** What the embedded form sends: the version answered, and the storable answers. */
export const submissionRequestSchema = z
  .object({
    version: z.number().int().positive(),
    answers: z.record(z.string(), z.unknown()),
    /* The language the learner answered in, so their answers read right. */
    language: z.enum(['en', 'am']).optional(),
  })
  .strict();
