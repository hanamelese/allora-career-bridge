import React from 'react';

export default function ErrorMessage({ id, message }) {
  if (!message) return null;

  return (
    <div
      id={id}
      role="alert"
      className="error-message"
      style={{
        color: 'var(--color-error, #9B1C1C)',
        backgroundColor: 'var(--color-error-bg, #FDF2F2)',
        border: '1px solid var(--color-error, #9B1C1C)',
        borderRadius: 'var(--radius-sm, 4px)',
        padding: 'var(--space-sm, 8px) var(--space-md, 16px)',
        marginTop: 'var(--space-xs, 4px)',
        fontSize: 'var(--font-size-base, 16px)',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm, 8px)'
      }}
    >
      <span aria-hidden="true">⚠️</span>
      <span>{message}</span>
    </div>
  );
}
