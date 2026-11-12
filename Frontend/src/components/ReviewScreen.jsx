import React from 'react';
import ReadAloudButton from '../readaloud/ReadAloudButton';

export default function ReviewScreen({
  steps = [],
  answers = {},
  onEdit = () => {},
  onSubmit = () => {},
  onBack = () => {}
}) {
  const formatAnswerText = (step, val) => {
    if (val === undefined || val === null || val === '') return 'Not provided';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'None selected';
      return val
        .map((item) => step.options?.find((o) => o.value === item)?.label || item)
        .join(', ');
    }
    if (step.options) {
      const opt = step.options.find((o) => o.value === val);
      if (opt) return opt.label;
    }
    return String(val);
  };

  // Compile full spoken summary for the audio reader
  const fullSummary =
    'Review your answers. ' +
    steps.map((s) => `${s.prompt}: ${formatAnswerText(s, answers[s.id])}.`).join(' ') +
    ' Please check your answers and click Submit.';

  return (
    <div className="review-screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-xl, 24px)',
            color: 'var(--color-primary, #002B56)',
            margin: 0
          }}
        >
          Review your answers
        </h2>

        {/* 🔊 Built-in Audio Reader for Review Screen */}
        <ReadAloudButton text={fullSummary} label="Listen to summary" />
      </div>

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
          const textVal = formatAnswerText(step, val);
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
                  {textVal}
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
