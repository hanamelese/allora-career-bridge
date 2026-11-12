import React from 'react';

/**
 * Progress: Shows and announces "Question X of Y" with an accessible progress bar.
 */
export default function Progress({ current = 1, total = 1 }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const label = `Question ${current} of ${total}`;

  return (
    <div className="progress-container" style={{ marginBottom: 'var(--space-md, 16px)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-xs, 4px)',
          fontSize: 'var(--font-size-base, 16px)',
          fontWeight: 600,
          color: 'var(--color-primary, #002B56)'
        }}
      >
        <span>{label}</span>
        <span aria-hidden="true">{percent}%</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Form progress"
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#E2E8F0',
          borderRadius: 'var(--radius-sm, 4px)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: 'var(--color-primary, #002B56)',
            transition: 'width 0.2s ease-in-out'
          }}
        />
      </div>
    </div>
  );
}
