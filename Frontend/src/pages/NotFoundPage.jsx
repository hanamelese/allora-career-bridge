import { Link } from 'react-router-dom';
import { FORM_TYPES } from '../formTypes.js';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useT } from '../i18n/index.js';

export function NotFoundPage() {
  const firstForm = FORM_TYPES[0];
  const t = useT();

  return (
    <Card as="section">
      <h1 className="visually-hidden">{t('notFound.heading')}</h1>
      <EmptyState
        title={t('notFound.title')}
        description={t('notFound.description')}
        action={
          <Button as={Link} variant="primary" to={`/forms/${firstForm.slug}/configure`}>
            {t('notFound.goTo', t(`formTypes.${firstForm.id}.name`))}
          </Button>
        }
      />
    </Card>
  );
}
