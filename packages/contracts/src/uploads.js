// packages/contracts/src/uploads.js
//
// File uploads: which kinds of file a partner may allow, how big they may
// be, and the one check every part of the system uses.
//
// Nothing here stores a file. A file a learner picks is checked in the
// browser against these rules and then handed, with the other answers, to
// the website the form is on (the host's `onSubmit`, or the embedded
// form's `onboarding-submit` event). Where it goes from there is the
// partner's own system.

import { z } from 'zod';

/** The kinds of file a partner can allow, each with how to recognise it. */
export const UPLOAD_FILE_TYPES = {
  pdf: { label: 'PDF', extensions: ['.pdf'], mimeTypes: ['application/pdf'] },
  jpg: { label: 'JPG', extensions: ['.jpg', '.jpeg'], mimeTypes: ['image/jpeg'] },
  png: { label: 'PNG', extensions: ['.png'], mimeTypes: ['image/png'] },
  docx: {
    label: 'Word (.docx)',
    extensions: ['.docx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
};

export const UPLOAD_FILE_TYPE_KEYS = Object.keys(UPLOAD_FILE_TYPES);

/* The largest file any form accepts. It travels with the answers to the
   partner's page, so it is kept to a size a page can reasonably handle. */
export const MAX_UPLOAD_MB = 25;

/**
 * A partner's restrictions on one upload question. Both are optional:
 * left out, the size limit is the most allowed and every supported kind of
 * file is accepted.
 */
export const uploadSettingsSchema = z
  .object({
    maxSizeMb: z
      .number()
      .int('Use a whole number of megabytes.')
      .min(1, 'Allow at least 1 MB.')
      .max(MAX_UPLOAD_MB, `Files can be at most ${MAX_UPLOAD_MB} MB.`)
      .optional(),
    accept: z
      .array(z.enum(UPLOAD_FILE_TYPE_KEYS))
      .min(1, 'Allow at least one kind of file.')
      .refine((keys) => new Set(keys).size === keys.length, 'Each kind of file can be listed once.')
      .optional(),
  })
  .strict();

/** The rules that actually apply: the partner's, or the defaults. */
export function resolveUploadRules(settings = {}) {
  return {
    maxSizeMb: settings?.maxSizeMb ?? MAX_UPLOAD_MB,
    accept: settings?.accept?.length ? [...settings.accept] : [...UPLOAD_FILE_TYPE_KEYS],
  };
}

/** For the file picker's `accept` attribute. */
export function acceptAttribute(rules) {
  return resolveUploadRules(rules)
    .accept.flatMap((key) => [...UPLOAD_FILE_TYPES[key].extensions, ...UPLOAD_FILE_TYPES[key].mimeTypes])
    .join(',');
}

/** "PDF, JPG or PNG" */
export function listFileTypes(rules, conjunction = 'or') {
  const labels = resolveUploadRules(rules).accept.map((key) => UPLOAD_FILE_TYPES[key].label);
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} ${conjunction} ${labels.at(-1)}`;
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
}

/** Something with a name, a size and a type - a File, or a description of one. */
export function isFileLike(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.name === 'string' &&
    typeof value.size === 'number' &&
    typeof value.type === 'string'
  );
}

function kindOf(file) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return (
    UPLOAD_FILE_TYPE_KEYS.find((key) => {
      const kind = UPLOAD_FILE_TYPES[key];
      /* Both must agree when the browser gives a type, so a renamed file
         is not let through on its name alone. */
      const nameMatches = kind.extensions.some((extension) => name.endsWith(extension));
      return nameMatches && (type === '' || kind.mimeTypes.includes(type));
    }) ?? null
  );
}

/**
 * Checks a chosen file against the rules.
 * Returns null when it is fine, or `{ problem, ... }`:
 *   'invalid'   - not a file at all
 *   'empty'     - a file with nothing in it
 *   'tooBig'    - with `size` and `maxSizeMb`
 *   'wrongType' - with `allowed` ("PDF, JPG or PNG")
 */
export function checkFile(file, settings) {
  const rules = resolveUploadRules(settings);

  if (!isFileLike(file)) return { problem: 'invalid' };
  if (file.size === 0) return { problem: 'empty' };

  if (!rules.accept.includes(kindOf(file))) {
    return { problem: 'wrongType', allowed: listFileTypes(rules) };
  }

  if (file.size > rules.maxSizeMb * 1024 * 1024) {
    return { problem: 'tooBig', size: formatFileSize(file.size), maxSizeMb: rules.maxSizeMb };
  }

  return null;
}
