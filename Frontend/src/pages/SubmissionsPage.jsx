import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Inbox, ShieldCheck } from 'lucide-react';
import { createFormEngine, formatAnswerText } from '@onboarding/form-engine';
import { listSubmissions } from '../api/formsClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import './SubmissionsPage.css';

function formatTimestamp(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Each answer with its question, worded as in the version the learner
 * answered - through the same engine that showed them the form, so a
 * choice reads as its label, not its stored key.
 */
function describeSubmission(config, answers) {
  if (!config) return Object.entries(answers).map(([key, value]) => ({ key, label: key, text: String(value) }));

  const engine = createFormEngine(config, answers, { language: 'en' });
  return engine
    .getVisibleQuestions()
    .filter((question) => Object.hasOwn(answers, question.key))
    .map((question) => ({
      key: question.key,
      label: question.label,
      text: formatAnswerText(question, answers[question.key], 'en'),
    }));
}

/** What learners sent from this form on a partner's website. */
export function SubmissionsPage() {
  const { form } = useOutletContext();
  const { status, data, error, reload } = useAsync(() => listSubmissions(form.formId), [form.formId]);

  const configs = useMemo(
    () => new Map(form.versions.map((version) => [version.version, version.config])),
    [form.versions],
  );

  return (
    <div className="stack-lg">
      <Card as="section" aria-labelledby="submissions-heading">
        <SectionHeading
          id="submissions-heading"
          title="Submissions"
          description="Answers learners sent from this form on your website, newest first."
        />

        <p className="submissions__privacy">
          <ShieldCheck aria-hidden="true" />
          <span>
            Private support and accommodation answers, the referral choice, ID numbers and uploaded files are never
            stored here. Your website receives everything the learner gave, files included, in the{' '}
            <code>onboarding-submit</code> event. A CV is listed here by its name and size only.
          </span>
        </p>

        {status === 'loading' ? <Skeleton height="6rem" /> : null}
        {status === 'error' ? <ErrorState description={error?.message} onRetry={reload} /> : null}

        {status === 'success' && data.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No submissions yet"
            description={
              form.currentVersion
                ? 'When a learner sends this form from your website, their answers appear here.'
                : 'Publish this form and put its embed tag on your website. Answers learners send will appear here.'
            }
          />
        ) : null}

        {status === 'success' && data.length > 0 ? (
          <>
            <p className="submissions__count">
              {data.length === 1 ? '1 submission' : `${data.length} submissions`}
            </p>
            <ol className="submissions__list" role="list">
              {data.map((submission) => {
                const headingId = `submission-${submission.submissionId}`;
                return (
                  <li key={submission.submissionId}>
                    <article className="submissions__item" aria-labelledby={headingId}>
                      <header className="submissions__item-header">
                        <h3 className="submissions__item-title" id={headingId}>
                          Received {formatTimestamp(submission.createdAt)}
                        </h3>
                        <Badge tone="neutral">Version {submission.version}</Badge>
                        {submission.language === 'am' ? <Badge tone="neutral">Amharic</Badge> : null}
                      </header>
                      <dl className="submissions__answers">
                        {describeSubmission(configs.get(submission.version), submission.answers).map((item) => (
                          <div key={item.key}>
                            <dt>{item.label}</dt>
                            <dd>{item.text}</dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  </li>
                );
              })}
            </ol>
          </>
        ) : null}
      </Card>
    </div>
  );
}
