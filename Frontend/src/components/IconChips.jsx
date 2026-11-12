import React from 'react';
import ErrorMessage from './ErrorMessage';

export default function IconChips({
  step = {},
  value = [],
  error,
  onChange = () => {},
  voice
}) {
  const id = step.id || 'chips-field';
  const legendId = `legend-${id}`;
  const errorId = `error-${id}`;
  const options = step.options || [];
  const selected = Array.isArray(value) ? value : [];

  const handleToggle = (optValue) => {
    const isAlreadySelected = selected.includes(optValue);
    const nextSelected = isAlreadySelected
      ? selected.filter((v) => v !== optValue)
      : [...selected, optValue];
    onChange(nextSelected);
  };

  return (
    <fieldset
      style={{
        border: 'none',
        padding: 0,
        margin: '0 0 var(--space-lg, 24px) 0'
      }}
      aria-describedby={error ? errorId : undefined}
    >
      <legend
        id={legendId}
        style={{
          display: 'block',
          fontSize: 'var(--font-size-lg, 20px)',
          fontWeight: 600,
          color: 'var(--color-primary, #002B56)',
          marginBottom: 'var(--space-sm, 8px)'
        }}
      >
        {step.prompt || 'Select any support you need'}
      </legend>

      {step.help && (
        <p
          style={{
            fontSize: 'var(--font-size-base, 16px)',
            color: 'var(--color-text-muted, #2D3748)',
            marginBottom: 'var(--space-md, 16px)'
          }}
        >
          {step.help}
        </p>
      )}

      <div
        role="group"
        aria-labelledby={legendId}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-sm, 8px)'
        }}
      >
        {options.map((opt) => {
          const isChecked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-sm, 8px)',
                minHeight: 'var(--target-min-size, 48px)',
                padding: 'var(--space-sm, 8px) var(--space-md, 16px)',
                borderRadius: '24px',
                border: isChecked
                  ? '2px solid var(--color-primary, #002B56)'
                  : '2px solid var(--color-border, #4A5568)',
                backgroundColor: isChecked ? '#EFF6FF' : 'var(--color-bg, #FFFFFF)',
                color: 'var(--color-primary, #002B56)',
                cursor: 'pointer',
                fontWeight: isChecked ? 600 : 400
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(opt.value)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--color-primary, #002B56)',
                  cursor: 'pointer'
                }}
              />
              {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
              <span style={{ fontSize: 'var(--font-size-base, 16px)' }}>{opt.label}</span>
            </label>
          );
        })}
      </div>

      <ErrorMessage id={errorId} message={error} />
    </fieldset>
  );
}
