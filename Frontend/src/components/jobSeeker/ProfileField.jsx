import React, { useEffect, useRef } from 'react';
import { Mic, Square, Volume2, Delete, RotateCcw } from 'lucide-react';

function AutoGrowTextarea({ value, onChange, inputRef, ...props }) {
  const internalRef = useRef(null);
  const resolvedRef = inputRef || internalRef;

  useEffect(() => {
    const el = resolvedRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 140)}px`;
  }, [value, resolvedRef]);

  return (
    <textarea
      ref={resolvedRef}
      value={value}
      onChange={onChange}
      style={{ resize: 'none', minHeight: '140px', overflowY: 'hidden' }}
      {...props}
    />
  );
}

const currentValCheck = (val) => Boolean(val && String(val).length > 0);

export function ProfileField({
  label,
  field,
  type = 'text',
  placeholder,
  help,
  required = false,
  multiline = false,
  inputRef,
  profile,
  updateField,
  recordingField,
  startVoiceInput,
  stopVoiceInput,
  handleBackspaceField,
  handleClearField,
  speak,
  darkMode,
}) {
  const isThisFieldRecording = recordingField === field;
  const currentValue = profile[field] || '';

  // Palette-driven styles for field utility buttons
  const fieldBtnStyle = {
    background: darkMode ? '#092328' : '#ffffff',
    color: darkMode ? '#f8fafc' : '#0f172a',
    borderColor: darkMode ? '#2a835f' : '#cbd5e1',
  };

  return (
    <div
      className="mb-4 p-4 rounded-4 border shadow-sm field-box transition-all"
      style={{
        background: darkMode ? '#12544f' : '#ffffff',
        borderColor: isThisFieldRecording ? '#dc2626' : darkMode ? '#2a835f' : '#e2e8f0',
        color: darkMode ? '#f8fafc' : '#0f172a',
      }}
    >
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <label htmlFor={`profile-${field}`} className="form-label fw-bold mb-0 fs-4 text-break">
          {label}
          {required && (
            <span className="text-danger ms-1" aria-label="required">
              *
            </span>
          )}
        </label>

        <button
          type="button"
          className={`btn fw-bold px-4 py-3 d-flex align-items-center gap-2 fs-5 shadow-sm transition-all ${
            isThisFieldRecording ? 'btn-danger' : 'btn-primary'
          }`}
          onClick={() => (isThisFieldRecording ? stopVoiceInput() : startVoiceInput(field, label))}
          aria-pressed={isThisFieldRecording}
        >
          {isThisFieldRecording ? (
            <>
              <Square size={22} aria-hidden="true" />
              <span>Stop Speaking</span>
            </>
          ) : (
            <>
              <Mic size={22} aria-hidden="true" />
              <span>Speak {label}</span>
            </>
          )}
        </button>
      </div>

      {isThisFieldRecording && (
        <div className="alert alert-warning py-3 px-3 mb-3 fw-bold fs-5 d-flex align-items-center gap-3 border-2 border-warning rounded-3" role="status">
          <span className="spinner-grow spinner-grow-sm text-danger" style={{ width: '1.5rem', height: '1.5rem' }} />
          <span>Microphone active: Speak your {label} now, then click "Stop Speaking".</span>
        </div>
      )}

      {multiline ? (
        <AutoGrowTextarea
          inputRef={inputRef}
          id={`profile-${field}`}
          className="form-control form-control-lg profile-input fs-4 py-3 rounded-3 shadow-none"
          value={currentValue}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
          aria-describedby={help ? `help-${field}` : undefined}
          style={{
            background: darkMode ? '#092328' : '#ffffff',
            color: darkMode ? '#f8fafc' : '#0f172a',
            borderColor: darkMode ? '#2a835f' : '#64748b',
          }}
        />
      ) : (
        <input
          ref={inputRef}
          id={`profile-${field}`}
          type={type}
          className="form-control form-control-lg profile-input fs-4 py-3 rounded-3 shadow-none"
          value={currentValue}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
          required={required}
          aria-describedby={help ? `help-${field}` : undefined}
          style={{
            background: darkMode ? '#092328' : '#ffffff',
            color: darkMode ? '#f8fafc' : '#0f172a',
            borderColor: darkMode ? '#2a835f' : '#64748b',
          }}
        />
      )}

      <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top" style={{ borderColor: darkMode ? '#2a835f' : '#e2e8f0' }}>
        <button
          type="button"
          className="btn fw-bold fs-5 px-3 py-2 d-flex align-items-center gap-1 shadow-sm"
          style={fieldBtnStyle}
          onClick={() => speak(currentValue ? `${label} currently contains: ${currentValue}` : `${label} is currently empty.`)}
        >
          <Volume2 size={20} />
          <span>Read Back</span>
        </button>

        <button
          type="button"
          className="btn fw-bold fs-5 px-3 py-2 d-flex align-items-center gap-1 shadow-sm"
          style={fieldBtnStyle}
          onClick={() => handleBackspaceField(field, label)}
          disabled={!currentValCheck(currentValue)}
        >
          <Delete size={20} />
          <span>Backspace</span>
        </button>

        <button
          type="button"
          className="btn btn-outline-danger fw-bold fs-5 px-3 py-2 d-flex align-items-center gap-1 shadow-sm"
          onClick={() => handleClearField(field, label)}
          disabled={!currentValCheck(currentValue)}
        >
          <RotateCcw size={20} />
          <span>Clear Box</span>
        </button>
      </div>

      {help && (
        <div id={`help-${field}`} className={`form-text mt-2 fs-5 fw-semibold ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
          {help}
        </div>
      )}
    </div>
  );
}