import { useOutletContext } from 'react-router-dom';
import { LOCK_REASONS, fieldCatalog } from '@onboarding/contracts';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SettingsPanel } from '../components/configure/SettingsPanel.jsx';
import { CustomFieldRow } from '../components/configure/CustomFieldRow.jsx';
import { CustomFieldEditor } from '../components/configure/CustomFieldEditor.jsx';
import { LanguageSettings } from '../components/configure/LanguageSettings.jsx';
import { IdentityRoutesEditor } from '../components/configure/IdentityRoutesEditor.jsx';
import { AccountSettings } from '../components/configure/AccountSettings.jsx';
import { useT } from '../i18n/index.js';
import './ConfigurePage.css';

/**
 * Configure one form.
 *
 * Every change is validated against the shared form schema as it is made,
 * so a partner cannot build a configuration the server would reject.
 */
export function ConfigurePage() {
  const { formType, configState } = useOutletContext();
  const t = useT();
  const {
    config,
    fieldErrors,
    errors,
    generalErrors,
    updateConfig,
    updateField,
    addCustomField,
    updateCustomField,
    removeCustomField,
  } = configState;

  const enabledCount =
    config.fields.filter((field) => field.enabled).length +
    config.customFields.filter((field) => field.enabled).length;

  const hasIdentityQuestion = config.fields.some((field) => field.key === 'identityRoute');

  /* Support and accommodation questions are kept in a section of their
     own, as people filling in the form meet them: a learner's private
     support needs, or the accommodations an employer offers. */
  const sectionOf = (field) => fieldCatalog[field.key]?.section ?? null;
  const supportFields = config.fields.filter((field) => sectionOf(field) === 'support');
  const accommodationFields = config.fields.filter((field) => sectionOf(field) === 'accommodations');
  const generalFields = config.fields.filter((field) => !sectionOf(field));
  const isAccount = config.type === 'account';

  return (
    <div className="stack-lg">
      {generalErrors.length > 0 ? (
        <Card as="section" aria-labelledby="config-problems-heading">
          <h2 className="configure-page__problems-heading" id="config-problems-heading">
            {t('configure.page.problemsHeading')}
          </h2>
          <ul className="configure-page__problems" role="list">
            {generalErrors.map((issue, index) => (
              <li key={`${issue.path}-${index}`}>{issue.message}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {config.account ? (
        <Card as="section" aria-labelledby="account-heading">
          <SectionHeading
            id="account-heading"
            title={t('configure.page.accountTitle')}
            description={t('configure.page.accountDescription')}
          />

          <AccountSettings
            account={config.account}
            errors={errors}
            onChange={(patch) => updateConfig({ account: { ...config.account, ...patch } })}
          />
        </Card>
      ) : null}

      <Card as="section" aria-labelledby="fields-heading">
        <SectionHeading
          id="fields-heading"
          title={t('configure.page.fieldsTitle')}
          description={t('configure.page.fieldsDescription', enabledCount)}
        />

        <SettingsPanel
          config={config}
          fields={generalFields}
          fieldErrors={fieldErrors}
          formTypeId={formType.id}
          lockReasons={LOCK_REASONS[formType.id]}
          onUpdateField={updateField}
        />
      </Card>

      {supportFields.length > 0 ? (
        <Card as="section" aria-labelledby="support-fields-heading">
          <SectionHeading
            id="support-fields-heading"
            title={t('configure.page.supportTitle')}
            description={t('configure.page.supportDescription')}
          />

          <SettingsPanel
            config={config}
            fields={supportFields}
            fieldErrors={fieldErrors}
            formTypeId={formType.id}
            lockReasons={LOCK_REASONS[formType.id]}
            onUpdateField={updateField}
          />
        </Card>
      ) : null}

      {accommodationFields.length > 0 ? (
        <Card as="section" aria-labelledby="accommodation-fields-heading">
          <SectionHeading
            id="accommodation-fields-heading"
            title={t('configure.page.accommodationTitle')}
            description={t('configure.page.accommodationDescription')}
          />

          <SettingsPanel
            config={config}
            fields={accommodationFields}
            fieldErrors={fieldErrors}
            formTypeId={formType.id}
            lockReasons={LOCK_REASONS[formType.id]}
            onUpdateField={updateField}
          />
        </Card>
      ) : null}

      <Card as="section" aria-labelledby="custom-fields-heading">
        <SectionHeading
          id="custom-fields-heading"
          title={t('configure.page.customTitle')}
          description={
            isAccount
              ? t('configure.page.customDescriptionAccount')
              : t('configure.page.customDescription')
          }
        />

        {config.customFields.length > 0 ? (
          <ul className="settings-panel" role="list">
            {config.customFields.map((fieldConfig) => (
              <CustomFieldRow
                key={fieldConfig.key}
                fieldConfig={fieldConfig}
                error={fieldErrors[fieldConfig.key]}
                onUpdate={(patch) => updateCustomField(fieldConfig.key, patch)}
                onRemove={() => removeCustomField(fieldConfig.key)}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            title={t('configure.page.customEmptyTitle')}
            description={t('configure.page.customEmptyDescription')}
          />
        )}

        <CustomFieldEditor
          existingKeys={config.customFields.map((field) => field.key)}
          onAdd={addCustomField}
        />
      </Card>

      <Card as="section" aria-labelledby="language-heading">
        <SectionHeading
          id="language-heading"
          title={t('configure.page.languageTitle')}
        />

        <LanguageSettings
          defaultLanguage={config.defaultLanguage}
          onDefaultLanguageChange={(language) => updateConfig({ defaultLanguage: language })}
        />
      </Card>

      {hasIdentityQuestion ? (
        <Card as="section" aria-labelledby="identity-heading">
          <SectionHeading
            id="identity-heading"
            title={t('configure.page.identityTitle')}
            description={t('configure.page.identityDescription')}
          />

          <IdentityRoutesEditor
            selectedRoutes={config.identityRoutes}
            error={errors.identityRoutes}
            onChange={(routes) => updateConfig({ identityRoutes: routes })}
          />
        </Card>
      ) : null}

    </div>
  );
}
