import { Link, useNavigate } from 'react-router-dom';
import { PartnerAuthForm } from '../auth/PartnerAuthForm.jsx';
import './SignInPage.css';

/**
 * Signing in or creating a partner account, on a page of its own.
 *
 * The landing page opens the same form in a popup; this page is for a
 * bookmarked or shared /signin or /signup link, and for a dashboard link
 * opened while signed out (which then shows the page asked for).
 */
export function AuthPage({ mode }) {
  const navigate = useNavigate();

  return (
    <main className="sign-in" id="main-content">
      <div className="sign-in__card">
        <Link to="/" className="sign-in__brand">
          <span className="sign-in__product">Partner Dashboard</span>
          <span className="sign-in__tagline">Accessible Onboarding</span>
        </Link>

        <h1 className="visually-hidden">
          {mode === 'signIn' ? 'Sign in to the Partner Dashboard' : 'Create a partner account'}
        </h1>

        <PartnerAuthForm
          mode={mode}
          onModeChange={(next) => navigate(next === 'signIn' ? '/signin' : '/signup')}
        />
      </div>
    </main>
  );
}

export function SignInPage() {
  return <AuthPage mode="signIn" />;
}

export function SignUpPage() {
  return <AuthPage mode="signUp" />;
}
