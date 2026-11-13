import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { publish as publishForm, saveDraft } from '../api/formsClient.js';
import { useFormConfig } from '../hooks/useFormConfig.js';
import { WorkspaceActions } from '../components/forms/WorkspaceActions.jsx';

/**
 * Owns the draft configuration for the form currently open, and the two
 * things a partner does with it: save it, and publish it.
 *
 * It sits above the workflow views so edits survive moving between
 * Configure, Preview and Publish, and so the preview renders the same
 * configuration being edited.
 *
 * The loaded form is held in state here rather than re-fetched after every
 * save, because each save and publish returns the updated form.
 */
export function FormEditor({ form: loadedForm, formType }) {
  const [form, setForm] = useState(loadedForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  const configState = useFormConfig(form.draftConfig);
  const { config, isDirty, isValid, markSaved } = configState;

  const save = useCallback(async () => {
    setActionError(null);
    setIsSaving(true);

    try {
      const updated = await saveDraft(form.formId, config);
      setForm(updated);
      markSaved(updated.draftConfig);
      setLastAction('Draft saved.');
      return updated;
    } catch (error) {
      setActionError(error.message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [form.formId, config, markSaved]);

  /**
   * Publishing freezes whatever the server holds, so an unsaved change is
   * saved first - otherwise a partner would publish a version that is not
   * the one they are looking at.
   */
  const publish = useCallback(async () => {
    setActionError(null);
    setIsPublishing(true);

    try {
      if (isDirty) {
        const saved = await saveDraft(form.formId, config);
        setForm(saved);
        markSaved(saved.draftConfig);
      }

      const published = await publishForm(form.formId);
      setForm(published);
      markSaved(published.draftConfig);
      setLastAction(`Version ${published.currentVersion} published.`);
      return published;
    } catch (error) {
      setActionError(error.message);
      return null;
    } finally {
      setIsPublishing(false);
    }
  }, [form.formId, config, isDirty, markSaved]);

  const actions = {
    save,
    publish,
    isSaving,
    isPublishing,
    actionError,
    lastAction,
    canPublish: isValid && !isSaving && !isPublishing,
  };

  return (
    <>
      <WorkspaceActions form={form} isDirty={isDirty} isValid={isValid} actions={actions} />
      <Outlet context={{ form, formType, configState, actions }} />
    </>
  );
}
