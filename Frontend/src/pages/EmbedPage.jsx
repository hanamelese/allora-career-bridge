import { useOutletContext } from 'react-router-dom';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { EmbedTagBox } from '../components/preview/EmbedTagBox.jsx';
import { useT } from '../i18n/index.js';

/** The tag that puts the latest published version on a partner's site. */
export function EmbedPage() {
  const { form, configState } = useOutletContext();
  const t = useT();

  return (
    <Card as="section" aria-labelledby="embed-heading">
      <SectionHeading
        id="embed-heading"
        title={t('workspace.embed.title')}
        description={t('workspace.embed.description')}
      />

      <EmbedTagBox form={form} hasUnsavedChanges={configState.isDirty} />
    </Card>
  );
}
