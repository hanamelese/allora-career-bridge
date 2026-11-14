// packages/contracts/src/partnerSignup.js
//
// A partner organisation creating its own dashboard account.

import { z } from 'zod';

export const partnerSignupSchema = z
  .object({
    organisationName: z
      .string()
      .trim()
      .min(2, 'Enter your organisation’s name.')
      .max(150, 'Use 150 characters or fewer.'),
    email: z.string().trim().toLowerCase().email('Enter an email address, like name@example.org.').max(200),
    password: z
      .string()
      .min(10, 'Use at least 10 characters for your password.')
      .max(200, 'Use 200 characters or fewer.'),
  })
  .strict();
