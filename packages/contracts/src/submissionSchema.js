
import { z } from 'zod';

import { fieldCatalog } from './fieldCatalog.js';
import { getCatalogKeys } from './optionCatalogs.js';
import { matchesShowIf } from './fieldVisibility.js';
import { checkFile } from './uploads.js';

// ==========================================
// 1. Written answers
// ==========================================

/**
 * A written answer, trimmed before it is measured - so "   " is no answer
 * at all, and " A " is one letter, whether it was typed or spoken.
 *
 * Only a non-empty answer is held to the length rules. Whether an empty
 * one is allowed is the required check's decision (below), so an optional
 * question left blank, or answered with spaces, is simply unanswered.
 */
function trimmedText(rules = {}) {
  const { minLength, maxLength } = rules;

  return z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (value === '') return;

      if (minLength !== undefined && value.length < minLength) {
        context.addIssue({
          code: 'too_small',
          origin: 'string',
          minimum: minLength,
          inclusive: true,
          input: value,
          message: `Use at least ${minLength} characters.`,
        });
      }

      if (maxLength !== undefined && value.length > maxLength) {
        context.addIssue({
          code: 'too_big',
          origin: 'string',
          maximum: maxLength,
          inclusive: true,
          input: value,
          message: `Use at most ${maxLength} characters.`,
        });
      }
    });
}

