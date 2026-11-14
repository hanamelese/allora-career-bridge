import { SOCIAL_PROVIDERS } from '@onboarding/contracts';
import { BrandIcon } from '@onboarding/form-engine/react';
import { Switch } from '../ui/Switch.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import './AccountSettings.css';

const MODES = [
  {
    value: 'signUp',
    label: 'Sign up',
    description: 'For new people. Asks for their name as well as an email and password.',
  },
  {
    value: 'signIn',
    label: 'Sign in',
    description: 'For people who already have an account. Asks for email and password only.',
  },
];

/**
 * The Sign up / Sign in form's own options: its title, and which ways of
 * signing in it offers.
 *
 * The dashboard never holds a provider's client secret. Each social button
 * is a link to an address on the partner's own site - the start of their
 * OAuth flow - so all this stores is that address.
 */
export function AccountSettings({ account, errors, onChange }) {
  const providers = SOCIAL_PROVIDERS.map((provider) => ({
    ...provider,
    ...(account.socialProviders.find((item) => item.key === provider.key) ?? {
      enabled: false,
      url: '',
    }),
  }));

  function updateProvider(key, patch) {
    onChange({
      socialProviders: providers.map(({ key: providerKey, enabled, url }) =>
        providerKey === key ? { key: providerKey, enabled, url, ...patch } : { key: providerKey, enabled, url },
      ),
    });
  }

  const providerIndex = (key) => providers.findIndex((provider) => provider.key === key);

  return (
    <div className="account-settings">
      <fieldset className="account-settings__modes">
        <legend className="account-settings__legend">Form title</legend>
        <p className="account-settings__hint">
          Sign up and sign in work the same way, so one form covers both. Choose which this one is.
        </p>

        <div className="account-settings__mode-list">
          {MODES.map((mode) => (
            <label className="account-settings__mode" key={mode.value}>
              <input
                type="radio"
                name="account-mode"
                value={mode.value}
                checked={account.mode === mode.value}
                aria-describedby={`account-mode-${mode.value}-description`}
                onChange={() => onChange({ mode: mode.value })}
              />
              <span>
                <span className="account-settings__mode-label">{mode.label}</span>
                <span className="account-settings__mode-description" id={`account-mode-${mode.value}-description`}>
                  {mode.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Switch
        id="account-email-password"
        label="Email and password"
        description="People type an email address and password. They are passed to your sign-in system and never stored here."
        checked={account.allowEmailPassword}
        onChange={(checked) => onChange({ allowEmailPassword: checked })}
      />
      {errors['account.allowEmailPassword'] ? (
        <p className="account-settings__error" role="alert">
          {errors['account.allowEmailPassword']}
        </p>
      ) : null}

      <fieldset className="account-settings__providers">
        <legend className="account-settings__legend">Sign in with another account</legend>
        <p className="account-settings__hint">
          Each button opens the address you give, usually where your own site starts signing in with
          that service. Screen readers announce each one as, for example, “Sign up with Google, link”.
        </p>

        <ul className="account-settings__provider-list" role="list">
          {providers.map((provider) => {
            const urlError = errors[`account.socialProviders.${providerIndex(provider.key)}.url`];

            return (
              <li className="account-settings__provider" key={provider.key}>
                <div className="account-settings__provider-head">
                  <BrandIcon provider={provider.key} />
                  <Switch
                    id={`account-provider-${provider.key}`}
                    label={provider.name}
                    checked={provider.enabled}
                    onChange={(checked) => updateProvider(provider.key, { enabled: checked })}
                  />
                </div>

                {provider.enabled ? (
                  <TextInput
                    id={`account-provider-${provider.key}-url`}
                    label={`${provider.name} sign-in address`}
                    type="url"
                    inputMode="url"
                    placeholder={`https://your-site.example/auth/${provider.key}`}
                    value={provider.url}
                    error={urlError}
                    help="Must start with https://"
                    onChange={(url) => updateProvider(provider.key, { url: url.trim() })}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </fieldset>
    </div>
  );
}
