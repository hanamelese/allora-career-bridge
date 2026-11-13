import { useState } from 'react';
import { Check, CloudUpload, Save } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { PublishDialog } from './PublishDialog.jsx';
import './WorkspaceActions.css';

/**
 * Save and publish, always in reach.
 *
 * A partner edits in one view and publishes from another, so this bar
 * stays across all three. It also carries the fact they most need: whether
 * what they are looking at has been saved.
 */
function formatSavedAt(value) {
  if (!value) return 'Not saved yet';

  return `Saved ${new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}`;
}

export function WorkspaceActions({ form, isDirty, isValid, actions }) {
  const [isConfirming, setIsConfirming] = useState(false);

  async function confirmPublish() {
    const published = await actions.publish();

    if (published) {
      setIsConfirming(false);
    }
  }

  return (
    <div className="workspace-actions">
      <div className="workspace-actions__row">
        <div className="workspace-actions__state">
          <Badge tone={form.status === 'published' ? 'published' : 'draft'}>
            {form.status === 'published' ? `Published · version ${form.currentVersion}` : 'Draft'}
          </Badge>

          {isDirty ? (
            <Badge tone="draft">Unsaved changes</Badge>
          ) : (
            <span className="workspace-actions__saved">
              <Check className="workspace-actions__saved-icon" aria-hidden="true" />
              {formatSavedAt(form.updatedAt)}
            </span>
          )}
        </div>

        <div className="workspace-actions__buttons">
          <Button
            variant="secondary"
            icon={Save}
            disabled={!isDirty || !isValid || actions.isSaving}
            onClick={actions.save}
          >
            {actions.isSaving ? 'Saving…' : 'Save draft'}
          </Button>

          <Button
            variant="primary"
            icon={CloudUpload}
            disabled={!actions.canPublish}
            onClick={() => setIsConfirming(true)}
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Outcomes are announced politely rather than interrupting. */}
      <p className="workspace-actions__status" role="status">
        {actions.lastAction ?? ''}
      </p>

      {actions.actionError ? (
        <p className="workspace-actions__error" role="alert">
          {actions.actionError}
        </p>
      ) : null}

      {!isValid ? (
        <p className="workspace-actions__blocked">
          Some settings need attention before this form can be saved or published. The Configure
          view explains what.
        </p>
      ) : null}

      <PublishDialog
        isOpen={isConfirming}
        form={form}
        isDirty={isDirty}
        isPublishing={actions.isPublishing}
        onConfirm={confirmPublish}
        onClose={() => setIsConfirming(false)}
      />
    </div>
  );
}
