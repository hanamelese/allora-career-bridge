import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { ReferralPartnersPanel } from '../components/organisation/ReferralPartnersPanel.jsx';
import { AllowedOriginsPanel } from '../components/organisation/AllowedOriginsPanel.jsx';
import { DeliveryPanel } from '../components/organisation/DeliveryPanel.jsx';
import { useAuth } from '../auth/authContext.js';
import { useT } from '../i18n/index.js';

/** Settings that belong to the organisation rather than to one form. */
export function OrganisationPage() {
  const { partner } = useAuth();
  const t = useT();

  return (
    <div className="stack-lg">
      <header>
        <h1 className="form-workspace__title">{t('organisation.title')}</h1>
        <p className="form-workspace__purpose">{partner?.name}</p>
      </header>

      <Card as="section" aria-labelledby="delivery-heading">
        <SectionHeading
          id="delivery-heading"
          title={t('organisation.deliveryTitle')}
          description={t('organisation.deliveryDescription')}
        />

        <DeliveryPanel />
      </Card>

      <Card as="section" aria-labelledby="referral-partners-heading">
        <SectionHeading
          id="referral-partners-heading"
          title={t('organisation.partnersTitle')}
          description={t('organisation.partnersDescription')}
        />

        <ReferralPartnersPanel />
      </Card>

      <Card as="section" aria-labelledby="websites-heading">
        <SectionHeading
          id="websites-heading"
          title={t('organisation.websitesTitle')}
          description={t('organisation.websitesDescription')}
        />

        <AllowedOriginsPanel />
      </Card>
    </div>
  );
}
