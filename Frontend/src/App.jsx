import React, { useState, useRef } from 'react';
import TextField from './components/TextField';
import ChoiceField from './components/ChoiceField';
import IconChips from './components/IconChips';
import ReviewScreen from './components/ReviewScreen';
import Progress from './shell/Progress';
import LiveRegion from './shell/LiveRegion';
import { useStepFocus } from './shell/FocusManager';
import { useTranslation } from './i18n/i18n';
import ReadAloudButton from './readaloud/ReadAloudButton';

export default function App() {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ name: '', idRoute: '', needs: [] });
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [useMockVoice, setUseMockVoice] = useState(false);
  const headingRef = useRef(null);

  const STEPS = [
    {
      id: 'name',
      type: 'text',
      prompt: t('q.name'),
      help: t('h.name'),
      voice: true,
      validate: { required: true, minLen: 2 },
      autocomplete: 'name'
    },
    {
      id: 'idRoute',
      type: 'choice',
      prompt: t('q.idRoute'),
      help: t('h.idRoute'),
      voice: true,
      validate: { required: true },
      options: [
        { value: 'national', label: t('o.national') },
        { value: 'refugee', label: t('o.refugee') },
        { value: 'other', label: t('o.other') },
        { value: 'refer', label: t('o.refer') }
      ]
    },
    {
      id: 'needs',
      type: 'chips',
      prompt: t('q.needs'),
      help: t('h.needs'),
      options: [
        { value: 'more_time', label: t('a.more_time'), icon: '⏱️' },
        { value: 'screen_reader', label: t('a.screen_reader'), icon: '🎧' },
        { value: 'step_free', label: t('a.step_free'), icon: '♿' },
        { value: 'interpreter', label: t('a.interpreter'), icon: '👋' }
      ]
    }
  ];

  const isReview = stepIndex === STEPS.length;
  const currentStep = !isReview ? STEPS[stepIndex] : null;

  useStepFocus(isReview ? 'review' : currentStep?.id, headingRef);

  const handleNext = () => {
    if (!currentStep) return;
    const currentVal = answers[currentStep.id];

    if (currentStep.validate?.required) {
      if (!currentVal || (typeof currentVal === 'string' && currentVal.trim().length === 0)) {
        setError(t('e.required'));
        return;
      }
    }
    setError('');
    setStepIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleJumpToStep = (stepId) => {
    const targetIdx = STEPS.findIndex((s) => s.id === stepId);
    if (targetIdx !== -1) {
      setError('');
      setStepIndex(targetIdx);
    }
  };

  const announcement = isReview
    ? t('q.review')
    : `Question ${stepIndex + 1} of ${STEPS.length}: ${currentStep?.prompt}`;

  return (
    <main style={{ maxWidth: '640px', margin: '40px auto', padding: '24px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-xl)' }}>
          Person B: Accessible Interface
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Microphone (Speak) and Speaker (Read Aloud) on every screen
        </p>

        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <input
            type="checkbox"
            checked={useMockVoice}
            onChange={(e) => setUseMockVoice(e.target.checked)}
          />
          <span>Enable Mock Voice (simulates speaking without mic)</span>
        </label>
      </header>

      <LiveRegion message={announcement} />

      {!isReview && (
        <Progress current={stepIndex + 1} total={STEPS.length} />
      )}

      <section
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '24px'
        }}
      >
        {!isReview ? (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <h2
                ref={headingRef}
                data-question-heading
                style={{
                  fontSize: 'var(--font-size-lg)',
                  color: 'var(--color-primary)',
                  margin: 0,
                  outline: 'none'
                }}
              >
                {currentStep.prompt}
              </h2>

              <ReadAloudButton
                text={`${currentStep.prompt}. ${currentStep.help || ''}`}
                label="Listen"
              />
            </div>

            {currentStep.type === 'text' && (
              <TextField
                step={currentStep}
                value={answers[currentStep.id] || ''}
                error={error}
                onChange={(val) => {
                  setAnswers((prev) => ({ ...prev, [currentStep.id]: val }));
                  if (error) setError('');
                }}
                onNext={handleNext}
                voice={{ enabled: true, isMock: useMockVoice }}
              />
            )}

            {currentStep.type === 'choice' && (
              <ChoiceField
                step={currentStep}
                value={answers[currentStep.id] || ''}
                error={error}
                onChange={(val) => {
                  setAnswers((prev) => ({ ...prev, [currentStep.id]: val }));
                  if (error) setError('');
                }}
                onNext={handleNext}
                voice={{ enabled: true, isMock: useMockVoice }}
              />
            )}

            {currentStep.type === 'chips' && (
              <IconChips
                step={currentStep}
                value={answers[currentStep.id] || []}
                error={error}
                onChange={(val) => {
                  setAnswers((prev) => ({ ...prev, [currentStep.id]: val }));
                  if (error) setError('');
                }}
                voice={{ enabled: true, isMock: useMockVoice }}
              />
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    minHeight: 'var(--target-min-size, 48px)',
                    padding: '12px 24px',
                    border: '2px solid var(--color-primary)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {t('btn.back')}
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                style={{
                  minHeight: 'var(--target-min-size, 48px)',
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t('btn.next')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <ReviewScreen
              steps={STEPS}
              answers={answers}
              onEdit={handleJumpToStep}
              onBack={handleBack}
              onSubmit={() => setIsSubmitted(true)}
            />

            {isSubmitted && (
              <div
                role="status"
                style={{
                  marginTop: '16px',
                  color: '#065F46',
                  backgroundColor: '#D1FAE5',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600
                }}
              >
                {t('status.success')}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
