import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Maximize2 } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { PreviewPane } from '../components/preview/PreviewPane.jsx';
import { useT } from '../i18n/index.js';

/**
 * What the learner will see.
 *
 * Full view opens the same preview, larger, in a popup - the real renderer
 * and the draft being edited, never a separate mock. It only reads the
 * draft: nothing in it changes the configuration or a published version.
 */
export function PreviewPage() {
  const { form, formType, configState } = useOutletContext();
  const { config } = configState;
  const t = useT();
  const formName = t(`formTypes.${formType.id}.name`);
  const [isFullView, setIsFullView] = useState(false);

  return (
    <div className="stack-lg">
      <Card as="section" aria-labelledby="preview-heading">
        <SectionHeading
          id="preview-heading"
          title={t('workspace.preview.title')}
          description={
            config.type === 'account'
              ? t('workspace.preview.descriptionAccount', formName)
              : t('workspace.preview.description', formName)
          }
          actions={
            <Button variant="primary" size="sm" icon={Maximize2} onClick={() => setIsFullView(true)} aria-haspopup="dialog">
              {t('workspace.preview.fullView')}
            </Button>
          }
        />

        <PreviewPane config={config} formId={form.formId} />
      </Card>

      <Modal
        isOpen={isFullView}
        onClose={() => setIsFullView(false)}
        label={t('workspace.preview.fullViewLabel', formName)}
        closeLabel={t('workspace.preview.closeFullView')}
        className="modal--wide"
        header={
          <span className="preview-full__title">
            {t('workspace.preview.fullView')} <span className="preview-full__name">· {formName}</span>
          </span>
        }
      >
        <PreviewPane config={config} formId={form.formId} variant="full" />
      </Modal>

    </div>
  );
}
