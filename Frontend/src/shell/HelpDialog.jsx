import React, { useRef, useEffect, useState } from 'react';
import supportFlow from '../flows/support-request.json';
import IconChips from '../components/IconChips';
import TextField from '../components/TextField';
import ReadAloudButton from '../readaloud/ReadAloudButton';

export default function HelpDialog({ isOpen = false, onClose = () => {} }) {
  const dialogRef = useRef(null);
  const [supportAnswers, setSupportAnswers] = useState({ support_needs: [], support_note: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  const needsStep = supportFlow.steps.find((s) => s.id === 'support_needs');
  const noteStep = supportFlow.steps.find((s) => s.id === 'support_note');

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="help-dialog-title"
      style={{
        maxWidth: '560px',
        width: '90%',
        margin: 'auto',
        padding: '28px',
        border: '2px solid var(--color-primary, #002B56)',
        borderRadius: 'var(--radius-md, 8px)',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 12px 32px rgba(0, 43, 86, 0.25)'
      }}
    >
      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 id="help-dialog-title" style={{ fontSize: 'var(--font-size-xl, 24px)', color: 'var(--color-primary, #002B56)', margin: 0 }}>
              {supportFlow.title}
            </h2>
            <ReadAloudButton text={`${supportFlow.title}. ${supportFlow.description}`} label="Listen" />
          </div>

          <p style={{ color: 'var(--color-text-muted, #2D3748)', fontSize: '15px', marginBottom: '20px', lineHeight: 1.5 }}>
            {supportFlow.description}
          </p>

          {needsStep && (
            <IconChips
              step={needsStep}
              value={supportAnswers.support_needs}
              onChange={(val) => setSupportAnswers((prev) => ({ ...prev, support_needs: val }))}
              voice={{ enabled: true }}
            />
          )}

          {noteStep && (
            <TextField
              step={noteStep}
              value={supportAnswers.support_note}
              onChange={(val) => setSupportAnswers((prev) => ({ ...prev, support_note: val }))}
              voice={{ enabled: true }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                minHeight: 'var(--target-min-size, 48px)',
                padding: '12px 20px',
                backgroundColor: '#FFFFFF',
                color: 'var(--color-primary, #002B56)',
                border: '2px solid var(--color-primary, #002B56)',
                borderRadius: 'var(--radius-sm, 4px)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close (Esc)
            </button>

            <button
              type="submit"
              style={{
                minHeight: 'var(--target-min-size, 48px)',
                padding: '12px 24px',
                backgroundColor: 'var(--color-primary, #002B56)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-sm, 4px)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Send Support Request
            </button>
          </div>
        </form>
      ) : (
        <div>
          <h2 style={{ color: '#065F46', marginBottom: '12px' }}>
            ✅ Support Request Sent
          </h2>
          <p style={{ color: 'var(--color-text, #002B56)', lineHeight: 1.5, marginBottom: '20px' }}>
            Your request has been saved privately. A support advisor will review your requested accommodations.
          </p>
          <button
            type="button"
            onClick={handleClose}
            style={{
              minHeight: 'var(--target-min-size, 48px)',
              padding: '12px 24px',
              backgroundColor: 'var(--color-primary, #002B56)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm, 4px)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Return to Form
          </button>
        </div>
      )}
    </dialog>
  );
}
