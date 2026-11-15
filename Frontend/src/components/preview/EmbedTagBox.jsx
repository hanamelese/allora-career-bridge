import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { WIDGET_VERSION, buildEmbedTag, draftDiffersFromPublished, latestPublished, widgetUrl } from './embedTag.js';
import { useLanguage, useT } from '../../i18n/index.js';
import './EmbedTagBox.css';


/* How a page collects the answers. Code, so it is not translated. */
const ANSWERS_SNIPPET = `<script>
  document.addEventListener('onboarding-submit', (event) => {
    const { answers, files } = event.detail; // answers: plain JSON; files: File objects
    // Optional: make the form wait for your save, so it says "sent" only once it worked.
    event.detail.waitUntil(
      fetch('/your-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      }).then((response) => {
        if (!response.ok) throw new Error('Not saved');
      }),
    );
  });
</script>`;

/**
 * The tag a partner pastes into their own website - always for the
 * latest *published* version, never the draft.
 *
 * The widget version in the script path and the form version in the tag
 * are both pinned, which is what stops a later release changing a form
 * that is already live on someone's site.
 *
 * A public key is safe in a page by design: it allows reading a published
 * config and sending that form's referrals, nothing more. The secret key
 * is stored only as a hash and never leaves the server.
 */
export function EmbedTagBox({ form, hasUnsavedChanges = false }) {
  const t = useT();
  const language = useLanguage();
  const [status, setStatus] = useState('');
  const codeRef = useRef(null);
  const published = latestPublished(form);

  if (!published) {
    return (
      <div className="embed-tag">
        <p className="embed-tag__empty">
          <strong>{t('workspace.embed.noTagTitle')}</strong>
          {t('workspace.embed.noTagBefore')}
          <strong>{t('workspace.embed.noTagPublish')}</strong>
          {t('workspace.embed.noTagAfter')}
        </p>
      </div>
    );
  }

  const snippet = buildEmbedTag({
    formId: form.formId,
    publicKey: form.publicKey,
    version: published.version,
    language: published.config.defaultLanguage ?? 'en',
  });
  const draftDiffers = hasUnsavedChanges || draftDiffersFromPublished(form);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setStatus('copied');
      setTimeout(() => setStatus(''), 4000);
    } catch {
      /* Clipboard access can be refused. Select the whole tag instead, so
         Ctrl+C (or Cmd+C) copies it, and say so. */
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(codeRef.current);
      selection.removeAllRanges();
      selection.addRange(range);
      codeRef.current.focus();
      setStatus('selected');
    }
  }

  return (
    <div className="embed-tag">
      <dl className="embed-tag__facts">
        <div>
          <dt>{t('workspace.embed.versionInTag')}</dt>
          <dd>
            {t('workspace.embed.version', published.version)}
            <span className="embed-tag__badge">{t('workspace.embed.latestPublished')}</span>
          </dd>
        </div>
        <div>
          <dt>{t('workspace.embed.published')}</dt>
          <dd>{new Date(published.publishedAt).toLocaleString(language === 'am' ? 'am-ET' : undefined)}</dd>
        </div>
        <div>
          <dt>{t('workspace.embed.formId')}</dt>
          <dd>
            <code>{form.formId}</code>
          </dd>
        </div>
        <div>
          <dt>{t('workspace.embed.publicKey')}</dt>
          <dd>
            <code>{form.publicKey}</code>
          </dd>
        </div>
        <div>
          <dt>{t('workspace.embed.widgetVersion')}</dt>
          <dd>
            <code>{WIDGET_VERSION}</code>
          </dd>
        </div>
      </dl>

      {draftDiffers ? (
        <p className="embed-tag__warning">
          {t('workspace.embed.draftDiffers', published.version)}
        </p>
      ) : null}

      <pre className="embed-tag__code" tabIndex={0} aria-label={t('workspace.embed.codeLabel', published.version)} ref={codeRef}>
        <code>{snippet}</code>
      </pre>

      <div className="embed-tag__actions">
        <Button variant="secondary" icon={status === 'copied' ? Check : Copy} onClick={copy}>
          {status === 'copied' ? t('workspace.embed.copied') : t('workspace.embed.copyTag')}
        </Button>
        <p className="embed-tag__status" role="status">
          {status === 'copied'
            ? t('workspace.embed.copiedStatus', published.version)
            : status === 'selected'
              ? t('workspace.embed.selectedStatus')
              : ''}
        </p>
      </div>

      <dl className="embed-tag__notes">
        <div>
          <dt>{t('workspace.embed.whereTitle')}</dt>
          <dd>
            {t('workspace.embed.whereText')}{' '}
            <code>{widgetUrl()}</code>
            {t('workspace.embed.whereEnd')}
          </dd>
        </div>
        <div>
          <dt>{t('workspace.embed.allowedTitle')}</dt>
          <dd>
            {t('workspace.embed.allowedBefore')}{' '}
            <Link to="/organisation">{t('workspace.embed.allowedLink')}</Link>
            {t('workspace.embed.allowedAfter')}
          </dd>
        </div>
        <div>
          <dt>{t('workspace.embed.publicKey')}</dt>
          <dd>
            {t('workspace.embed.publicKeyText')}
          </dd>
        </div>
        <div>
          <dt>{t('workspace.embed.answersTitle')}</dt>
          <dd>
            <p>{t('workspace.embed.answersText')}</p>
            <pre className="embed-tag__code embed-tag__code--small" tabIndex={0} aria-label={t('workspace.embed.answersCodeLabel')}>
              <code>{ANSWERS_SNIPPET}</code>
            </pre>
            <p>{t('workspace.embed.answersNote')}</p>
          </dd>
        </div>
        <div>
          <dt>{t('workspace.embed.pinnedTitle')}</dt>
          <dd>
            {t('workspace.embed.pinnedText', published.version)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
