import { Navigate, useLocation, useParams } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { getFormByType } from '../api/formsClient.js';
import { getFormTypeByAlias, getFormTypeBySlug } from '../formTypes.js';
import { useAsync } from '../hooks/useAsync.js';
import { Card } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { WorkspaceNav } from '../components/shell/WorkspaceNav.jsx';
import { FormEditor } from './FormEditor.jsx';
import { useT } from '../i18n/index.js';
import './FormWorkspace.css';

/**
 * The workspace for one form: who it is for, what state it is in, and the
 * three steps of the workflow. The selected step renders below through
 * the outlet and receives the loaded form as context.
 */
export function FormWorkspace() {
  const { formSlug } = useParams();
  const location = useLocation();
  const t = useT();
  const formType = getFormTypeBySlug(formSlug);
  const renamedTo = formType ? null : getFormTypeByAlias(formSlug);

  /* Form ids are issued by the server and differ between partners, so the
     form is found by the type this route names. */
  const { status, data: form, error, reload } = useAsync(
    () =>
      formType
        ? getFormByType(formType.id)
        : Promise.reject(new Error('Unknown form')),
    [formType?.id],
  );

  /* A link to a form that was merged into another goes to its new home,
     on the same step. */
  if (renamedTo) {
    const rest = location.pathname.split(`/forms/${formSlug}`)[1] ?? '';
    return <Navigate to={`/forms/${renamedTo.slug}${rest}`} replace />;
  }

  if (!formType) {
    return (
      <ErrorState
        title={t('workspace.unknownForm.title')}
        description={t('workspace.unknownForm.description')}
      />
    );
  }

  const formName = t(`formTypes.${formType.id}.name`);

  return (
    <div className="form-workspace">
      <header className="form-workspace__header">
        <div className="form-workspace__title-row">
          <div>
            <h1 className="form-workspace__title">{formName}</h1>
            <p className="form-workspace__audience">{t(`formTypes.${formType.id}.audience`)}</p>
          </div>
        </div>

        <p className="form-workspace__purpose">{formType.purpose}</p>
      </header>

      <WorkspaceNav formSlug={formType.slug} />

      <div className="form-workspace__panel">
        {status === 'loading' ? (
          <Card as="section" aria-busy="true" aria-label={t('workspace.loadingLabel', formName)}>
            <p className="visually-hidden">{t('workspace.loadingText', formName)}</p>
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
              title={t('workspace.loadError.title')}
              description={
                error?.code === 'form_not_found'
                  ? t('workspace.loadError.notFound')
                  : t('workspace.loadError.generic')
              }
              onRetry={reload}
            />
          </Card>
        ) : null}

        {status === 'success' ? (
          <FormEditor key={form.formId} form={form} formType={formType} />
        ) : null}
      </div>

      {status === 'success' && form.status !== 'published' ? (
        <p className="form-workspace__hint">
          <CircleAlert className="form-workspace__hint-icon" aria-hidden="true" />
          {t('workspace.draftHint')}
        </p>
      ) : null}
    </div>
  );
}
