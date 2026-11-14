/**
 * Form Validation
 *
 * Uses the shared contracts package to check answers, then turns what it
 * finds into a message a learner can act on, in their own language.
 *
 * Messages are chosen from the issue's code and the field's type - never by
 * matching on English text - so adding a language means adding a column
 * here rather than keeping prose in step across two packages.
 */

import {
  buildSubmissionSchema,
  buildProgressSchema,
} from '@onboarding/contracts/submissionSchema.js';
import { fieldCatalog } from '@onboarding/contracts/fieldCatalog.js';

/* Each message says what to do, not what went wrong. */
const MESSAGES = {
  required: {
    en: 'Please answer this question before moving on.',
    am: 'ከመቀጠልዎ በፊት እባክዎ ይህን ጥያቄ ይመልሱ።',
  },
  chooseOne: {
    en: 'Choose at least one option from the list.',
    am: 'ከዝርዝሩ ውስጥ ቢያንስ አንዱን ይምረጡ።',
  },
  chooseFromList: {
    en: 'Choose one of the options shown.',
    am: 'ከቀረቡት አማራጮች ውስጥ አንዱን ይምረጡ።',
  },
  consent: {
    en: 'Tick the box to give your permission before moving on.',
    am: 'ከመቀጠልዎ በፊት ፈቃድዎን ለመስጠት ሳጥኑን ምልክት ያድርጉ።',
  },
  email: {
    en: 'Write an email address with an @ in it, like name@example.com',
    am: 'የ@ ምልክት ያለው የኢሜይል አድራሻ ይጻፉ፤ ለምሳሌ name@example.com',
  },
  url: {
    en: 'Write a web address that starts with https://',
    am: 'በhttps:// የሚጀምር የድረ ገጽ አድራሻ ይጻፉ።',
  },
  phone: {
    en: 'Write a phone number using digits only, for example 0911234567',
    am: 'የስልክ ቁጥሩን በቁጥሮች ብቻ ይጻፉ፤ ለምሳሌ 0911234567',
  },
  nameTooShort: {
    en: 'Write your full name. It needs at least 2 letters.',
    am: 'ሙሉ ስምዎን ይጻፉ። ቢያንስ 2 ፊደላት ያስፈልጋሉ።',
  },
  tooShort: {
    en: 'This answer is too short. Please add a little more.',
    am: 'ይህ መልስ በጣም አጭር ነው። እባክዎ ትንሽ ይጨምሩ።',
  },
  tooLong: {
    en: 'This answer is too long. Please shorten it.',
    am: 'ይህ መልስ በጣም ረጅም ነው። እባክዎ ያሳጥሩት።',
  },
  fileTooBig: {
    en: (p) => `This file is ${p.size}. Choose a file of ${p.maxSizeMb} MB or less.`,
    am: (p) => `ይህ ፋይል ${p.size} ነው። ${p.maxSizeMb} MB ወይም ከዚያ በታች የሆነ ፋይል ይምረጡ።`,
  },
  fileWrongType: {
    en: (p) => `This kind of file cannot be used. Choose a ${p.allowed} file.`,
    am: (p) => `ይህ ዓይነት ፋይል መጠቀም አይቻልም። ${p.allowed} ፋይል ይምረጡ።`,
  },
  fileEmpty: {
    en: 'This file is empty. Choose another file.',
    am: 'ይህ ፋይል ባዶ ነው። ሌላ ፋይል ይምረጡ።',
  },
  chooseFile: {
    en: 'Choose a file before moving on.',
    am: 'ከመቀጠልዎ በፊት ፋይል ይምረጡ።',
  },
  unexpected: {
    en: 'This answer could not be read. Please try answering again.',
    am: 'ይህ መልስ ሊነበብ አልቻለም። እባክዎ እንደገና ይመልሱ።',
  },
};

function say(name, language, params) {
  const message = MESSAGES[name][language] ?? MESSAGES[name].en;
  return typeof message === 'function' ? message(params) : message;
}

/** The type of the field an issue is about, built-in or custom. */
function getFieldType(config, fieldKey) {
  const definition = fieldCatalog[fieldKey];
  if (definition) return definition.type;

  const custom = (config.customFields ?? []).find((field) => field.key === fieldKey);
  return custom?.type ?? null;
}

function formatIssue(issue, config, language) {
  const fieldKey = issue.path[0];
  const type = getFieldType(config, fieldKey);

  switch (issue.code) {
    case 'invalid_format':
      if (issue.format === 'email') return say('email', language);
      if (issue.format === 'url') return say('url', language);
      if (type === 'phone') return say('phone', language);
      return say('unexpected', language);

    case 'too_small':
      return say(fieldKey === 'name' ? 'nameTooShort' : 'tooShort', language);

    case 'too_big':
      return say('tooLong', language);

    case 'invalid_value':
      return say('chooseFromList', language);

    case 'invalid_type':
      return say(type === 'consent' ? 'consent' : 'unexpected', language);

    /* The shared schema raises `custom` for the rules it adds itself: a
       required answer that is missing, a consent that is not given, and an
       empty multi-choice. The field's type says which of those it is. */
    case 'custom':
      if (issue.params?.fileProblem === 'tooBig') return say('fileTooBig', language, issue.params);
      if (issue.params?.fileProblem === 'wrongType') return say('fileWrongType', language, issue.params);
      if (issue.params?.fileProblem === 'empty') return say('fileEmpty', language);
      if (type === 'file') return say('chooseFile', language);
      if (type === 'consent') return say('consent', language);
      if (type === 'multiChoice') return say('chooseOne', language);
      if (type === 'choice' || type === 'identityRoute') {
        return say('chooseFromList', language);
      }
      return say('required', language);

    default:
      return say('unexpected', language);
  }
}

function formatValidationErrors(error, config, language) {
  const errors = {};

  for (const issue of error.issues) {
    const fieldKey = issue.path[0] ?? 'form';

    if (!errors[fieldKey]) {
      errors[fieldKey] = formatIssue(issue, config, language);
    }
  }

  return errors;
}

function run(schema, config, answers, language) {
  const result = schema.safeParse(answers);

  if (result.success) {
    return { valid: true, data: result.data, errors: {} };
  }

  return {
    valid: false,
    data: null,
    errors: formatValidationErrors(result.error, config, language),
  };
}

export function validateSubmission(config, answers, language = 'en') {
  return run(buildSubmissionSchema(config), config, answers, language);
}

export function validateProgress(config, answers, language = 'en') {
  return run(buildProgressSchema(config), config, answers, language);
}

/**
 * Check a single answer, which is what a one-question-per-screen flow needs
 * before it lets the learner move on.
 */
export function validateAnswer(config, fieldKey, answers, language = 'en') {
  const result = validateProgress(config, answers, language);
  const required = (config.fields ?? [])
    .concat(config.customFields ?? [])
    .find((field) => field.key === fieldKey)?.required;

  if (result.errors[fieldKey]) {
    return result.errors[fieldKey];
  }

  /* The progress schema tolerates a missing answer on purpose; a single
     screen still has to ask for a required one before moving on. */
  if (required) {
    const value = answers[fieldKey];
    /* Spaces alone are no answer, whether typed or heard. */
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0) ||
      (getFieldType(config, fieldKey) === 'consent' && value !== true);

    if (isEmpty) {
      const type = getFieldType(config, fieldKey);
      if (type === 'consent') return say('consent', language);
      if (type === 'multiChoice') return say('chooseOne', language);
      if (type === 'file') return say('chooseFile', language);
      if (fieldKey === 'name') return say('nameTooShort', language);
      return say('required', language);
    }
  }

  return null;
}
