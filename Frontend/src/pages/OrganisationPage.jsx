import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { ReferralPartnersPanel } from '../components/organisation/ReferralPartnersPanel.jsx';
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
          description="Organisations that can help a learner who has no identity document. On the learner form, a learner who chooses “I have no document” can ask for a link to be sent to one or more of them by SMS. Learners see only the names."
        />

        <ReferralPartnersPanel />
      </Card>
    </div>
  );
}
