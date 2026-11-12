import React, { useState } from 'react';
import ErrorMessage from './ErrorMessage';
import VoiceButton from '../voice/VoiceButton';
import { matchSpokenChoice } from '../voice/choiceMatch';

export default function ChoiceField({
  step = {},
  value = '',
  error,
  onChange = () => {},
  onNext = () => {},
  voice
}) {
  const id = step.id || 'choice-field';
  const legendId = `legend-${id}`;
  const errorId = `error-${id}`;
  const options = step.options || [];
  const [matchStatus, setMatchStatus] = useState('');

  const isVoiceEnabled = voice && (voice === true || voice.enabled);

  const handleVoiceTranscript = (spokenText) => {
    const { matchedOption } = matchSpokenChoice(spokenText, options);

    if (matchedOption) {
      onChange(matchedOption.value);
      setMatchStatus(`Matched and selected: "${matchedOption.label}"`);
    } else {
      setMatchStatus(`Could not find a match for "${spokenText}". Please tap your choice or try speaking again.`);
    }
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
        {step.prompt || 'Choose an option'}
        {step.validate?.required && (
          <span aria-hidden="true" style={{ color: 'var(--color-error, #9B1C1C)', marginLeft: '4px' }}>*</span>
        )}
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

      {isVoiceEnabled && (
        <div style={{ marginBottom: '16px' }}>
          <VoiceButton
            onTranscript={handleVoiceTranscript}
            currentValue={options.find((o) => o.value === value)?.label || ''}
            isMock={voice?.isMock}
            lang={voice?.lang || 'en-US'}
          />
          {matchStatus && (
            <p
              role="status"
              aria-live="polite"
              style={{
                fontSize: '14px',
                marginTop: '8px',
                color: 'var(--color-primary, #002B56)',
                fontWeight: 500
              }}
            >
              {matchStatus}
            </p>
          )}
        </div>
      )}

      <div
        role="radiogroup"
        aria-labelledby={legendId}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm, 8px)' }}
      >
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md, 16px)',
                minHeight: 'var(--target-min-size, 48px)',
                padding: 'var(--space-sm, 8px) var(--space-md, 16px)',
                border: isSelected
                  ? '2px solid var(--color-primary, #002B56)'
                  : '2px solid var(--color-border, #4A5568)',
                borderRadius: 'var(--radius-sm, 4px)',
                backgroundColor: isSelected ? '#EFF6FF' : 'var(--color-bg, #FFFFFF)',
                cursor: 'pointer',
                fontWeight: isSelected ? 600 : 400
              }}
            >
              <input
                type="radio"
                name={id}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: 'var(--color-primary, #002B56)',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: 'var(--font-size-base, 16px)', color: 'var(--color-text, #002B56)' }}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>

      <ErrorMessage id={errorId} message={error} />
    </fieldset>
  );
}
