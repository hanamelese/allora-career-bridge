import { useState } from 'react';
import { useAuth } from '../auth/authContext.js';
import { Button } from '../components/ui/Button.jsx';
import { TextInput } from '../components/ui/TextInput.jsx';
import './SignInPage.css';

/**
 * Signing in.
 *
 * The dashboard holds a partner's own form configurations, so it is behind
 * a sign-in. A real <form> so that Enter submits and password managers
 * behave as a person expects.
 */
export function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSigningIn(true);

    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (signInError) {
      setError(signInError.message);
      setIsSigningIn(false);
    }
  }

  return (
    <main className="sign-in" id="main-content">
      <div className="sign-in__card">
        <div className="sign-in__brand">
          <p className="sign-in__product">Partner Dashboard</p>
          <p className="sign-in__tagline">Accessible Onboarding</p>
        </div>

        <h1 className="sign-in__heading">Sign in</h1>
        <p className="sign-in__intro">
          Use the account your organisation was given, so we can show you your own forms.
        </p>

        <form className="sign-in__form" onSubmit={handleSubmit}>
          <TextInput
            id="sign-in-email"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="username"
            required
          />

          <TextInput
            id="sign-in-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />

          {error ? (
            <p className="sign-in__error" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="primary" disabled={isSigningIn}>
            {isSigningIn ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  );
}
