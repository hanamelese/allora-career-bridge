import React, { useState } from 'react';
import ErrorMessage from './ErrorMessage';
import VoiceButton from '../voice/VoiceButton';
import { matchSpokenChoice } from '../voice/choiceMatch';

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
  const [matchStatus, setMatchStatus] = useState('');

  const isVoiceEnabled = voice && (voice === true || voice.enabled);

  const handleToggle = (optValue) => {
    const isAlreadySelected = selected.includes(optValue);
    const nextSelected = isAlreadySelected
      ? selected.filter((v) => v !== optValue)
      : [...selected, optValue];
    onChange(nextSelected);
  };

  const handleVoiceTranscript = (spokenText) => {
    const { matchedOption } = matchSpokenChoice(spokenText, options);

    if (matchedOption) {
      handleToggle(matchedOption.value);
      const willBeSelected = !selected.includes(matchedOption.value);
      const action = willBeSelected ? 'Selected' : 'Unselected';
      setMatchStatus(`${action}: "${matchedOption.label}"`);
    } else {
      setMatchStatus(`Could not find a match for "${spokenText}". Please tap a chip or try speaking again.`);
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
      {/* Screen-reader accessible legend without duplicate visual text */}
      <legend
        id={legendId}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0
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

      {isVoiceEnabled && (
        <div style={{ marginBottom: '16px' }}>
          <VoiceButton
            onTranscript={handleVoiceTranscript}
            currentValue={selected
              .map((val) => options.find((o) => o.value === val)?.label)
              .filter(Boolean)
              .join(', ')}
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
