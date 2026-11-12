import React from 'react';

export default function ReviewScreen({
  steps = [],
  answers = {},
  onEdit = () => {},
  onSubmit = () => {},
  onBack = () => {}
}) {
  const formatAnswer = (step, val) => {
    if (val === undefined || val === null || val === '') {
      return <span style={{ color: 'var(--color-text-muted, #718096)', fontStyle: 'italic' }}>Not provided</span>;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return <span style={{ color: 'var(--color-text-muted, #718096)', fontStyle: 'italic' }}>None selected</span>;
      }
      const labels = val.map((item) => {
        const opt = step.options?.find((o) => o.value === item);
        return opt ? opt.label : item;
      });
      return labels.join(', ');
    }
    if (step.options) {
      const opt = step.options.find((o) => o.value === val);
      if (opt) return opt.label;
    }
    return String(val);
  };

  return (
    <div className="review-screen">
      <h2
        style={{
          fontSize: 'var(--font-size-xl, 24px)',
          color: 'var(--color-primary, #002B56)',
          marginBottom: 'var(--space-sm, 8px)'
        }}
      >
        Review your answers
      </h2>
      <p
        style={{
          fontSize: 'var(--font-size-base, 16px)',
          color: 'var(--color-text-muted, #2D3748)',
          marginBottom: 'var(--space-lg, 24px)'
        }}
      >
        Please check your answers before submitting. You can edit any answer.
      </p>

      <dl
        style={{
          border: '1px solid var(--color-border, #CBD5E0)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: 'var(--space-md, 16px)',
          marginBottom: 'var(--space-lg, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md, 16px)'
        }}
      >
        {steps.map((step) => {
          const val = answers[step.id];
          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 'var(--space-sm, 8px)',
                borderBottom: '1px solid #EDF2F7'
              }}
            >
              <div style={{ flex: 1, paddingRight: 'var(--space-md, 16px)' }}>
                <dt
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-primary, #002B56)',
                    fontSize: 'var(--font-size-base, 16px)'
                  }}
                >
                  {step.prompt}
                </dt>
                <dd
                  style={{
                    margin: 'var(--space-xs, 4px) 0 0 0',
                    fontSize: 'var(--font-size-base, 16px)',
                    color: 'var(--color-text, #002B56)'
                  }}
                >
                  {formatAnswer(step, val)}
                </dd>
              </div>

              <button
                type="button"
                onClick={() => onEdit(step.id)}
                aria-label={`Edit answer for ${step.prompt}`}
                style={{
                  minHeight: 'var(--target-min-size, 48px)',
                  minWidth: 'var(--target-min-size, 48px)',
                  padding: '8px 16px',
                  border: '2px solid var(--color-primary, #002B56)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-primary, #002B56)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
            </div>
          );
        })}
      </dl>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            minHeight: 'var(--target-min-size, 48px)',
            padding: '12px 24px',
            border: '2px solid var(--color-primary, #002B56)',
            backgroundColor: '#FFFFFF',
            color: 'var(--color-primary, #002B56)',
            borderRadius: 'var(--radius-sm, 4px)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Back
        </button>

        <button
          type="button"
          onClick={onSubmit}
          style={{
            minHeight: 'var(--target-min-size, 48px)',
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'var(--color-primary, #002B56)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-sm, 4px)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Submit Registration
        </button>
      </div>
    </div>
  );
}
