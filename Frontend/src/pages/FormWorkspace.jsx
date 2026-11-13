import { Outlet, useParams } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { getForm } from '../api/formsClient.js';
import { getFormTypeBySlug } from '../formTypes.js';
import { useAsync } from '../hooks/useAsync.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { WorkspaceNav } from '../components/shell/WorkspaceNav.jsx';
import './FormWorkspace.css';

/**
 * The workspace for one form: who it is for, what state it is in, and the
 * three steps of the workflow. The selected step renders below through
 * the outlet and receives the loaded form as context.
 */
export function FormWorkspace() {
  const { formSlug } = useParams();
  const formType = getFormTypeBySlug(formSlug);
  const formId = formType?.formId ?? null;

  const { status, data: form, error, reload } = useAsync(
    () => (formId ? getForm(formId) : Promise.reject(new Error('Unknown form'))),
    [formId],
  );

  if (!formType) {
    return (
      <ErrorState
        title="That form does not exist"
        description="Choose one of the four forms from the Forms list to continue."
      />
    );
  }

  return (
    <div className="form-workspace">
      <header className="form-workspace__header">
        <div className="form-workspace__title-row">
          <div>
            <h1 className="form-workspace__title">{formType.name}</h1>
            <p className="form-workspace__audience">{formType.audience}</p>
          </div>

          {status === 'success' ? (
            <Badge tone={form.status === 'published' ? 'published' : 'draft'}>
              {form.status === 'published'
                ? `Published · version ${form.currentVersion}`
                : 'Draft · not published yet'}
            </Badge>
          ) : null}
        </div>

        <p className="form-workspace__purpose">{formType.purpose}</p>
      </header>

      <WorkspaceNav formSlug={formType.slug} />

      <div className="form-workspace__panel">
        {status === 'loading' ? (
          <Card as="section" aria-busy="true" aria-label={`Loading ${formType.name}`}>
            <p className="visually-hidden">Loading {formType.name}.</p>
            <div className="stack-md">
              <Skeleton width="14rem" height="1.25rem" />
              <Skeleton height="3rem" />
              <Skeleton height="3rem" />
              <Skeleton width="60%" height="3rem" />
            </div>
          </Card>
        ) : null}

        {status === 'error' ? (
          <Card as="section">
            <ErrorState
              title="This form could not be loaded"
              description={
                error?.code === 'form_not_found'
                  ? 'No saved configuration was found for this form. Reloading will start it from the standard settings.'
                  : 'The dashboard could not read this form. Check your connection and try again.'
              }
              onRetry={reload}
            />
          </Card>
        ) : null}

        {status === 'success' ? <Outlet context={{ form, formType, reload }} /> : null}
      </div>

      {status === 'success' && form.status !== 'published' ? (
        <p className="form-workspace__hint">
          <CircleAlert className="form-workspace__hint-icon" aria-hidden="true" />
          Learners only ever see published versions. Changes stay in the draft until you publish.
        </p>
      ) : null}
    </div>
  );
}
