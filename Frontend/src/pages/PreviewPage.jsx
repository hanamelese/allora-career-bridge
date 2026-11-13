import { useOutletContext } from 'react-router-dom';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { PreviewPane } from '../components/preview/PreviewPane.jsx';
import { EmbedTagBox } from '../components/preview/EmbedTagBox.jsx';

/**
 * What the learner will see, and the tag that puts it on a partner's site.
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
          description={`This is ${formType.name} exactly as a learner meets it: one question per screen, with a chance to check every answer before sending. It updates as you change the settings.`}
        />

        <PreviewPane config={config} />
      </Card>

      <Card as="section" aria-labelledby="embed-heading">
        <SectionHeading
          id="embed-heading"
          title="Embed tag"
          description="Paste this into your website where the form should appear."
        />

        <EmbedTagBox
          formId={form.formId}
          formVersion={form.currentVersion}
          language={config.defaultLanguage}
          publicKey={form.publicKey}
        />
      </Card>
    </div>
  );
}
