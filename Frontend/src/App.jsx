import React, { useState, useRef } from 'react';
import TextField from './components/TextField';
import Progress from './shell/Progress';
import LiveRegion from './shell/LiveRegion';
import { useStepFocus } from './shell/FocusManager';

const STEPS = [
  {
    id: 'name',
    prompt: 'What is your name?',
    help: 'Use the name you want us to call you.',
    validate: { required: true, minLen: 2 },
    autocomplete: 'name'
  },
  {
    id: 'contact',
    prompt: 'What is your phone number or email?',
    help: 'We will use this to send you account updates.',
    validate: { required: true, minLen: 3 },
    autocomplete: 'tel'
  }
];

export default function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ name: '', contact: '' });
  const [error, setError] = useState('');
  const headingRef = useRef(null);

  const currentStep = STEPS[stepIndex];
  const currentValue = answers[currentStep.id] || '';

  // B4: Automatically move focus to heading on step change
  useStepFocus(currentStep.id, headingRef);

  const handleNext = () => {
    if (!currentValue || currentValue.trim().length < (currentStep.validate.minLen || 1)) {
      setError('Please provide a valid answer before moving to the next step.');
      return;
    }
    setError('');
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      alert(`All questions answered! Name: ${answers.name}, Contact: ${answers.contact}`);
    }
  };

  const handleBack = () => {
    setError('');
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const announcement = `Question ${stepIndex + 1} of ${STEPS.length}: ${currentStep.prompt}`;

  return (
    <main style={{ maxWidth: '600px', margin: '40px auto', padding: '24px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-xl)' }}>
          Person B: Task B4 Test Bench
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Testing Progress, LiveRegion, and FocusManager
        </p>
      </header>

      {/* Screen reader live announcement */}
      <LiveRegion message={announcement} />

      {/* Accessible visual progress indicator */}
      <Progress current={stepIndex + 1} total={STEPS.length} />

      <section
        aria-label="Current question"
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '24px'
        }}
      >
        {/* Step question heading with ref for programmatic focus */}
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

        <TextField
          step={currentStep}
          value={currentValue}
          error={error}
          onChange={(newVal) => {
            setAnswers((prev) => ({ ...prev, [currentStep.id]: newVal }));
            if (error) setError('');
          }}
          onNext={handleNext}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              style={{
                backgroundColor: '#FFFFFF',
                color: 'var(--color-primary)',
                border: '2px solid var(--color-primary)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 24px',
                fontSize: 'var(--font-size-base)',
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
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 24px',
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </section>
    </main>
  );
}
