import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FORM_TEMPLATES, partnerSignupSchema } from '@onboarding/contracts';
import { FormRenderer } from '@onboarding/form-engine/react';
import { useAuth } from './authContext.js';
import { renderIcon } from '../icons.js';
import { FORM_TYPES } from '../formTypes.js';
import { translate, useLanguage } from '../i18n/index.js';

const FIRST_FORM_PATH = `/forms/${FORM_TYPES[0].slug}/configure`;

/* The server's names for the sign-up fields, and the form's. */
const TO_FIELD = { organisationName: 'name', email: 'email', password: 'password' };

/* An override text in both languages, from the `auth` namespace. */
function bothLanguages(key) {
  return { en: translate('en', key), am: translate('am', key) };
}

/**
 * The partner's own Sign up / Sign in, for the dashboard.
 *
 * This is the same accessible Sign up / Sign in form partners give their
 * learners - the engine's AccountForm, one question per screen, with the
 * display settings - configured for a partner account: the name question
 * asks for the organisation, and the password rule is the dashboard's
 * (at least 10 characters). There is one sign-in form, used by the
 * landing page popups and by the /signin and /signup pages alike.
 *
 * Social sign-in is not offered: the dashboard has no OAuth provider set
 * up, and a button that cannot work would be worse than none.
 */
export function PartnerAuthForm({ mode, onModeChange }) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const language = useLanguage();

  const config = useMemo(() => {
    const template = FORM_TEMPLATES.account;

    return {
      ...template,
      formId: 'partner_dashboard_account',
      languages: [language],
      defaultLanguage: language,
      fields: template.fields.map((field) => {
        if (field.key === 'name') {
          return {
            ...field,
            label: bothLanguages('auth.name.label'),
            simpleLabel: bothLanguages('auth.name.simpleLabel'),
            helpText: bothLanguages('auth.name.help'),
          };
        }

        if (field.key === 'email') {
          return {
            ...field,
            label: bothLanguages('auth.email.label'),
            ...(mode === 'signUp' ? { helpText: bothLanguages('auth.email.help') } : {}),
          };
        }

        if (field.key === 'password' && mode === 'signUp') {
          return {
            ...field,
            helpText: bothLanguages('auth.password.help'),
          };
        }

        return field;
      }),
      account: { ...template.account, mode, allowEmailPassword: true, socialProviders: [] },
    };
  }, [mode, language]);

  async function handleSubmit(data) {
    try {
      if (mode === 'signIn') {
        await signIn(String(data.email).trim().toLowerCase(), data.password);
      } else {
        const checked = partnerSignupSchema.safeParse({
          organisationName: data.name,
          email: data.email,
          password: data.password,
        });

        if (!checked.success) {
          return { errors: fieldErrors(checked.error.issues.map((issue) => ({ path: issue.path[0], message: issue.message }))) };
        }

        await signUp(checked.data);
      }
    } catch (error) {
      if (error.code === 'email_taken') return { errors: { email: error.message } };
      if (error.issues?.length) return { errors: fieldErrors(error.issues) };
      /* Wrong email or password: the server deliberately does not say
         which, so neither does this. */
      return { message: error.message };
    }

    /* From the landing page or /signin, on to the first form. From a deep
       link opened while signed out, stay: the page asked for now shows. */
    if (['/', '/signin', '/signup'].includes(location.pathname)) {
      navigate(FIRST_FORM_PATH, { replace: true });
    }

    return null;
  }

  return (
    <FormRenderer
      key={`${mode}-${language}`}
      config={config}
      settings={{ language }}
      onSubmit={handleSubmit}
      onSwitchMode={onModeChange}
      renderIcon={renderIcon}
    />
  );
}

function fieldErrors(issues) {
  const errors = {};

  for (const issue of issues) {
    const key = TO_FIELD[issue.path] ?? null;
    if (key && !errors[key]) errors[key] = issue.message;
  }

  return errors;
}
