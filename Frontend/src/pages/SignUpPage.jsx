import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { partnerSignupSchema } from '@onboarding/contracts';
import { useAuth } from '../auth/authContext.js';
import { Button } from '../components/ui/Button.jsx';
import { TextInput } from '../components/ui/TextInput.jsx';
import './SignInPage.css';

const FIELDS = ['organisationName', 'email', 'password'];

/**
 * A partner organisation creating its own account.
 *
 * Checked with the same schema the server uses, so a mistake is caught at
 * the field rather than after a round trip. On success the partner is
 * signed in and lands on their first form.
 */
export function SignUpPage() {
  const { signUp } = useAuth();
  const [values, setValues] = useState({ organisationName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRefs = useRef({});

  function set(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function focusFirst(found) {
    const first = FIELDS.find((key) => found[key]);
    if (first) inputRefs.current[first]?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError(null);

    const result = partnerSignupSchema.safeParse(values);

    if (!result.success) {
      const found = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (!found[key]) found[key] = issue.message;
      }
      setErrors(found);
      focusFirst(found);
      return;
    }

    setErrors({});
    setIsCreating(true);

    try {
      await signUp(result.data);
      /* Signed in: the router now shows the dashboard. */
    } catch (signUpError) {
      setIsCreating(false);

      if (signUpError.issues?.length) {
        const found = {};
        for (const issue of signUpError.issues) {
          if (!found[issue.path]) found[issue.path] = issue.message;
        }
        setErrors(found);
        focusFirst(found);
      } else if (signUpError.code === 'email_taken') {
        setErrors({ email: signUpError.message });
        focusFirst({ email: true });
      } else {
        setServerError(signUpError.message);
      }
    }
  }

  const refFor = (key) => (element) => {
    inputRefs.current[key] = element;
  };

  return (
    <main className="sign-in" id="main-content">
      <div className="sign-in__card">
        <Link to="/" className="sign-in__brand">
          <span className="sign-in__product">Partner Dashboard</span>
          <span className="sign-in__tagline">Accessible Onboarding</span>
        </Link>

        <h1 className="sign-in__heading">Create a partner account</h1>
        <p className="sign-in__intro">
          Your organisation gets its own copy of every form, ready to configure. All fields are
          required.
        </p>

        <form className="sign-in__form" noValidate onSubmit={handleSubmit}>
          <TextInput
            id="sign-up-organisation"
            ref={refFor('organisationName')}
            label="Organisation name"
            value={values.organisationName}
            onChange={(value) => set('organisationName', value)}
            error={errors.organisationName}
            autoComplete="organization"
            required
            aria-required="true"
          />

          <TextInput
            id="sign-up-email"
            ref={refFor('email')}
            label="Work email address"
            type="email"
            value={values.email}
            onChange={(value) => set('email', value)}
            error={errors.email}
            help="You will sign in with this."
            autoComplete="email"
            required
            aria-required="true"
          />

          <TextInput
            id="sign-up-password"
            ref={refFor('password')}
            label="Password"
            type="password"
            value={values.password}
            onChange={(value) => set('password', value)}
            error={errors.password}
            help="At least 10 characters. A short phrase is easy to remember and hard to guess."
            autoComplete="new-password"
            required
            aria-required="true"
          />

          {serverError ? (
            <p className="sign-in__error" role="alert">
              {serverError}
            </p>
          ) : null}

          <Button type="submit" variant="primary" disabled={isCreating}>
            {isCreating ? 'Creating your account…' : 'Create account'}
          </Button>
        </form>

        <p className="sign-in__switch">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
