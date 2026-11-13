import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { authRoutes } from './routes/auth.js';
import { formRoutes } from './routes/forms.js';
import { publicFormRoutes } from './routes/publicForms.js';

/**
 * Builds the API.
 *
 * Takes its database so that tests can run the whole thing against an
 * in-memory one, and routes are versioned under /api/v1 so a later release
 * can add /v2 without breaking a partner pinned to this one.
 */
export function createApp(db) {
  const app = express();

  app.disable('x-powered-by');

  /* A browser may only reach this API from an origin the partner has
     registered. Anything server-to-server has no origin and is unaffected. */
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('This origin is not allowed to call the API.'));
      },
    }),
  );

  /* A form configuration is small; a request far larger than one is not
     something this API has any use for. */
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/v1/health', (request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/v1/auth', authRoutes(db));
  app.use('/api/v1/forms', requireAuth, formRoutes(db));
  app.use('/api/v1/public', publicFormRoutes(db));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
