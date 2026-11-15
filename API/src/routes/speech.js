import { Router } from 'express';
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

/** /api/v1/speech - for signed-in partners, so the dashboard preview speaks as learners hear it. */
export function partnerSpeechRoutes({ speech, limiter }) {
  const router = Router();
  router.post('/', ...speechHandlers({ speech, limiter, keyOf: (request) => `partner|${request.auth.partnerId}` }));
  return router;
}
