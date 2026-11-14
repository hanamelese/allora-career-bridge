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
  AVAILABILITY_OPTIONS,
  EDUCATION_OPTIONS,
  SECTOR_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  fieldCatalog,
  FIELD_KEYS,
  getField,
} from './fieldCatalog.js';

export {
  supportCatalog,
  SUPPORT_KEYS,
} from './supportCatalog.js';

export {
  workplaceAccommodations,
  WORKPLACE_ACCOMMODATION_KEYS,
  interviewAccommodations,
  INTERVIEW_ACCOMMODATION_KEYS,
} from './accommodationCatalog.js';

export {
  optionCatalogs,
  OPTION_CATALOG_NAMES,
  getCatalogItems,
  getCatalogKeys,
} from './optionCatalogs.js';

export {
  FORM_TEMPLATES,
  LEGACY_FORM_TYPES,
  LOCK_REASONS,
  getTemplate,
  getLockReason,
} from './formTemplates.js';

export {
  FORM_TYPES,
  formTypeSchema,
  IDENTITY_ROUTE_KEYS,
  identityRoutesSchema,
  showIfSchema,
  fieldVisibilitySchema,
  localizedTextSchema,
  builtInOptionSchema,
  formFieldConfigSchema,
  CUSTOM_FIELD_TYPES,
  customFieldSchema,
  formConfigBaseSchema,
  formConfigSchema,
} from './formConfig.js';

export { upgradeLearnerDraft, moveIdentityToEnd } from './formUpgrades.js';

export {
  SOCIAL_PROVIDERS,
  SOCIAL_PROVIDER_KEYS,
  ACCOUNT_MODES,
  getSocialProvider,
  isSignInUrl,
  socialProviderConfigSchema,
  accountSettingsSchema,
  defaultAccountSettings,
} from './socialProviders.js';

export { partnerSignupSchema } from './partnerSignup.js';

export {
  REFERRAL_PHONE_PATTERN,
  MAX_REFERRAL_RECIPIENTS,
  REFERRAL_LINK_PLACEHOLDER,
  referralPartnerSchema,
  referralRequestSchema,
  buildReferralMessage,
} from './referrals.js';

export {
  matchesShowIf,
  isFieldVisible,
} from './fieldVisibility.js';

export {
  buildSubmissionSchema,
  buildProgressSchema,
  getPartnerSafeAnswers,
} from './submissionSchema.js';
