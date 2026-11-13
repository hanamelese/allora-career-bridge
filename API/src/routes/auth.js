import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { partnerUsers, partners } from '../db/schema.js';
import { verifyPassword } from '../db/keys.js';
import { signToken } from '../middleware/auth.js';

export function authRoutes(db) {
  const router = Router();

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

    return response.json({
      token: signToken({ userId: user.id, partnerId: user.partnerId, role: user.role }),
      partner: { id: partner.id, name: partner.name },
      user: { email: user.email, role: user.role },
    });
  });

  return router;
}
