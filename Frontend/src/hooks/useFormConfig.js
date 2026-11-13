import { useCallback, useMemo, useState } from 'react';
import { formConfigSchema } from '@onboarding/contracts';

/**
 * Holds the draft configuration a partner is editing and validates it
 * against the shared schema on every change.
 *
 * Validating with the same `formConfigSchema` the server will use means
 * the dashboard cannot produce a configuration the API would reject, and
 * the partner finds out at the control they just touched rather than on
 * save.
 */

/** Merge a patch, treating `undefined` as "remove this setting". */
function applyPatch(target, patch) {
  const next = { ...target };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }

  return next;
}

/**
 * Turn Zod issues into something the interface can place: a message per
 * config path, a message per field key, and the rest as form-level errors.
 */
function collectErrors(config, issues) {
  const byPath = {};
  const byField = {};
  const general = [];

  for (const issue of issues) {
    const path = issue.path.join('.');

    if (!byPath[path]) {
      byPath[path] = issue.message;
    }

    const [root, index] = issue.path;
    const isFieldIssue =
      (root === 'fields' || root === 'customFields') && typeof index === 'number';

    if (isFieldIssue) {
      const list = root === 'fields' ? config.fields : config.customFields;
      const key = list?.[index]?.key;

      if (key && !byField[key]) {
        byField[key] = issue.message;
      }
    } else {
      general.push({ path, message: issue.message });
    }
  }

  return { byPath, byField, general };
}

export function useFormConfig(initialConfig) {
  const [config, setConfig] = useState(initialConfig);
  /* What the server currently holds. Saving moves this forward, which is
     how "unsaved changes" stops being true. */
  const [savedConfig, setSavedConfig] = useState(initialConfig);

  const validation = useMemo(() => {
    const result = formConfigSchema.safeParse(config);

    if (result.success) {
      return { isValid: true, byPath: {}, byField: {}, general: [] };
    }

    return { isValid: false, ...collectErrors(config, result.error.issues) };
  }, [config]);

  const updateConfig = useCallback((patch) => {
    setConfig((current) => applyPatch(current, patch));
  }, []);

  const updateFeature = useCallback((name, enabled) => {
    setConfig((current) => ({
      ...current,
      features: { ...current.features, [name]: enabled },
    }));
  }, []);

  const updateField = useCallback((key, patch) => {
    setConfig((current) => ({
      ...current,
      fields: current.fields.map((field) =>
        field.key === key ? applyPatch(field, patch) : field,
      ),
    }));
  }, []);

  const addCustomField = useCallback((field) => {
    setConfig((current) => ({
      ...current,
      customFields: [...current.customFields, field],
    }));
  }, []);

  const updateCustomField = useCallback((key, patch) => {
    setConfig((current) => ({
      ...current,
      customFields: current.customFields.map((field) =>
        field.key === key ? applyPatch(field, patch) : field,
      ),
    }));
  }, []);

  const removeCustomField = useCallback((key) => {
    setConfig((current) => ({
      ...current,
      customFields: current.customFields.filter((field) => field.key !== key),
    }));
  }, []);

  const reset = useCallback(() => {
    setConfig(savedConfig);
  }, [savedConfig]);

  /** Accept what the server stored as the new starting point. */
  const markSaved = useCallback((stored) => {
    setSavedConfig(stored);
    setConfig(stored);
  }, []);

  return {
    config,
    isDirty: config !== savedConfig,
    isValid: validation.isValid,
    errors: validation.byPath,
    fieldErrors: validation.byField,
    generalErrors: validation.general,
    updateConfig,
    updateFeature,
    updateField,
    addCustomField,
    updateCustomField,
    removeCustomField,
    reset,
    markSaved,
  };
}
