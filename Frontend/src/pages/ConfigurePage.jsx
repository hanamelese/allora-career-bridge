import { useOutletContext } from 'react-router-dom';
import { LOCK_REASONS } from '@onboarding/contracts';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SettingsPanel } from '../components/configure/SettingsPanel.jsx';
import { CustomFieldRow } from '../components/configure/CustomFieldRow.jsx';
import { CustomFieldEditor } from '../components/configure/CustomFieldEditor.jsx';
import { FeatureToggles } from '../components/configure/FeatureToggles.jsx';
import { IdentityRoutesEditor } from '../components/configure/IdentityRoutesEditor.jsx';
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
    isDirty,
    fieldErrors,
    errors,
    generalErrors,
    updateConfig,
    updateFeature,
    updateField,
    addCustomField,
    updateCustomField,
    removeCustomField,
  } = configState;

  const enabledCount =
    config.fields.filter((field) => field.enabled).length +
    config.customFields.filter((field) => field.enabled).length;

  const hasIdentityQuestion = config.fields.some((field) => field.key === 'identityRoute');

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

      <Card as="section" aria-labelledby="fields-heading">
        <SectionHeading
          id="fields-heading"
          title="Questions this form asks"
          description={`${enabledCount} ${enabledCount === 1 ? 'question is' : 'questions are'} switched on. Questions marked "Always on" are needed for the form to work and cannot be removed.`}
        />

        <SettingsPanel
          config={config}
          fieldErrors={fieldErrors}
          lockReasons={LOCK_REASONS[formType.id]}
          onUpdateField={updateField}
        />
      </Card>

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

      <Card as="section" aria-labelledby="accessibility-heading">
        <SectionHeading
          id="accessibility-heading"
          title="Accessibility and language"
          description="This form is always available in English and Amharic. These settings decide how learners can read and answer it."
        />

        <FeatureToggles
          features={config.features}
          defaultLanguage={config.defaultLanguage}
          onFeatureChange={updateFeature}
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

      {isDirty ? (
        <p className="configure-page__unsaved" role="status">
          These changes are not saved yet. Saving drafts and publishing versions arrive with the
          backend, so leaving this page will discard them.
        </p>
      ) : null}
    </div>
  );
}
