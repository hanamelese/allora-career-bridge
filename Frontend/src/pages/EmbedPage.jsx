import { useOutletContext } from 'react-router-dom';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { EmbedTagBox } from '../components/preview/EmbedTagBox.jsx';

/** The tag that puts the latest published version on a partner's site. */
export function EmbedPage() {
  const { form, configState } = useOutletContext();

  return (
    <Card as="section" aria-labelledby="embed-heading">
      <SectionHeading
        id="embed-heading"
        title="Embed tag"
        description="Copy this tag into your website where the form should appear. It always shows the latest published version, never your draft."
      />

      <EmbedTagBox form={form} hasUnsavedChanges={configState.isDirty} />
    </Card>
  );
}
