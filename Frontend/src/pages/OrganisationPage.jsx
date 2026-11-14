import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { ReferralPartnersPanel } from '../components/organisation/ReferralPartnersPanel.jsx';
import { AllowedOriginsPanel } from '../components/organisation/AllowedOriginsPanel.jsx';
import { useAuth } from '../auth/authContext.js';

/** Settings that belong to the organisation rather than to one form. */
export function OrganisationPage() {
  const { partner } = useAuth();

  return (
    <div className="stack-lg">
      <header>
        <h1 className="form-workspace__title">Your organisation</h1>
        <p className="form-workspace__purpose">{partner?.name}</p>
      </header>

      <Card as="section" aria-labelledby="referral-partners-heading">
        <SectionHeading
          id="referral-partners-heading"
          title="Referral partners"
          description="Organisations that can help someone who has no identity document. On the learner and job application forms, a person who chooses “I have no document, refer me” can ask for a link to be sent to one or more of them by SMS. They see only the names."
        />

        <ReferralPartnersPanel />
      </Card>

      <Card as="section" aria-labelledby="websites-heading">
        <SectionHeading
          id="websites-heading"
          title="Websites"
          description="The websites allowed to show your embedded forms. A browser on any other site is refused, so your embed tag only works where you put it."
        />

        <AllowedOriginsPanel />
      </Card>
    </div>
  );
}
