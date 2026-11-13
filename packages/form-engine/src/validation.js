
/**
 * Form Validation
 *
 * Uses the shared contracts package to validate answers.
 * Keeps validation rules separate from the user interface.
 */

import {
  buildSubmissionSchema,
  buildProgressSchema,
} from '../../contracts/src/submissionSchema.js';

function formatErrorMessage(issue) {
  switch (issue.code) {
    case 'invalid_type':
      return 'Please enter a valid answer.';

    case 'too_small':
      return 'Please provide an answer.';

    case 'invalid_value':
      return 'Please select one of the available options.';

    case 'unrecognized_keys':
      return 'This form contains an unsupported answer.';

    default:
      return issue.message || 'Please check your answer.';
  }
}

function formatValidationErrors(error) {
  const errors = {};

  for (const issue of error.issues) {
    const fieldKey = issue.path[0] ?? 'form';

    if (!errors[fieldKey]) {
      errors[fieldKey] = formatErrorMessage(issue);
    }
  }

  return errors;
}

export function validateSubmission(config, answers) {
  const schema = buildSubmissionSchema(config);
  const result = schema.safeParse(answers);

  if (result.success) {
    return {
      valid: true,
      data: result.data,
      errors: {},
    };
  }

  return {
    valid: false,
    data: null,
    errors: formatValidationErrors(result.error),
  };
}

export function validateProgress(config, answers) {
  const schema = buildProgressSchema(config);
  const result = schema.safeParse(answers);

  if (result.success) {
    return {
      valid: true,
      data: result.data,
      errors: {},
    };
  }

  return {
    valid: false,
    data: null,
    errors: formatValidationErrors(result.error),
  };
}
