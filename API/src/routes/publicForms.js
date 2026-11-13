import { Router } from 'express';
import { and, eq, desc } from 'drizzle-orm';
import { partnerForms, formVersions, apiKeys } from '../db/schema.js';
import { ApiError } from '../middleware/errors.js';

/**
 * The public form API.
 *
 * This is what the embedded widget reads. It serves published versions
 * only - a draft is never visible to a learner - and it is reached with a
 * public key, which allows nothing beyond reading a published config for
 * that partner's own forms.
 */
export function publicFormRoutes(db) {
  const router = Router();

  router.get('/forms/:formId', (request, response) => {
    const publicKey = request.get('x-public-key') ?? request.query.key;

    if (typeof publicKey !== 'string' || !publicKey) {
      throw new ApiError(401, 'missing_public_key', 'A public key is required.');
    }

    const key = db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.publicKey, publicKey), eq(apiKeys.status, 'active')))
      .get();

    if (!key) {
      throw new ApiError(401, 'invalid_public_key', 'That public key is not valid.');
    }

    const form = db
      .select()
      .from(partnerForms)
      .where(
        and(eq(partnerForms.id, request.params.formId), eq(partnerForms.partnerId, key.partnerId)),
      )
      .get();

    if (!form || form.currentVersion === null) {
      throw new ApiError(404, 'form_not_published', 'That form has not been published.');
    }

    const requested = request.query.version ? Number(request.query.version) : form.currentVersion;

    if (!Number.isInteger(requested)) {
      throw new ApiError(400, 'invalid_version', 'The version must be a whole number.');
    }

    const version = db
      .select()
      .from(formVersions)
      .where(
        and(eq(formVersions.partnerFormId, form.id), eq(formVersions.version, requested)),
      )
      .orderBy(desc(formVersions.version))
      .get();

    if (!version) {
      throw new ApiError(404, 'version_not_found', `Version ${requested} does not exist.`);
    }

    /* A published config never changes, so it is safe to cache hard. */
    response.set('Cache-Control', 'public, max-age=300');

    response.json({
      formId: form.id,
      type: form.type,
      version: version.version,
      publishedAt: version.publishedAt,
      config: version.config,
    });
  });

  return router;
}
