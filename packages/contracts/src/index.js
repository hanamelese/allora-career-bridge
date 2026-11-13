/**
 * @onboarding/contracts
 *
 * One shared source of truth for what a form may contain and what a
 * learner may submit. Imported by the Partner Dashboard, the Form Engine
 * and (from Phase 4) the API, so the three can never drift apart.
 */

export {
  SUPPORTED_LANGUAGES,
  IDENTITY_ROUTES,
  LEVEL_OPTIONS,
  fieldCatalog,
  FIELD_KEYS,
  getField,
} from './fieldCatalog.js';

export {
  supportCatalog,
  SUPPORT_KEYS,
} from './supportCatalog.js';

export {
  FORM_TYPES,
  formTypeSchema,
  IDENTITY_ROUTE_KEYS,
  identityRoutesSchema,
  showIfSchema,
  fieldVisibilitySchema,
  formFieldConfigSchema,
  CUSTOM_FIELD_TYPES,
  customFieldSchema,
  formConfigBaseSchema,
  formConfigSchema,
} from './formConfig.js';

export {
  buildSubmissionSchema,
  buildProgressSchema,
  getPartnerSafeAnswers,
} from './submissionSchema.js';
