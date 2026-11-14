import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { partnerSignupSchema } from '@onboarding/contracts';
import { partnerUsers, partners } from '../db/schema.js';
import { verifyPassword } from '../db/keys.js';
import { createPartnerAccount } from '../db/partners.js';
import { signToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createRateLimiter } from '../referrals.js';

/** What a signed-in dashboard needs, after either signing in or signing up. */
function session(user, partner) {
  return {
    token: signToken({ userId: user.id, partnerId: user.partnerId, role: user.role }),
    partner: { id: partner.id, name: partner.name },
    user: { email: user.email, role: user.role },
  };
}

export function authRoutes(db, { signupLimiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 }) } = {}) {
  const router = Router();

  /**
   * A partner organisation creating its own account. It gets one draft of
   * every form and its own key pair, and is signed in straight away.
   */
  router.post(
    '/signup',
    validateBody(partnerSignupSchema, 'Some details need fixing before the account can be created.'),
    (request, response) => {
      if (!signupLimiter(request.ip ?? 'unknown')) {
        return response.status(429).json({
          error: 'rate_limited',
          message: 'Too many accounts were created from here. Please try again in an hour.',
        });
      }

      const { organisationName, email, password } = request.validated;

      const taken = db.select({ id: partnerUsers.id }).from(partnerUsers).where(eq(partnerUsers.email, email)).get();

      if (taken) {
        return response.status(409).json({
          error: 'email_taken',
          message: 'An account already uses that email address. Sign in instead, or use another address.',
        });
      }

      const { partnerId, userId } = createPartnerAccount(db, {
        partnerName: organisationName,
        email,
        password,
      });

      return response.status(201).json(
        session(
          { id: userId, partnerId, email, role: 'owner' },
          { id: partnerId, name: organisationName },
        ),
      );
    },
  );

  router.post('/login', (request, response) => {
    const { email, password } = request.body ?? {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      return response.status(400).json({
        error: 'invalid_request',
        message: 'Enter your email address and password.',
      });
    }

    const user = db
      .select()
      .from(partnerUsers)
      .where(eq(partnerUsers.email, email.trim().toLowerCase()))
      .get();

    /* The same answer whether the address is unknown or the password is
       wrong, so this cannot be used to discover who has an account. */
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return response.status(401).json({
        error: 'sign_in_failed',
        message: 'That email address and password do not match.',
      });
    }

    const partner = db.select().from(partners).where(eq(partners.id, user.partnerId)).get();

    return response.json(session(user, partner));
  });

  return router;
}