/** Nothing written: missing, null, or only spaces. */
export function isBlankAnswer(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

// ==========================================
// 2. Built-in field validation
// ==========================================

function getBuiltInFieldSchema(fieldConfig, config) {
  const key = fieldConfig.key;
  const definition = fieldCatalog[key];

  if (!definition) {
    throw new Error(`Unknown built-in field: ${key}`);
  }

  switch (definition.type) {
    case 'text':
    case 'longText':
      return trimmedText(definition.rules);

    case 'phone': {
      let schema = z.string();

      if (definition.rules?.pattern) {
        schema = schema.regex(
          new RegExp(definition.rules.pattern),
          'Enter a valid phone number.'
        );
      }

      return schema;
    }

    case 'choice': {
      /* A partner may have reworded or replaced the options; validate
         against the list the learner was actually shown. */
      const options = fieldConfig.options ?? definition.options ?? [];
      const allowedValues = options.map((option) => option.key);

      return z.string().refine(
        (value) => allowedValues.includes(value),
        'Choose a valid option.'
      );
    }

    case 'identityRoute': {
      const allowedRoutes = config.identityRoutes ?? [];

      return z.string().refine(
        (value) => allowedRoutes.includes(value),
        'Choose a valid identity route.'
      );
    }

    case 'multiChoice': {
      const allowedKeys = getCatalogKeys(definition.optionsFrom);

      return z.array(
        z.string().refine(
          (value) => allowedKeys.includes(value),
          'Choose an option from the list.'
        )
      ).refine(
        (values) => new Set(values).size === values.length,
        'Do not select the same option more than once.'
      );
    }

    case 'password':
      return z
        .string()
        .min(definition.rules?.minLength ?? 8, 'Use at least 8 characters.')
        .max(definition.rules?.maxLength ?? 128);

    case 'email':
      return z.email('Enter an email address, like name@example.com.');

    case 'url':
      return z.url('Enter a web address, like https://example.org');

    case 'consent':
      return z.boolean();

    /* A chosen file, kept as it is (the File itself goes on to the host).
       The partner's restrictions override the catalogue's defaults. Each
       problem carries `params.fileProblem`, so the learner is told what to
       do about it in their own language. */
    case 'file': {
      const settings = fieldConfig.upload ?? definition.upload;

      return z.custom(() => true).superRefine((value, context) => {
        const found = checkFile(value, settings);
        if (!found) return;

        context.addIssue({
          code: 'custom',
          message:
            found.problem === 'tooBig'
              ? `This file is ${found.size}. Files can be up to ${found.maxSizeMb} MB.`
              : found.problem === 'wrongType'
                ? `This kind of file cannot be used. Choose a ${found.allowed} file.`
                : 'Choose a file.',
          params: { fileProblem: found.problem, ...found },
        });
      });
    }

    /* The partner ids the learner chose. Which ids exist is only known to
       the server, which checks them when a referral is actually sent. */
    case 'referral':
      return z
        .array(z.string().min(1).max(64))
        .max(10)
        .refine(
          (values) => new Set(values).size === values.length,
          'Do not select the same organisation more than once.'
        );

    default:
      throw new Error(
        `No validation rule exists for field type: ${definition.type}`
      );
  }
}

// ==========================================
// 3. Custom field validation
// ==========================================

function getCustomFieldSchema(customField) {
  switch (customField.type) {
    case 'text':
      return trimmedText({ minLength: 1 });

    case 'choice': {
      const allowedValues = (customField.options ?? []).map(
        (option) => option.value
      );

      return z.string().refine(
        (value) => allowedValues.includes(value),
        'Choose a valid option.'
      );
    }

    case 'yesNo':
      return z.boolean();

    default:
      throw new Error(
        `Unsupported custom field type: ${customField.type}`
      );
  }
}

// ==========================================
// 4. Build answer shape
// ==========================================

function buildAnswerShape(config) {
  const shape = {};

  for (const fieldConfig of config.fields) {
    if (!fieldConfig.enabled) {
      continue;
    }

    shape[fieldConfig.key] = getBuiltInFieldSchema(
      fieldConfig,
      config
    ).optional();
  }

  for (const customField of config.customFields ?? []) {
    if (!customField.enabled) {
      continue;
    }

    shape[customField.key] = getCustomFieldSchema(
      customField
    ).optional();
  }

  return shape;
}

// ==========================================
// 5. Required-field validation
// ==========================================

function addRequiredFieldValidation(
  schema,
  config,
  allowIncomplete
) {
  return schema.superRefine((answers, context) => {
    if (allowIncomplete) {
      return;
    }

    for (const fieldConfig of config.fields) {
      if (!fieldConfig.enabled || !fieldConfig.required) {
        continue;
      }

      if (!matchesShowIf(fieldConfig.showIf, answers)) {
        continue;
      }

      const value = answers[fieldConfig.key];
      const definition = fieldCatalog[fieldConfig.key];

      /* Checked by type, not by key: a form can carry more than one
         consent question - a learner's own, and a partner's confirmation
         that they may register on the learner's behalf - and `false` is
         not an empty answer, so the generic check below would pass it. */
      if (definition?.type === 'consent') {
        if (value !== true) {
          context.addIssue({
            code: 'custom',
            path: [fieldConfig.key],
            message: 'Permission is required to continue.',
          });
        }

        continue;
      }

      /* An empty list is an unanswered multi-choice question; [] is
         neither undefined nor '', so it needs saying explicitly. */
      if (Array.isArray(value)) {
        if (value.length === 0) {
          context.addIssue({
            code: 'custom',
            path: [fieldConfig.key],
            message: 'Choose at least one option.',
          });
        }

        continue;
      }

      if (isBlankAnswer(value)) {
        context.addIssue({
          code: 'custom',
          path: [fieldConfig.key],
          message: 'This question is required.',
        });
      }
    }

    for (const customField of config.customFields ?? []) {
      if (!customField.enabled || !customField.required) {
        continue;
      }

      if (!matchesShowIf(customField.showIf, answers)) {
        continue;
      }

      const value = answers[customField.key];

      if (isBlankAnswer(value)) {
        context.addIssue({
          code: 'custom',
          path: [customField.key],
          message: 'This question is required.',
        });
      }
    }
  });
}

// ==========================================
// 6. Submission schema
// ==========================================

export function buildSubmissionSchema(config) {
  const baseSchema = z.object(
    buildAnswerShape(config)
  ).strict();

  return addRequiredFieldValidation(
    baseSchema,
    config,
    false
  );
}

// ==========================================
// 7. Progress schema
// ==========================================

export function buildProgressSchema(config) {
  const baseSchema = z.object(
    buildAnswerShape(config)
  ).strict();

  return addRequiredFieldValidation(
    baseSchema,
    config,
    true
  );
}

// ==========================================
// 8. Partner-safe answer filtering
// ==========================================

export function getPartnerSafeAnswers(config, answers) {
  const safeAnswers = {};

  // Filter built-in fields
  for (const fieldConfig of config.fields) {
    if (!fieldConfig.enabled) {
      continue;
    }

    // Do not share answers for hidden conditional fields
    if (!matchesShowIf(fieldConfig.showIf, answers)) {
      continue;
    }

    const definition = fieldCatalog[fieldConfig.key];

    const isPrivate =
      fieldConfig.visibility === 'private' ||
      definition?.private === true;

    if (isPrivate) {
      continue;
    }

    if (Object.hasOwn(answers, fieldConfig.key)) {
      safeAnswers[fieldConfig.key] = answers[fieldConfig.key];
    }
  }

  // Filter custom fields
  for (const customField of config.customFields ?? []) {
    if (!customField.enabled) {
      continue;
    }

    // Do not share answers for hidden conditional fields
    if (!matchesShowIf(customField.showIf, answers)) {
      continue;
    }

    if (customField.visibility === 'private') {
      continue;
    }

    if (Object.hasOwn(answers, customField.key)) {
      safeAnswers[customField.key] = answers[customField.key];
    }
  }

  return safeAnswers;
}
