import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import './EmbedTagBox.css';

/**
 * The tag a partner pastes into their own website.
 *
 * The widget version in the script path and the form version in the tag
 * are both pinned, which is what stops a later release changing a form
 * that is already live on someone's site.
 */

/* Replaced with the partner's real public key in Phase 4, once keys are
   issued by the API. A public key is safe in a page by design; the secret
   key never reaches the browser. */
const PLACEHOLDER_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxx';
const WIDGET_VERSION = 'v1';
const CDN_ORIGIN = 'https://cdn.example.org';

export function EmbedTagBox({ formId, formVersion, language }) {
  const [copied, setCopied] = useState(false);

  const snippet = [
    `<script src="${CDN_ORIGIN}/embed/${WIDGET_VERSION}/loader.js" async></script>`,
    '',
    '<onboarding-form',
    `  form-id="${formId}"`,
    `  public-key="${PLACEHOLDER_PUBLIC_KEY}"`,
    `  form-version="${formVersion ?? 1}"`,
    `  lang="${language}">`,
    '</onboarding-form>',
  ].join('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* Clipboard access can be refused; the snippet is selectable. */
    }
  }

  return (
    <div className="embed-tag">
      {!formVersion ? (
        <p className="embed-tag__warning">
          This form has not been published yet, so this tag will not load anything. Publish it to
          get a version number.
        </p>
      ) : null}

      <pre className="embed-tag__code" tabIndex={0} aria-label="Embed tag">
        <code>{snippet}</code>
      </pre>

      <div className="embed-tag__actions">
        <Button variant="secondary" icon={copied ? Check : Copy} onClick={copy}>
          {copied ? 'Copied' : 'Copy the tag'}
        </Button>
        <p className="embed-tag__status" role="status">
          {copied ? 'Embed tag copied to your clipboard.' : ''}
        </p>
      </div>

      <dl className="embed-tag__notes">
        <div>
          <dt>Public key</dt>
          <dd>
            Safe to put in a web page. Your secret key stays on your server and is never included
            here.
          </dd>
        </div>
        <div>
          <dt>Pinned versions</dt>
          <dd>
            <code>{WIDGET_VERSION}</code> is the widget version and <code>form-version</code> pins
            this form. Neither changes until you choose to move.
          </dd>
        </div>
        <div>
          <dt>Still to come</dt>
          <dd>
            The widget script itself is not released yet, and the key above is a placeholder until
            the API issues real ones.
          </dd>
        </div>
      </dl>
    </div>
  );
}
