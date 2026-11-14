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
import './ConfigurePage.css';

/**
 * Configure one form.
 *
 * Every change is validated against the shared form schema as it is made,
 * so a partner cannot build a configuration the server would reject.
 */
export function ConfigurePage() {
  const { formType, configState } = useOutletContext();
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
     own, as learners meet them. */
  const isSupport = (field) => fieldCatalog[field.key]?.section === 'support';
  const supportFields = config.fields.filter(isSupport);
  const generalFields = config.fields.filter((field) => !isSupport(field));

  return (
    <div className="stack-lg">
      {generalErrors.length > 0 ? (
        <Card as="section" aria-labelledby="config-problems-heading">
          <h2 className="configure-page__problems-heading" id="config-problems-heading">
            This form cannot be published yet
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
            title="Sign-in options"
            description="The form's title, and the ways people can sign up or sign in."
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
          title="Questions this form asks"
          description={`${enabledCount} ${enabledCount === 1 ? 'question is' : 'questions are'} switched on. Questions marked "Always on" are needed for the form to work and cannot be removed.`}
        />

        <SettingsPanel
          config={config}
          fields={generalFields}
          fieldErrors={fieldErrors}
          lockReasons={LOCK_REASONS[formType.id]}
          onUpdateField={updateField}
        />
      </Card>

      {supportFields.length > 0 ? (
        <Card as="section" aria-labelledby="support-fields-heading">
          <SectionHeading
            id="support-fields-heading"
            title="Support and accommodations"
            description="Asked in a section of their own, marked private. Answers are never shared with employers, people are never asked for medical proof, and nobody has to say why they need something."
          />

          <SettingsPanel
            config={config}
            fields={supportFields}
            fieldErrors={fieldErrors}
            lockReasons={LOCK_REASONS[formType.id]}
            onUpdateField={updateField}
          />
        </Card>
      ) : null}

      {/* A sign-in form asks only for what signing in needs. */}
      {config.type !== 'account' ? (
      <Card as="section" aria-labelledby="custom-fields-heading">
        <SectionHeading
          id="custom-fields-heading"
          title="Questions you added"
          description="Your own questions are asked after the standard ones. They can be short written answers, a choice from a list, or yes and no."
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
            title="You have not added any questions"
            description="Add one below if your organisation needs something the standard questions do not cover."
          />
        )}

        <CustomFieldEditor
          existingKeys={config.customFields.map((field) => field.key)}
          onAdd={addCustomField}
        />
      </Card>
      ) : null}

      <Card as="section" aria-labelledby="language-heading">
        <SectionHeading
          id="language-heading"
          title="Language"
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
            title="How learners can identify themselves"
            description="Choose which documents this form accepts. Learners without any of them still have a way through."
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
