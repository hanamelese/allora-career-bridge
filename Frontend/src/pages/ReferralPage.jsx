import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { acceptReferral, getReferral } from '../api/formsClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useLanguage, useT } from '../i18n/index.js';
import './ReferralPage.css';

/* In English, the browser's own date style, as before; in Amharic, Amharic month names. */
function formatDate(iso, language) {
  const locale = language === 'am' ? 'am-ET' : undefined;
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
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
  const t = useT();
  const language = useLanguage();
  const { status, data, error, reload } = useAsync(() => getReferral(token), [token]);
  const [accepted, setAccepted] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  const referral = accepted ?? data;
  /* Referrals made since learners' details stopped being kept carry no
     name or phone: those are in the text message only. */
  const hasLearner = Boolean(referral?.learnerName);

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
            <p className="visually-hidden">{t('referral.loading')}</p>
            <Skeleton width="16rem" height="1.5rem" />
            <Skeleton height="4rem" />
          </div>
        ) : null}

        {status === 'error' ? (
          <ErrorState
            title={
              error?.code === 'referral_expired'
                ? t('referral.expiredTitle')
                : t('referral.invalidTitle')
            }
            description={
              error?.code === 'referral_expired'
                ? t('referral.expiredDescription')
                : error?.code === 'offline'
                  ? error.message
                  : t('referral.invalidDescription')
            }
            onRetry={error?.code === 'offline' ? reload : undefined}
          />
        ) : null}

        {status === 'success' && referral ? (
          <article className="stack-lg" aria-labelledby="referral-heading">
            <header className="stack-sm">
              {referral.isTest ? <Badge tone="draft">{t('referral.testBadge')}</Badge> : null}
              <h1 className="referral-page__title" id="referral-heading">
                {t('referral.title', referral.organisationName)}
              </h1>
              <p className="referral-page__lead">
                {hasLearner
                  ? referral.referralPartnerName
                    ? t('referral.lead', referral.learnerName, referral.organisationName, referral.referralPartnerName)
                    : t('referral.leadToYou', referral.learnerName, referral.organisationName)
                  : referral.referralPartnerName
                    ? t('referral.leadNoName', referral.organisationName, referral.referralPartnerName)
                    : t('referral.leadToYouNoName', referral.organisationName)}
              </p>
              {/* Referrals are no longer kept with the learner's details:
                  they are in the text message only. */}
              {hasLearner ? null : <p>{t('referral.detailsInMessage')}</p>}
            </header>

            <dl className="referral-page__details">
              {hasLearner ? (
                <>
                  <div>
                    <dt>{t('referral.name')}</dt>
                    <dd>{referral.learnerName}</dd>
                  </div>
                  <div>
                    <dt>{t('referral.phone')}</dt>
                    <dd>
                      {referral.learnerPhone ? (
                        <a href={`tel:${referral.learnerPhone.replace(/\s+/g, '')}`}>{referral.learnerPhone}</a>
                      ) : (
                        t('referral.notGiven')
                      )}
                    </dd>
                  </div>
                </>
              ) : null}
              <div>
                <dt>{t('referral.referredOn')}</dt>
                <dd>{formatDate(referral.createdAt, language)}</dd>
              </div>
              <div>
                <dt>{t('referral.linkWorksUntil')}</dt>
                <dd>{formatDate(referral.expiresAt, language)}</dd>
              </div>
            </dl>

            {referral.status === 'accepted' ? (
              <p className="referral-page__accepted" role="status">
                <CheckCircle2 aria-hidden="true" />
                {hasLearner
                  ? t('referral.accepted', formatDate(referral.acceptedAt, language), referral.learnerName)
                  : t('referral.acceptedNoName', formatDate(referral.acceptedAt, language))}
              </p>
            ) : (
              <div className="stack-sm">
                <p>
                  {hasLearner
                    ? t('referral.acceptExplanation', referral.organisationName, referral.learnerName)
                    : t('referral.acceptExplanationNoName', referral.organisationName)}
                </p>
                <Button variant="primary" onClick={accept} disabled={isAccepting}>
                  {isAccepting ? t('referral.accepting') : t('referral.accept')}
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
