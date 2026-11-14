import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

/**
 * A popup dialog.
 *
 * A native <dialog> opened with showModal(), so the platform supplies the
 * focus trap, the inert page behind it and Escape. On opening, focus goes
 * to the dialog itself, so a screen reader announces its name before
 * anything inside it; on closing, focus goes back to whatever opened it.
 *
 * It scrolls inside itself, so at 200% zoom or on a small phone nothing
 * is cut off and the page behind never scrolls instead.
 */
export function Modal({ isOpen, onClose, label, closeLabel = 'Close', children, className = '' }) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      dialog.focus();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
      const opener = openerRef.current;
      if (opener && document.contains(opener)) opener.focus();
    }
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

  /* Closing when the page behind is clicked - only a click that both
     starts and ends on the backdrop, so selecting text inside never does. */
  function handleBackdrop(event) {
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${className}`.trim()}
      aria-label={label}
      tabIndex={-1}
      onClick={handleBackdrop}
    >
      <div className="modal__panel">
        <button type="button" className="modal__close" onClick={onClose}>
          <X aria-hidden="true" />
          <span className="visually-hidden">{closeLabel}</span>
        </button>
        {isOpen ? children : null}
      </div>
    </dialog>
  );
}
