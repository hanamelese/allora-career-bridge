
import { z } from 'zod';

import { fieldCatalog } from './fieldCatalog.js';
import { getCatalogKeys } from './optionCatalogs.js';

// ==========================================
// 1. Conditional visibility
// ==========================================

function isFieldVisible(fieldConfig, answers) {
  if (!fieldConfig.showIf) {
    return true;
  }

  const { field, equals } = fieldConfig.showIf;

  return answers[field] === equals;
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
    case 'longText': {
      let schema = z.string();

      if (definition.rules?.minLength !== undefined) {
        schema = schema.min(definition.rules.minLength);
      }

      if (definition.rules?.maxLength !== undefined) {
        schema = schema.max(definition.rules.maxLength);
      }

      return schema;
    }

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

    case 'email':
      return z.email('Enter an email address, like name@example.com.');

    case 'url':
      return z.url('Enter a web address, like https://example.org');

    case 'consent':
      return z.boolean();

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
      return z.string().min(1, 'This answer cannot be empty.');

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

      if (!isFieldVisible(fieldConfig, answers)) {
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

      if (
        value === undefined ||
        value === null ||
        value === ''
      ) {
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

      if (!isFieldVisible(customField, answers)) {
        continue;
      }

      const value = answers[customField.key];

      if (
        value === undefined ||
        value === null ||
        value === ''
      ) {
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
    if (!isFieldVisible(fieldConfig, answers)) {
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
    if (!isFieldVisible(customField, answers)) {
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
