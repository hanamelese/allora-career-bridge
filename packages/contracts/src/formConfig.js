
import { z } from 'zod';
import { IDENTITY_ROUTES, fieldCatalog } from './fieldCatalog.js';

// ==========================================
// 1. Supported form types
// ==========================================

export const FORM_TYPES = [
  'learner',
  'signup',
  'jobSeeker',
  'employer',
  'jobApplication',
  'employerJob',
];

export const formTypeSchema = z.enum(FORM_TYPES);

// ==========================================
// 2. Identity route validation
// ==========================================

export const IDENTITY_ROUTE_KEYS = IDENTITY_ROUTES.map(
  (route) => route.key
);

export const identityRoutesSchema = z
  .array(z.enum(IDENTITY_ROUTE_KEYS))
  .min(1)
  .default(IDENTITY_ROUTE_KEYS)
  .superRefine((routes, ctx) => {
    if (!routes.includes('no_document')) {
      ctx.addIssue({
        code: 'custom',
        message: 'The no_document identity route must always be available.',
      });
    }

    if (new Set(routes).size !== routes.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Identity routes must not contain duplicates.',
      });
    }
  });

// ==========================================
// 3. Conditional field display
// ==========================================

const showIfValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

/**
 * When a question should be asked.
 *
 * `equals` covers a single answer; `in` covers several, which is what a
 * question like "ID number" needs - it applies to a Kebele ID, a passport
 * and a refugee ID, but not to a learner who has no document at all.
 */
export const showIfSchema = z.union([
  z.object({
    field: z.string().min(1),
    equals: showIfValueSchema,
  }).strict(),
  z.object({
    field: z.string().min(1),
    in: z.array(showIfValueSchema).min(1),
  }).strict(),
]);

// ==========================================
// 3b. Partner text overrides
// ==========================================

/**
 * A partner may reword a question. English is required because it is the
 * fallback for every other language; Amharic is optional and falls back to
 * the catalogue's reviewed translation when left out, so a partner is
 * never forced to write Amharic in order to fix an English label.
 */
export const localizedTextSchema = z.object({
  en: z.string().min(1).max(300),
  am: z.string().min(1).max(300).optional(),
}).strict();

/**
 * An option on an editable built-in choice field. Keyed like the catalogue
 * options it replaces, so stored answers keep their meaning.
 */
export const builtInOptionSchema = z.object({
  key: z.string().min(1).max(60).regex(
    /^[a-z0-9_]+$/,
    'Option keys may use lower-case letters, numbers and underscores only.'
  ),
  label: localizedTextSchema,
}).strict();

// ==========================================
// 4. Field visibility
// ==========================================

export const fieldVisibilitySchema = z.enum([
  'public',
  'private',
]);

// ==========================================
// 5. Built-in field configuration
// ==========================================

export const formFieldConfigSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean(),
  required: z.boolean(),
  locked: z.boolean(),
  visibility: fieldVisibilitySchema.default('public'),
  showIf: showIfSchema.optional(),

  // Optional partner overrides. Absent means "use the field catalogue".
  label: localizedTextSchema.optional(),
  helpText: localizedTextSchema.optional(),
  options: z.array(builtInOptionSchema).min(1).optional(),
  voiceInput: z.boolean().optional(),
}).strict().superRefine((field, ctx) => {
  const definition = fieldCatalog[field.key];

  if (!definition) {
    ctx.addIssue({
      code: 'custom',
      path: ['key'],
      message: `"${field.key}" is not a field in the catalogue.`,
    });
    return;
  }

  /* A field the catalogue marks private stays private. Answers to it are
     filtered out of anything a partner sees, so letting the config claim
     otherwise would only mislead. */
  if (definition.private === true && field.visibility !== 'private') {
    ctx.addIssue({
      code: 'custom',
      path: ['visibility'],
      message: `"${field.key}" holds private information and must stay private.`,
    });
  }

  if (field.options) {
    if (definition.optionsEditable !== true) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: `The options for "${field.key}" cannot be changed.`,
      });
    }

    const keys = field.options.map((option) => option.key);

    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Option keys must not contain duplicates.',
      });
    }
  }

  if (field.voiceInput === true && definition.voiceInput === false) {
    ctx.addIssue({
      code: 'custom',
      path: ['voiceInput'],
      message: `"${field.key}" cannot be answered by voice.`,
    });
  }
});

// ==========================================
// 6. Custom field types
// ==========================================

export const CUSTOM_FIELD_TYPES = [
  'text',
  'choice',
  'yesNo',
];

