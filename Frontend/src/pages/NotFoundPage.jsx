import { Link } from 'react-router-dom';
import { FORM_TYPES } from '../formTypes.js';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';

export function NotFoundPage() {
  const firstForm = FORM_TYPES[0];

  return (
    <Card as="section">
      <h1 className="visually-hidden">Page not found</h1>
      <EmptyState
        title="This page does not exist"
        description="The address may have been mistyped. Go back to the first form to carry on."
        action={
          <Button as={Link} variant="primary" to={`/forms/${firstForm.slug}/configure`}>
            Go to {firstForm.name}
          </Button>
        }
      />
    </Card>
  );
}
