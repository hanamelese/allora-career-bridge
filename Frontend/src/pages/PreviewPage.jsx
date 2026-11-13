import { useOutletContext } from 'react-router-dom';
import { MonitorPlay } from 'lucide-react';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

/**
 * Where the live preview goes.
 *
 * The preview is rendered by the shared Form Engine, so that what a
 * partner sees here is the same code a learner will meet. Those React
 * bindings arrive in Phase 3; showing a mock-up instead would defeat the
 * purpose of the preview.
 */
export function PreviewPage() {
  const { formType } = useOutletContext();

  return (
    <Card as="section" aria-labelledby="preview-heading">
      <h2 className="visually-hidden" id="preview-heading">
        Preview
      </h2>
      <EmptyState
        icon={MonitorPlay}
        title="The live preview is not connected yet"
        description={`Once the shared Form Engine is wired up, this panel will render ${formType.name} exactly as the learner meets it - one question per screen, in English or Amharic, with read-aloud and voice answers.`}
      />
    </Card>
  );
}
