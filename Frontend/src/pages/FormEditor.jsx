import { Outlet } from 'react-router-dom';
import { useFormConfig } from '../hooks/useFormConfig.js';

/**
 * Owns the draft configuration for the form currently open.
 *
 * It sits above the workflow views so that edits survive moving between
 * Configure, Preview and Publish, and so the preview can render the same
 * configuration the partner is editing.
 *
 * The caller gives this component a key tied to the loaded form, so a
 * different form arrives as a fresh mount rather than needing an effect to
 * reset the state.
 */
export function FormEditor({ form, formType, reload }) {
  const configState = useFormConfig(form.draftConfig);

  return <Outlet context={{ form, formType, reload, configState }} />;
}
