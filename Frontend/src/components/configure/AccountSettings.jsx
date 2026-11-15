import { SOCIAL_PROVIDERS } from '@onboarding/contracts';
import { BrandIcon } from '@onboarding/form-engine/react';
import { Switch } from '../ui/Switch.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import { useT } from '../../i18n/index.js';
import './AccountSettings.css';

/* Their wording is under `configure.account.modes.<value>`. */
const MODES = ['signUp', 'signIn'];

/**
 * The Sign up / Sign in form's own options: its title, and which ways of
 * signing in it offers.
 *
 * The dashboard never holds a provider's client secret. Each social button
 * is a link to an address on the partner's own site - the start of their
 * OAuth flow - so all this stores is that address.
 */
export function AccountSettings({ account, errors, onChange }) {
  const t = useT();
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

  const modes = MODES.map((value) => ({
    value,
    label: t(`configure.account.modes.${value}.label`),
    description: t(`configure.account.modes.${value}.description`),
  }));

  const providerIndex = (key) => providers.findIndex((provider) => provider.key === key);

  return (
    <div className="account-settings">
      <fieldset className="account-settings__modes">
        <legend className="account-settings__legend">{t('configure.account.formTitle')}</legend>
        <p className="account-settings__hint">
          {t('configure.account.formTitleHint')}
        </p>

        <div className="account-settings__mode-list">
          {modes.map((mode) => (
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
        label={t('configure.account.emailPassword')}
        description={t('configure.account.emailPasswordDescription')}
        checked={account.allowEmailPassword}
        onChange={(checked) => onChange({ allowEmailPassword: checked })}
      />
      {errors['account.allowEmailPassword'] ? (
        <p className="account-settings__error" role="alert">
          {errors['account.allowEmailPassword']}
        </p>
      ) : null}

      <fieldset className="account-settings__providers">
        <legend className="account-settings__legend">{t('configure.account.providers')}</legend>
        <p className="account-settings__hint">
          {t('configure.account.providersHint')}
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
                    label={t('configure.account.providerAddress', provider.name)}
                    type="url"
                    inputMode="url"
                    placeholder={`https://your-site.example/auth/${provider.key}`}
                    value={provider.url}
                    error={urlError}
                    help={t('configure.account.httpsHelp')}
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
