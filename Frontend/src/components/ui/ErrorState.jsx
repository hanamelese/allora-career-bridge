import { AlertTriangle } from 'lucide-react';
import { Button } from './Button.jsx';
import { useT } from '../../i18n/index.js';
import './StateViews.css';

/**
 * Shown when something failed. The message says what went wrong in plain
 * language and offers the way out; role="alert" means a screen reader
 * hears it without having to go looking.
 */
export function ErrorState({ title, description, onRetry, retryLabel }) {
  const t = useT();

  return (
    <div className="state-view" role="alert">
      <span className="state-view__icon state-view__icon--danger" aria-hidden="true">
        <AlertTriangle />
      </span>
      <h3 className="state-view__title">{title ?? t('common.somethingWrong')}</h3>
      {description ? <p className="state-view__description">{description}</p> : null}
      {onRetry ? (
        <div className="state-view__action">
          <Button variant="primary" onClick={onRetry}>
            {retryLabel ?? t('common.tryAgain')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
