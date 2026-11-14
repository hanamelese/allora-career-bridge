import { useState } from 'react';
import { Link } from 'react-router-dom';
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
        <Link to="/" className="sign-in__brand">
          <span className="sign-in__product">Partner Dashboard</span>
          <span className="sign-in__tagline">Accessible Onboarding</span>
        </Link>

        <h1 className="sign-in__heading">Sign in</h1>
        <p className="sign-in__intro">
          Sign in with your organisation’s account to see your own forms.
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

        <p className="sign-in__switch">
          New here? <Link to="/signup">Create a partner account</Link>
        </p>
      </div>
    </main>
  );
}
