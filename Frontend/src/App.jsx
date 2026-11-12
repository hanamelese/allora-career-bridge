import React, { useState } from 'react';
import TextField from './components/TextField';

export default function App() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const sampleStep = {
    id: 'name',
    prompt: 'What is your name?',
    help: 'Use the name you want us to call you.',
    validate: { required: true, minLen: 2 },
    autocomplete: 'name'
  };

  const handleNext = () => {
    if (!value || value.trim().length < 2) {
      setError('Please enter at least 2 letters.');
      setSubmitted(false);
    } else {
      setError('');
      setSubmitted(true);
    }
  };

  return (
    <main style={{ maxWidth: '600px', margin: '40px auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-xl)' }}>
          Person B: Accessibility & UI Test Bench
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Testing Task B3: TextField and ErrorMessage
        </p>
      </header>

      <section aria-label="Question form" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
        <TextField
          step={sampleStep}
          value={value}
          error={error}
          onChange={(newVal) => {
            setValue(newVal);
            if (error) setError('');
          }}
          onNext={handleNext}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
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
            Next
          </button>

          <button
            type="button"
            onClick={() => setError('Please enter at least 2 letters.')}
            style={{
              backgroundColor: '#FFFFFF',
              color: 'var(--color-error)',
              border: '2px solid var(--color-error)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 24px',
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Trigger fake error
          </button>
        </div>

        {submitted && (
          <p
            role="status"
            style={{
              marginTop: '16px',
              color: '#065F46',
              backgroundColor: '#D1FAE5',
              padding: '12px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            Success! Answer recorded: "{value}"
          </p>
        )}
      </section>
    </main>
  );
}
