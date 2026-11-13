import { useOutletContext } from 'react-router-dom';
import { Languages, Mic, Volume2, Shapes } from 'lucide-react';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { FieldSummaryList } from '../components/forms/FieldSummaryList.jsx';
import './ConfigurePage.css';

/**
 * What this form asks for today.
 *
 * Phase 1 shows the configuration; Phase 2 makes it editable, with a
 * switch per field, label and help-text editing, and custom fields.
 */
export function ConfigurePage() {
  const { form } = useOutletContext();
  const config = form.draftConfig;
  const enabledCount = config.fields.filter((field) => field.enabled).length;

  const features = [
    { key: 'voiceInput', icon: Mic, label: 'Voice input', on: config.features.voiceInput },
    { key: 'readAloud', icon: Volume2, label: 'Read aloud', on: config.features.readAloud },
    { key: 'lowLiteracy', icon: Shapes, label: 'Simple words and icons', on: config.features.lowLiteracy },
  ];

  return (
    <div className="stack-lg">
      <Card as="section" aria-labelledby="fields-heading">
        <SectionHeading
          id="fields-heading"
          title="Questions this form asks"
          description={`${enabledCount} ${enabledCount === 1 ? 'question is' : 'questions are'} switched on. Questions marked "Always on" are needed for the form to work and cannot be removed.`}
        />

        <div className="configure-page__fields">
          {enabledCount > 0 ? (
            <FieldSummaryList fields={config.fields} />
          ) : (
            <EmptyState
              title="No questions are switched on"
              description="This form will not collect anything until at least one question is enabled."
            />
          )}
        </div>
      </Card>

      <Card as="section" aria-labelledby="accessibility-heading">
        <SectionHeading
          id="accessibility-heading"
          title="Accessibility and language"
          description="How learners can read and answer this form."
        />

        <dl className="configure-page__settings">
          <div className="configure-page__setting">
            <dt>
              <Languages className="configure-page__setting-icon" aria-hidden="true" />
              Languages
            </dt>
            <dd>
              English and Amharic, starting in{' '}
              {config.defaultLanguage === 'am' ? 'Amharic' : 'English'}
            </dd>
          </div>

          {features.map((feature) => (
            <div className="configure-page__setting" key={feature.key}>
              <dt>
                <feature.icon className="configure-page__setting-icon" aria-hidden="true" />
                {feature.label}
              </dt>
              <dd>{feature.on ? 'On' : 'Off'}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
