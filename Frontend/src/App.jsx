import React, { useState, useRef } from 'react';
import TextField from './components/TextField';
import ChoiceField from './components/ChoiceField';
import IconChips from './components/IconChips';
import ReviewScreen from './components/ReviewScreen';
import Progress from './shell/Progress';
import LiveRegion from './shell/LiveRegion';
import { useStepFocus } from './shell/FocusManager';

const STEPS = [
  {
    id: 'name',
    type: 'text',
    prompt: 'What is your name?',
    help: 'Use the name you want us to call you.',
    validate: { required: true, minLen: 2 },
    autocomplete: 'name'
  },
  {
    id: 'idRoute',
    type: 'choice',
    prompt: 'Which form of ID do you have?',
    help: 'No branch will block you. If you have none, choose "Refer me".',
    validate: { required: true },
    options: [
      { value: 'national', label: 'National ID or Passport' },
      { value: 'refugee', label: 'Refugee ID' },
      { value: 'other', label: 'Other document' },
      { value: 'refer', label: 'I have none / Refer me through partner' }
    ]
  },
  {
    id: 'needs',
    type: 'chips',
    prompt: 'What accommodations or support do you need?',
    help: 'This stays private on your device.',
    options: [
      { value: 'more_time', label: 'More time', icon: '⏱️' },
      { value: 'screen_reader', label: 'Screen-reader tools', icon: '🎧' },
      { value: 'step_free', label: 'Step-free access', icon: '♿' },
      { value: 'interpreter', label: 'Sign language interpreter', icon: '👋' }
    ]
  }
];

export default function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ name: '', idRoute: '', needs: [] });
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const headingRef = useRef(null);

  const isReview = stepIndex === STEPS.length;
  const currentStep = !isReview ? STEPS[stepIndex] : null;

  useStepFocus(isReview ? 'review' : currentStep?.id, headingRef);

  const handleNext = () => {
    if (!currentStep) return;
    const currentVal = answers[currentStep.id];

    if (currentStep.validate?.required) {
      if (!currentVal || (typeof currentVal === 'string' && currentVal.trim().length === 0)) {
        setError('Please choose or enter an answer to continue.');
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
    ? 'Review screen. Check your answers before submitting.'
    : `Question ${stepIndex + 1} of ${STEPS.length}: ${currentStep?.prompt}`;

  return (
    <main style={{ maxWidth: '640px', margin: '40px auto', padding: '24px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-xl)' }}>
          Person B: Task B5 Test Bench
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Testing ChoiceField, IconChips, and ReviewScreen
        </p>
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
            <h2
              ref={headingRef}
              data-question-heading
              style={{
                fontSize: 'var(--font-size-lg)',
                color: 'var(--color-primary)',
                marginBottom: '16px',
                outline: 'none'
              }}
            >
              {currentStep.prompt}
            </h2>

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
                  Back
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
                Next
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
                🎉 Registration Submitted Successfully!
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
