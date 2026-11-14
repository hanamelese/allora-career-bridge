import { useOutletContext } from 'react-router-dom';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { PreviewPane } from '../components/preview/PreviewPane.jsx';

/**
 * What the learner will see.
 */
export function PreviewPage() {
  const { form, formType, configState } = useOutletContext();
  const { config } = configState;

  return (
    <div className="stack-lg">
      <Card as="section" aria-labelledby="preview-heading">
        <SectionHeading
          id="preview-heading"
          title="Live preview"
          description={
            config.type === 'account'
              ? `This is ${formType.name} exactly as people on your site will meet it: the social sign-in choices first, then one question per screen, every option reachable by keyboard and named for screen readers. It updates as you change the settings.`
              : `This is ${formType.name} exactly as a learner meets it: one question per screen, with a chance to check every answer before sending. It updates as you change the settings.`
          }
        />

        <PreviewPane config={config} formId={form.formId} />
      </Card>

    </div>
  );
}
