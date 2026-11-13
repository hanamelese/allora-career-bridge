import { useOutletContext } from 'react-router-dom';
import { History } from 'lucide-react';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import './PublishPage.css';

function formatTimestamp(value) {
  if (!value) return 'Not yet';

  return new Date(value).toLocaleString(undefined, {
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

  return (
    <div className="stack-lg">
      <Card as="section" aria-labelledby="status-heading">
        <SectionHeading
          id="status-heading"
          title="Current state"
          description="Only published versions are served to learners. A published version can never change - publishing again creates a new one."
          actions={
            <Badge tone={form.status === 'published' ? 'published' : 'draft'}>
              {form.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
          }
        />

        <dl className="publish-page__facts">
          <div>
            <dt>Form ID</dt>
            <dd className="text-mono">{form.formId}</dd>
          </div>
          <div>
            <dt>Live version</dt>
            <dd>{form.currentVersion ? `Version ${form.currentVersion}` : 'None published'}</dd>
          </div>
          <div>
            <dt>Draft last saved</dt>
            <dd>{formatTimestamp(form.updatedAt)}</dd>
          </div>
          <div>
            <dt>Last published</dt>
            <dd>{formatTimestamp(form.publishedAt)}</dd>
          </div>
        </dl>
      </Card>

      <Card as="section" aria-labelledby="versions-heading">
        <SectionHeading
          id="versions-heading"
          title="Version history"
          description="Every published version is kept and can never be changed, so a website pinned to an older version keeps working."
        />

        <div className="publish-page__versions">
          {form.versions.length === 0 ? (
            <EmptyState
              icon={History}
              title="Nothing published yet"
              description="When you publish this form it will appear here with its version number and publish date."
            />
          ) : (
            <ul className="publish-page__version-list" role="list">
              {[...form.versions].reverse().map((version) => (
                <li className="publish-page__version" key={version.version}>
                  <span className="publish-page__version-number">
                    Version {version.version}
                    {version.version === form.currentVersion ? (
                      <Badge tone="published">Live</Badge>
                    ) : null}
                  </span>
                  <span className="publish-page__version-date">
                    Published {formatTimestamp(version.publishedAt)}
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
