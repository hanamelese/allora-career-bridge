import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * Dashboard routes require a signed-in partner user.
 *
 * The token carries the partner id, and every query downstream is scoped
 * by it - which is what keeps one partner out of another's forms.
 */
export function requireAuth(request, response, next) {
  const header = request.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({
      error: 'not_signed_in',
      message: 'Sign in to continue.',
    });
  }

  try {
    const claims = jwt.verify(token, config.jwtSecret);

    request.auth = {
      partnerId: claims.partnerId,
      userId: claims.sub,
      role: claims.role,
    };

    return next();
  } catch {
    return response.status(401).json({
      error: 'session_expired',
      message: 'Your session has ended. Sign in again to continue.',
    });
  }
}

export function signToken({ userId, partnerId, role }) {
  return jwt.sign({ partnerId, role }, config.jwtSecret, {
    subject: userId,
    expiresIn: config.tokenLifetime,
  });
}
