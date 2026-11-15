import { Link, useOutletContext, useParams } from 'react-router-dom';
import { Code2, History } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useLanguage, useT } from '../i18n/index.js';
import './PublishPage.css';

function formatTimestamp(value, t, language) {
  if (!value) return t('workspace.publish.notYet');

  return new Date(value).toLocaleString(language === 'am' ? 'am-ET' : undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Draft and published state for this form.
 *
 * Saving and publishing happen from the bar above, which stays with the
 * partner across all three views. This page is the record: what is live,
 * what has been published before, and when.
 */
export function PublishPage() {
  const { form } = useOutletContext();
  const t = useT();
  const language = useLanguage();
  const { formSlug } = useParams();
  const isPublished = Boolean(form.currentVersion);

  return (
    <div className="stack-lg">
      <Card as="section" aria-labelledby="status-heading">
        <SectionHeading
          id="status-heading"
          title={t('workspace.publish.stateTitle')}
          description={t('workspace.publish.stateDescription')}
          actions={
            <Badge tone={form.status === 'published' ? 'published' : 'draft'}>
              {form.status === 'published' ? t('workspace.publish.published') : t('workspace.publish.draft')}
            </Badge>
          }
        />

        <dl className="publish-page__facts">
          <div>
            <dt>{t('workspace.publish.formId')}</dt>
            <dd className="text-mono">{form.formId}</dd>
          </div>
          <div>
            <dt>{t('workspace.publish.liveVersion')}</dt>
            <dd>{form.currentVersion ? t('workspace.publish.version', form.currentVersion) : t('workspace.publish.nonePublished')}</dd>
          </div>
          <div>
            <dt>{t('workspace.publish.draftLastSaved')}</dt>
            <dd>{formatTimestamp(form.updatedAt, t, language)}</dd>
          </div>
          <div>
            <dt>{t('workspace.publish.lastPublished')}</dt>
            <dd>{formatTimestamp(form.publishedAt, t, language)}</dd>
          </div>
        </dl>

        {/* The step after publishing. It only goes to the Embed tag view:
            it creates nothing and changes nothing. */}
        <div className="publish-page__next">
          <p className="publish-page__next-text">
            {isPublished
              ? t('workspace.publish.nextPublished', form.currentVersion)
              : t('workspace.publish.nextUnpublished')}
          </p>
          <Button as={Link} to={`/forms/${formSlug}/embed`} variant="primary" icon={Code2}>
            {t('workspace.publish.getEmbedTag')}
          </Button>
        </div>
      </Card>

      <Card as="section" aria-labelledby="versions-heading">
        <SectionHeading
          id="versions-heading"
          title={t('workspace.publish.historyTitle')}
          description={t('workspace.publish.historyDescription')}
        />

        <div className="publish-page__versions">
          {form.versions.length === 0 ? (
            <EmptyState
              icon={History}
              title={t('workspace.publish.emptyTitle')}
              description={t('workspace.publish.emptyDescription')}
            />
          ) : (
            <ul className="publish-page__version-list" role="list">
              {[...form.versions].reverse().map((version) => (
                <li className="publish-page__version" key={version.version}>
                  <span className="publish-page__version-number">
                    {t('workspace.publish.version', version.version)}
                    {version.version === form.currentVersion ? (
                      <Badge tone="published">{t('workspace.publish.live')}</Badge>
                    ) : null}
                  </span>
                  <span className="publish-page__version-date">
                    {t('workspace.publish.publishedAt', formatTimestamp(version.publishedAt, t, language))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
