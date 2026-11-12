import React, { useState, useMemo } from 'react';
import VoiceInputController from './VoiceInput';
import { VOICE_CONSENT_TEXT } from './consent';

export default function VoiceButton({
  onTranscript = () => {},
  currentValue = '',
  isMock = false,
  lang = 'en-US'
}) {
  const controller = useMemo(() => new VoiceInputController({ lang, isMock }), [lang, isMock]);
  const [isListening, setIsListening] = useState(false);
  const [isReadingBack, setIsReadingBack] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleMicClick = () => {
    if (controller.requiresConsent()) {
      setShowConsent(true);
      return;
    }

    if (isListening) {
      controller.stop();
      setIsListening(false);
      setStatusMessage('Stopped listening.');
      return;
    }

    setStatusMessage('Listening... Please speak your answer.');
    setIsListening(true);

    controller.listen({
      onStart: () => setIsListening(true),
      onResult: (transcript) => {
        setIsListening(false);
        onTranscript(transcript);
        setStatusMessage(`Understood: "${transcript}". Playing read-back.`);
        setIsReadingBack(true);
        controller.readBack(transcript, () => {
          setIsReadingBack(false);
          setStatusMessage('Read-back finished. You can edit above or click Next.');
        });
      },
      onError: (err) => {
        setIsListening(false);
        setStatusMessage(`Notice: ${err}`);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const handleHearAgain = () => {
    if (!currentValue) return;
    setIsReadingBack(true);
    setStatusMessage(`Reading back: "${currentValue}"`);
    controller.readBack(currentValue, () => {
      setIsReadingBack(false);
    });
  };

  const handleAcceptConsent = () => {
    controller.grantConsent();
    setShowConsent(false);
    handleMicClick();
  };

  const handleDenyConsent = () => {
    controller.denyConsent();
    setShowConsent(false);
    setStatusMessage('Voice typing disabled. You can type with your keyboard.');
  };

  return (
    <div className="voice-control" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={handleMicClick}
        aria-label={isListening ? 'Stop listening' : 'Speak your answer'}
        style={{
          minHeight: 'var(--target-min-size, 48px)',
          minWidth: 'var(--target-min-size, 48px)',
          padding: '8px 16px',
          backgroundColor: isListening ? '#DC2626' : 'var(--color-primary, #002B56)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 'var(--radius-sm, 4px)',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
      >
        <span aria-hidden="true">{isListening ? '🛑' : '🎤'}</span>
        <span>{isListening ? 'Listening...' : 'Speak'}</span>
      </button>

      {currentValue && !isListening && (
        <button
          type="button"
          onClick={handleHearAgain}
          aria-label="Hear what was understood read aloud"
          disabled={isReadingBack}
          style={{
            minHeight: 'var(--target-min-size, 48px)',
            padding: '8px 12px',
            backgroundColor: '#FFFFFF',
            color: 'var(--color-primary, #002B56)',
            border: '2px solid var(--color-primary, #002B56)',
            borderRadius: 'var(--radius-sm, 4px)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isReadingBack ? 'not-allowed' : 'pointer',
            opacity: isReadingBack ? 0.6 : 1
          }}
        >
          <span aria-hidden="true">🔊</span>
          <span>{isReadingBack ? 'Reading...' : 'Read back'}</span>
        </button>
      )}

      {statusMessage && (
        <span role="status" aria-live="polite" style={{ fontSize: '14px', color: 'var(--color-text-muted, #2D3748)' }}>
          {statusMessage}
        </span>
      )}

      {showConsent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 43, 86, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: 'var(--radius-md, 8px)',
              maxWidth: '480px',
              border: '2px solid var(--color-primary, #002B56)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }}
          >
            <h3 id="consent-title" style={{ color: 'var(--color-primary, #002B56)', marginBottom: '12px' }}>
              {VOICE_CONSENT_TEXT.title}
            </h3>
            <p style={{ color: 'var(--color-text-muted, #2D3748)', fontSize: '15px', lineHeight: 1.5, marginBottom: '20px' }}>
              {VOICE_CONSENT_TEXT.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleDenyConsent}
                style={{
                  minHeight: 'var(--target-min-size, 48px)',
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-primary, #002B56)',
                  border: '2px solid var(--color-primary, #002B56)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {VOICE_CONSENT_TEXT.denyBtn}
              </button>
              <button
                type="button"
                onClick={handleAcceptConsent}
                style={{
                  minHeight: 'var(--target-min-size, 48px)',
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-primary, #002B56)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm, 4px)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {VOICE_CONSENT_TEXT.allowBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
