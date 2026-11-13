import { Router } from 'express';
import { and, eq, asc } from 'drizzle-orm';
import { formConfigSchema } from '@onboarding/contracts';
import { partnerForms, formVersions, apiKeys } from '../db/schema.js';
import { newId } from '../db/keys.js';
import { validateBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errors.js';

/**
 * The dashboard API.
 *
 * Every read and write is filtered by the signed-in partner, so a form id
 * from another partner is simply not found rather than forbidden.
 */
export function formRoutes(db) {
  const router = Router();

  /** Find one of this partner's forms, or fail cleanly. */
  function findForm(partnerId, formId) {
    const form = db
      .select()
      .from(partnerForms)
      .where(and(eq(partnerForms.id, formId), eq(partnerForms.partnerId, partnerId)))
      .get();

    if (!form) {
      throw new ApiError(404, 'form_not_found', 'That form does not exist.');
    }

    return form;
  }

  function versionsFor(formId) {
    return db
      .select()
      .from(formVersions)
      .where(eq(formVersions.partnerFormId, formId))
      .orderBy(asc(formVersions.version))
      .all();
  }

  /* The shape the dashboard works with. The partner's public key travels
     with it because the embed tag needs it; the secret key never does. */
  function present(form, versions, publicKey) {
    return {
      formId: form.id,
      type: form.type,
      status: form.status,
      currentVersion: form.currentVersion,
      updatedAt: form.updatedAt,
      publishedAt: form.publishedAt,
      draftConfig: form.draftConfig,
      publicKey: publicKey ?? null,
      versions: versions.map((version) => ({
        version: version.version,
        publishedAt: version.publishedAt,
        config: version.config,
      })),
    };
  }

  function publicKeyFor(partnerId) {
    const key = db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.partnerId, partnerId), eq(apiKeys.status, 'active')))
      .get();

    return key?.publicKey ?? null;
  }

  router.get('/', (request, response) => {
    const forms = db
      .select()
      .from(partnerForms)
      .where(eq(partnerForms.partnerId, request.auth.partnerId))
      .all();

    response.json(
      forms.map((form) => ({
        formId: form.id,
        type: form.type,
        status: form.status,
        currentVersion: form.currentVersion,
        updatedAt: form.updatedAt,
        publishedAt: form.publishedAt,
        fieldCount: (form.draftConfig.fields ?? []).filter((field) => field.enabled).length,
        versionCount: versionsFor(form.id).length,
      })),
    );
  });

  router.get('/:id', (request, response) => {
    const form = findForm(request.auth.partnerId, request.params.id);

    response.json(
      present(form, versionsFor(form.id), publicKeyFor(request.auth.partnerId)),
    );
  });

  router.put('/:id/draft', validateBody(formConfigSchema), (request, response) => {
    const form = findForm(request.auth.partnerId, request.params.id);
    const config = request.validated;

    /* A draft cannot be made to describe a different form. */
    if (config.formId !== form.id) {
      throw new ApiError(
        422,
        'form_id_mismatch',
        'This configuration belongs to a different form.',
      );
    }

    if (config.type !== form.type) {
      throw new ApiError(422, 'form_type_mismatch', 'A form cannot change its type.');
    }

    const updatedAt = new Date().toISOString();

    db.update(partnerForms)
      .set({ draftConfig: config, updatedAt })
      .where(eq(partnerForms.id, form.id))
      .run();

    response.json(
      present(
        { ...form, draftConfig: config, updatedAt },
        versionsFor(form.id),
        publicKeyFor(request.auth.partnerId),
      ),
    );
  });

  /**
   * Publishing takes a copy of the draft and freezes it as a new version.
   *
   * It only ever inserts. An existing version row is never touched, which
   * is what lets a partner's website pin a version and keep working after
   * the partner edits their draft again.
   */
  router.post('/:id/publish', (request, response) => {
    const form = findForm(request.auth.partnerId, request.params.id);

    /* The draft is checked again on the way out. A version that would not
       validate must never become the one learners are served. */
    const parsed = formConfigSchema.safeParse(form.draftConfig);

    if (!parsed.success) {
      throw new ApiError(
        422,
        'draft_invalid',
        'This draft cannot be published until its settings are valid.',
      );
    }

    const version = (form.currentVersion ?? 0) + 1;
    const publishedAt = new Date().toISOString();

    const frozen = { ...parsed.data, version: String(version) };

    db.transaction((tx) => {
      tx.insert(formVersions)
        .values({
          id: newId('ver'),
          partnerFormId: form.id,
          version,
          config: frozen,
          publishedAt,
        })
        .run();

      tx.update(partnerForms)
        .set({ currentVersion: version, status: 'published', publishedAt })
        .where(eq(partnerForms.id, form.id))
        .run();
    });

    response.status(201).json(
      present(
        { ...form, currentVersion: version, status: 'published', publishedAt },
        versionsFor(form.id),
        publicKeyFor(request.auth.partnerId),
      ),
    );
  });

  router.get('/:id/versions', (request, response) => {
    const form = findForm(request.auth.partnerId, request.params.id);

    response.json(
      versionsFor(form.id).map((version) => ({
        version: version.version,
        publishedAt: version.publishedAt,
        config: version.config,
      })),
    );
  });

  return router;
}
