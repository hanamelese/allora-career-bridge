import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { and, eq } from 'drizzle-orm';
import { allowedOrigins, apiKeys } from './db/schema.js';
import { ApiError } from './middleware/errors.js';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { authRoutes } from './routes/auth.js';
import { formRoutes } from './routes/forms.js';
import { publicFormRoutes } from './routes/publicForms.js';
import { organisationRoutes } from './routes/organisation.js';
import { partnerSpeechRoutes } from './routes/speech.js';
import { createRateLimiter } from './referrals.js';
import { createSpeech } from './speech.js';

/**
 * Builds the API.
 *
 * Takes its database so that tests can run the whole thing against an
 * in-memory one, and routes are versioned under /api/v1 so a later release
 * can add /v2 without breaking a partner pinned to this one.
 */
export function createApp(
  db,
  { sms = null, rateLimiter, deliveryLimiter, signupLimiter, speech = createSpeech(), speechLimiter } = {},
) {
  const app = express();

  app.disable('x-powered-by');

  /* The dashboard's own API may only be reached from the origins this
     deployment lists (CORS_ORIGINS). Anything server-to-server has no
     origin and is unaffected. */
  const dashboardCors = cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('This origin is not allowed to call the API.'));
    },
  });

  /* An embedded form's calls come from the partner's own website, so the
     public form routes also accept each partner's registered websites
     (Organisation -> Websites). The public key is read from the address,
     where it is present even on the browser's preflight request. */
  function partnerAllowsOrigin(publicKey, origin) {
    if (typeof publicKey !== 'string' || !publicKey) return false;

    const key = db
      .select({ partnerId: apiKeys.partnerId })
      .from(apiKeys)
      .where(and(eq(apiKeys.publicKey, publicKey), eq(apiKeys.status, 'active')))
      .get();
    if (!key) return false;

    return Boolean(
      db
        .select({ id: allowedOrigins.id })
        .from(allowedOrigins)
        .where(and(eq(allowedOrigins.partnerId, key.partnerId), eq(allowedOrigins.origin, origin)))
        .get(),
    );
  }

  function embedCors(request, response, next) {
    const origin = request.get('origin');
    if (!origin) return next();

    const publicKey = request.query.key ?? request.get('x-public-key');
    const allowed = config.corsOrigins.includes(origin) || partnerAllowsOrigin(publicKey, origin);

    response.vary('Origin');

    if (!allowed) {
      if (request.method === 'OPTIONS') return response.status(403).end();
      throw new ApiError(
        403,
        'origin_not_allowed',
        `${origin} is not on this organisation’s list of websites allowed to show its forms. Add it in Allora Accessibility Bridge under Your organisation → Websites.`,
      );
    }

    response.set('Access-Control-Allow-Origin', origin);

    if (request.method === 'OPTIONS') {
      response.set('Access-Control-Allow-Methods', 'GET, POST');
      response.set('Access-Control-Allow-Headers', 'Content-Type, X-Public-Key');
      response.set('Access-Control-Max-Age', '600');
      return response.status(204).end();
    }

    return next();
  }

  app.use((request, response, next) =>
    request.path.startsWith('/api/v1/public/forms/')
      ? embedCors(request, response, next)
      : dashboardCors(request, response, next),
  );

  /* The embeddable widget: one script, versioned in its path, loaded by
     partners' websites with a plain <script> tag. Built by
     `npm run build -w widget`. */
  const widgetDir = fileURLToPath(new URL('../../widget/dist', import.meta.url));

  app.use(
    '/widget/v1',
    (request, response, next) => {
      /* Any site may load the script itself; what it can then do is
         limited by the public API's checks above. */
      response.set('Cross-Origin-Resource-Policy', 'cross-origin');
      response.set('Access-Control-Allow-Origin', '*');
      next();
    },
    /* Revalidated on every load (a quick 304 when unchanged), so a rebuilt
       widget reaches every site at once instead of up to an hour later. The
       version in the path is what pins its behaviour. */
    express.static(widgetDir, {
      index: false,
      setHeaders(response) {
        response.set('Cache-Control', 'no-cache');
      },
    }),
    (request, response) => {
      response.status(404).json({
        error: existsSync(widgetDir) ? 'not_found' : 'widget_not_built',
        message: existsSync(widgetDir)
          ? `No widget file at ${request.originalUrl}.`
          : 'The widget has not been built on this server. Run `npm run build -w widget`.',
      });
    },
  );

  /* A form configuration is small; a request far larger than one is not
     something this API has any use for. */
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/v1/health', (request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/v1/auth', authRoutes(db, signupLimiter ? { signupLimiter } : {}));
  app.use('/api/v1/forms', requireAuth, formRoutes(db, { sms }));
  app.use('/api/v1/organisation', requireAuth, organisationRoutes(db));
  app.use(
    '/api/v1/speech',
    partnerSpeechRoutes({ speech, limiter: speechLimiter ?? createRateLimiter({ limit: 240, windowMs: 60_000 }) }),
  );
  app.use(
    '/api/v1/public',
    publicFormRoutes(db, { sms, rateLimiter, deliveryLimiter, speech, ...(speechLimiter ? { speechLimiter } : {}) }),
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
