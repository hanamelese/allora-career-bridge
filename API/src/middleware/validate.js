import { ApiError } from './errors.js';

/**
 * Validates a request body with a shared Zod schema.
 *
 * The dashboard checks a configuration with the very same schema before it
 * is sent, so this is a second line rather than the first - which is the
 * point: the server never trusts that the check already happened.
 */
export function validateBody(schema) {
  return (request, response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      return response.status(422).json({
        error: 'invalid_request',
        message: 'This form configuration was rejected.',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    request.validated = result.data;
    return next();
  };
}

export { ApiError };
