import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { acceptReferral, getReferral } from '../api/formsClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import './ReferralPage.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Where the link in a referral SMS leads.
 *
 * Opened by the referral partner, who is not a dashboard user, so it needs
 * no sign-in: the long random token in the link is the credential, and it
 * expires. It shows only what the learner agreed to share - their name and
 * phone number - and lets the partner say they have taken it on.
 */
export function ReferralPage() {
  const { token } = useParams();
  const { status, data, error, reload } = useAsync(() => getReferral(token), [token]);
  const [accepted, setAccepted] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  const referral = accepted ?? data;

  async function accept() {
    setIsAccepting(true);
    setAcceptError('');

    try {
      setAccepted(await acceptReferral(token));
    } catch (failure) {
      setAcceptError(failure.message);
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <main className="referral-page" id="main-content">
      <div className="referral-page__card">
        {status === 'loading' ? (
          <div className="stack-md" aria-busy="true">
            <p className="visually-hidden">Loading the referral.</p>
            <Skeleton width="16rem" height="1.5rem" />
            <Skeleton height="4rem" />
          </div>
        ) : null}

        {status === 'error' ? (
          <ErrorState
            title={
              error?.code === 'referral_expired'
                ? 'This referral link has expired'
                : 'This referral link is not valid'
            }
            description={
              error?.code === 'referral_expired'
                ? 'Ask the organisation that sent it to send a new one.'
                : error?.code === 'offline'
                  ? error.message
                  : 'Check that the whole link from the text message was opened.'
            }
            onRetry={error?.code === 'offline' ? reload : undefined}
          />
        ) : null}

        {status === 'success' && referral ? (
          <article className="stack-lg" aria-labelledby="referral-heading">
            <header className="stack-sm">
              {referral.isTest ? <Badge tone="draft">Test referral</Badge> : null}
              <h1 className="referral-page__title" id="referral-heading">
                Referral from {referral.organisationName}
              </h1>
              <p className="referral-page__lead">
                {referral.learnerName} has no identity document and asked {referral.organisationName} to
                refer them to {referral.referralPartnerName || 'you'} for help with registering.
              </p>
            </header>

            <dl className="referral-page__details">
              <div>
                <dt>Name</dt>
                <dd>{referral.learnerName}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  {referral.learnerPhone ? (
                    <a href={`tel:${referral.learnerPhone.replace(/\s+/g, '')}`}>{referral.learnerPhone}</a>
                  ) : (
                    'Not given'
                  )}
                </dd>
              </div>
              <div>
                <dt>Referred on</dt>
                <dd>{formatDate(referral.createdAt)}</dd>
              </div>
              <div>
                <dt>Link works until</dt>
                <dd>{formatDate(referral.expiresAt)}</dd>
              </div>
            </dl>

            {referral.status === 'accepted' ? (
              <p className="referral-page__accepted" role="status">
                <CheckCircle2 aria-hidden="true" />
                You accepted this referral on {formatDate(referral.acceptedAt)}. Please contact{' '}
                {referral.learnerName} to help them register.
              </p>
            ) : (
              <div className="stack-sm">
                <p>Accepting lets {referral.organisationName} know you will contact {referral.learnerName}.</p>
                <Button variant="primary" onClick={accept} disabled={isAccepting}>
                  {isAccepting ? 'Accepting…' : 'Accept referral'}
                </Button>
                {acceptError ? (
                  <p className="referral-page__error" role="alert">
                    {acceptError}
                  </p>
                ) : null}
              </div>
            )}
          </article>
        ) : null}
      </div>
    </main>
  );
}