export const customFieldSchema = z.object({
  /* Constrained because a key becomes a property name on the submitted
     answers: lower-case letters, numbers and underscores only. */
  key: z.string().min(1).max(60).regex(
    /^[a-z0-9_]+$/,
    'Field keys may use lower-case letters, numbers and underscores only.'
  ),

  type: z.enum(CUSTOM_FIELD_TYPES),

  /* Amharic is optional and falls back to English, the same rule as a
     partner's override of a built-in label. Requiring it would only
     encourage guessed translations. */
  label: localizedTextSchema,

  helpText: localizedTextSchema.optional(),

  enabled: z.boolean().default(true),

  required: z.boolean().default(false),

  visibility: fieldVisibilitySchema.default('public'),

  showIf: showIfSchema.optional(),

  options: z.array(
    z.object({
      value: z.string().min(1).max(60).regex(
        /^[a-z0-9_]+$/,
        'Option values may use lower-case letters, numbers and underscores only.'
      ),
      label: localizedTextSchema,
    }).strict()
  ).optional(),

}).strict().superRefine((field, ctx) => {
  if (field.required && !field.enabled) {
    ctx.addIssue({
      code: 'custom',
      path: ['required'],
      message: 'A disabled custom field cannot be required.',
    });
  }

  if (field.type === 'choice') {
    if (!field.options || field.options.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Choice fields must have at least one option.',
      });
    }

    if (
      field.options &&
      new Set(field.options.map((option) => option.value)).size !==
        field.options.length
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Choice option values must not contain duplicates.',
      });
    }
  }

  if (
    (field.type === 'text' || field.type === 'yesNo') &&
    field.options !== undefined
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['options'],
      message: 'Text and yesNo fields must not have choice options.',
    });
  }
});

// ==========================================
// 7. Base form configuration
// ==========================================

export const formConfigBaseSchema = z.object({
  schemaVersion: z.literal(1),

  formId: z.string().min(1),

  type: formTypeSchema,

  version: z.string().min(1),

  languages: z.array(
    z.enum(['en', 'am'])
  ).min(1),

  defaultLanguage: z.enum(['en', 'am']),

  features: z.object({
    voiceInput: z.boolean(),
    readAloud: z.boolean(),
    lowLiteracy: z.boolean(),
  }).strict(),

  fields: z.array(
    formFieldConfigSchema
  ).min(1),

  identityRoutes: identityRoutesSchema,

  customFields: z.array(
    customFieldSchema
  ).default([]),

}).strict().superRefine((config, ctx) => {
  config.fields.forEach((field, index) => {
    if (field.locked && !field.enabled) {
      ctx.addIssue({
        code: 'custom',
        path: ['fields', index, 'enabled'],
        message: 'A locked field cannot be disabled.',
      });
    }

    if (field.required && !field.enabled) {
      ctx.addIssue({
        code: 'custom',
        path: ['fields', index, 'required'],
        message: 'A disabled field cannot be required.',
      });
    }
  });
});

// ==========================================
// 8. Final public configuration schema
// ==========================================

export const formConfigSchema = formConfigBaseSchema.superRefine(
  (config, ctx) => {
    const fieldKeys = config.fields.map(
      (field) => field.key
    );

    const customFieldKeys = config.customFields.map(
      (field) => field.key
    );

    // Built-in keys must be unique
    if (new Set(fieldKeys).size !== fieldKeys.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['fields'],
        message: 'Field keys must not contain duplicates.',
      });
    }

    // Custom keys must be unique
    if (new Set(customFieldKeys).size !== customFieldKeys.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['customFields'],
        message: 'Custom field keys must not contain duplicates.',
      });
    }

    // Built-in and custom keys cannot overlap
    const allKeys = [...fieldKeys, ...customFieldKeys];

    if (new Set(allKeys).size !== allKeys.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['customFields'],
        message: 'Built-in and custom field keys must not overlap.',
      });
    }

    // Check conditional references for both field types
    const allFields = [
      ...config.fields,
      ...config.customFields,
    ];

    allFields.forEach((field, index) => {
      if (!field.showIf) {
        return;
      }

      const referencedFieldExists = allFields.some(
        (item) => item.key === field.showIf.field
      );

      if (!referencedFieldExists) {
        const isCustomField = index >= config.fields.length;

        ctx.addIssue({
          code: 'custom',
          path: isCustomField
            ? ['customFields', index - config.fields.length, 'showIf', 'field']
            : ['fields', index, 'showIf', 'field'],
          message: `showIf references an unknown field: ${field.showIf.field}`,
        });
      }
    });

    // Default language must be supported
    if (!config.languages.includes(config.defaultLanguage)) {
      ctx.addIssue({
        code: 'custom',
        path: ['defaultLanguage'],
        message: 'The default language must be included in the languages list.',
      });
    }

    // Languages cannot be duplicated
    if (new Set(config.languages).size !== config.languages.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['languages'],
        message: 'Languages must not contain duplicates.',
      });
    }
  }
);
