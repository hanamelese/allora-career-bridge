/**
 * Error handling.
 *
 * Responses carry a machine-readable code and a message a person can act
 * on. Nothing from a form's draft or a learner's answer is ever logged or
 * echoed back in an error.
 */

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFound(request, response) {
  response.status(404).json({
    error: 'not_found',
    message: `No endpoint at ${request.method} ${request.path}.`,
  });
}

// eslint-disable-next-line no-unused-vars -- Express needs all four parameters.
export function errorHandler(error, request, response, next) {
  if (error instanceof ApiError) {
    return response.status(error.status).json({
      error: error.code,
      message: error.message,
    });
  }

  console.error(`[api] ${request.method} ${request.path} failed:`, error.message);

  return response.status(500).json({
    error: 'server_error',
    message: 'Something went wrong on our side. Please try again.',
  });
}
