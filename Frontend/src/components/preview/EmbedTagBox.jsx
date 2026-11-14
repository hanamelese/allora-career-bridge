import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { WIDGET_VERSION, buildEmbedTag, draftDiffersFromPublished, latestPublished, widgetUrl } from './embedTag.js';
import './EmbedTagBox.css';

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
  const [status, setStatus] = useState('');
  const codeRef = useRef(null);
  const published = latestPublished(form);

  if (!published) {
    return (
      <div className="embed-tag">
        <p className="embed-tag__empty">
          <strong>There is no tag yet.</strong> A tag always points at a published version, and this
          form has not been published. Use <strong>Publish</strong> above to publish version 1; its
          tag then appears here.
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
          <dt>Version in this tag</dt>
          <dd>
            Version {published.version}
            <span className="embed-tag__badge">Latest published</span>
          </dd>
        </div>
        <div>
          <dt>Published</dt>
          <dd>{new Date(published.publishedAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Form ID</dt>
          <dd>
            <code>{form.formId}</code>
          </dd>
        </div>
        <div>
          <dt>Public key</dt>
          <dd>
            <code>{form.publicKey}</code>
          </dd>
        </div>
        <div>
          <dt>Widget version</dt>
          <dd>
            <code>{WIDGET_VERSION}</code>
          </dd>
        </div>
      </dl>

      {draftDiffers ? (
        <p className="embed-tag__warning">
          Your draft has changes that are not live yet. This tag shows version {published.version},
          as published. Publish a new version to put your changes on your site.
        </p>
      ) : null}

      <pre className="embed-tag__code" tabIndex={0} aria-label={`Embed tag for version ${published.version}`} ref={codeRef}>
        <code>{snippet}</code>
      </pre>

      <div className="embed-tag__actions">
        <Button variant="secondary" icon={status === 'copied' ? Check : Copy} onClick={copy}>
          {status === 'copied' ? 'Copied' : 'Copy the tag'}
        </Button>
        <p className="embed-tag__status" role="status">
          {status === 'copied'
            ? `Embed tag for version ${published.version} copied to your clipboard.`
            : status === 'selected'
              ? 'Your browser did not allow copying. The tag is selected: press Ctrl+C (or Cmd+C) to copy it.'
              : ''}
        </p>
      </div>

      <dl className="embed-tag__notes">
        <div>
          <dt>Where it goes</dt>
          <dd>
            Paste it into your page’s HTML where the form should appear. The script loads from{' '}
            <code>{widgetUrl()}</code>.
          </dd>
        </div>
        <div>
          <dt>Allowed websites</dt>
          <dd>
            Add your site’s address under{' '}
            <Link to="/organisation">Your organisation → Websites</Link>, or the form will not load
            there.
          </dd>
        </div>
        <div>
          <dt>Public key</dt>
          <dd>
            Safe to put in a web page. Your secret key stays on the server and is never included here.
          </dd>
        </div>
        <div>
          <dt>Pinned versions</dt>
          <dd>
            Your site keeps showing version {published.version} until you paste a newer tag, even after
            you publish again.
          </dd>
        </div>
      </dl>
    </div>
  );
}
