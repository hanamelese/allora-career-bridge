import React from 'react';
import ErrorMessage from './ErrorMessage';
import VoiceButton from '../voice/VoiceButton';

export default function TextField({
  step = {},
  value = '',
  error,
  onChange = () => {},
  onNext = () => {},
  voice
}) {
  const id = step.id || 'field';
  const inputId = `input-${id}`;
  const errorId = `error-${id}`;
  const helpId = `help-${id}`;

  const describedBy = [
    error ? errorId : null,
    step.help ? helpId : null
  ].filter(Boolean).join(' ') || undefined;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onNext();
    }
  };

  const isVoiceEnabled = voice && (voice === true || voice.enabled);

  return (
    <div className="field-group" style={{ marginBottom: 'var(--space-lg, 24px)' }}>
      <label
        htmlFor={inputId}
        style={{
          display: 'block',
          fontSize: 'var(--font-size-lg, 20px)',
          fontWeight: 600,
          marginBottom: 'var(--space-sm, 8px)',
          color: 'var(--color-text, #002B56)'
        }}
      >
        {step.prompt || 'Question'}
        {step.validate?.required && (
          <span aria-hidden="true" style={{ color: 'var(--color-error, #9B1C1C)', marginLeft: '4px' }}>*</span>
        )}
      </label>

      {step.help && (
        <p
          id={helpId}
          style={{
            fontSize: 'var(--font-size-base, 16px)',
            color: 'var(--color-text-muted, #2D3748)',
            marginBottom: 'var(--space-sm, 8px)'
          }}
        >
          {step.help}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm, 8px)', flexWrap: 'wrap' }}>
        <input
          id={inputId}
          name={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          autoComplete={step.autocomplete || 'off'}
          inputMode={step.inputmode || 'text'}
          style={{
            flex: 1,
            minWidth: '240px',
            minHeight: 'var(--target-min-size, 48px)',
            fontSize: 'var(--font-size-base, 16px)',
            padding: 'var(--space-sm, 8px) var(--space-md, 16px)',
            border: error ? '2px solid var(--color-error, #9B1C1C)' : '2px solid var(--color-border, #4A5568)',
            borderRadius: 'var(--radius-sm, 4px)',
            backgroundColor: 'var(--color-bg, #FFFFFF)',
            color: 'var(--color-text, #002B56)'
          }}
        />

        {isVoiceEnabled && (
          <VoiceButton
            onTranscript={(spokenText) => onChange(spokenText)}
            currentValue={value}
            isMock={voice?.isMock}
            lang={voice?.lang || 'en-US'}
          />
        )}
      </div>

      <ErrorMessage id={errorId} message={error} />
    </div>
  );
}
