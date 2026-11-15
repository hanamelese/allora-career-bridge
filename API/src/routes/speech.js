import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { z } from 'zod';
import { ApiError } from '../middleware/errors.js';
import { validateBody } from '../middleware/validate.js';

/**
 * Read-aloud audio for a form's own text (see ../speech.js).
 *
 * POST, so the text is never part of a URL or an access log. The answer is
 * MP3; on any failure the form uses the browser's own voice instead.
 */
export const speechRequestSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  lang: z.enum(['en', 'am']).default('en'),
  /* A learner's own answer: spoken, never cached. */
  private: z.boolean().default(false),
});

/** The handler steps shared by the public and the dashboard route. */
export function speechHandlers({ speech, limiter, keyOf, authorise = () => {} }) {
  return [
    validateBody(speechRequestSchema, 'Nothing to read aloud.'),
    async (request, response) => {
      authorise(request);

      if (!limiter(keyOf(request))) {
        throw new ApiError(429, 'rate_limited', 'Too much was read aloud from here. Wait a minute and try again.');
      }

      let audio;
      try {
        audio = await speech(request.validated.text, request.validated.lang, {
          cache: !request.validated.private,
        });
      } catch {
        throw new ApiError(502, 'speech_unavailable', 'Reading aloud is not available right now.');
      }

      response.set({
        'Content-Type': 'audio/mpeg',
        'Cache-Control': request.validated.private ? 'no-store' : 'private, max-age=86400',
      });
      response.send(audio);
    },
  ];
}

/**
 * /api/v1/speech - for the dashboard: its preview, and its own Sign up /
 * Sign in form, where nobody is signed in yet. A signed-in partner is
 * limited per partner; a signed-out request must come from one of the
 * dashboard's own addresses (CORS_ORIGINS) and is limited per address, so
 * this is not a free speech service for anyone else.
 */
export function partnerSpeechRoutes({ speech, limiter }) {
  const router = Router();
  router.post(
    '/',
    ...speechHandlers({
      speech,
      limiter,
      keyOf: (request) => request.speechKey,
      authorise(request) {
        const [scheme, token] = (request.get('authorization') ?? '').split(' ');
        if (scheme === 'Bearer' && token) {
          try {
            request.speechKey = `partner|${jwt.verify(token, config.jwtSecret).partnerId}`;
            return;
          } catch {
            /* An expired session: treated as signed out below. */
          }
        }
        const origin = request.get('origin');
        if (!origin || !config.corsOrigins.includes(origin)) {
          throw new ApiError(401, 'not_signed_in', 'Sign in to continue.');
        }
        request.speechKey = `dashboard|${request.ip}`;
      },
    }),
  );
  return router;
}
