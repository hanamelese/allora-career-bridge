import { useEffect, useRef } from 'react';
import { Button } from '../ui/Button.jsx';
import { useT } from '../../i18n/index.js';
import './PublishDialog.css';

/**
 * Confirms a publish, and says plainly what it does.
 *
 * A native <dialog> opened with showModal(), which brings a focus trap,
 * an inert background and Escape handling from the platform rather than
 * from hand-written key handling.
 */
export function PublishDialog({ isOpen, form, isDirty, isPublishing, onConfirm, onClose }) {
  const t = useT();
  const dialogRef = useRef(null);
  const nextVersion = (form.currentVersion ?? 0) + 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  /* Escape fires `cancel`; React state stays the source of truth. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    function handleCancel(event) {
      event.preventDefault();
      onClose();
    }

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  return (
    <dialog className="publish-dialog" ref={dialogRef} aria-labelledby="publish-dialog-title">
      <h2 className="publish-dialog__title" id="publish-dialog-title">
        {t('workspace.publishDialog.title', nextVersion)}
      </h2>

      <div className="publish-dialog__body">
        <p>
          {t('workspace.publishDialog.fixed', nextVersion)}
        </p>

        {isDirty ? (
          <p className="publish-dialog__note">
            {t('workspace.publishDialog.savesFirst', nextVersion)}
          </p>
        ) : null}

        {form.currentVersion ? (
          <p>
            {t('workspace.publishDialog.previousStays', form.currentVersion)}
          </p>
        ) : null}
      </div>

      <div className="publish-dialog__actions">
        <Button variant="secondary" onClick={onClose} disabled={isPublishing}>
          {t('workspace.publishDialog.cancel')}
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isPublishing}>
          {isPublishing ? t('workspace.publishDialog.publishing') : t('workspace.publishDialog.confirm', nextVersion)}
        </Button>
      </div>
    </dialog>
  );
}
