import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { WIDGET_VERSION, draftDiffersFromPublished, latestPublished, widgetUrl } from './embedTag.js';
import { DEFAULT_FRAMEWORK, FRAMEWORKS, buildSnippet, findFramework } from './embedSnippets.js';
import { useLanguage, useT } from '../../i18n/index.js';
import './EmbedTagBox.css';


const FRAMEWORK_KEY = 'bridge-embed-framework';

/* The chosen framework is a per-viewer convenience: remembered in this
   browser if it can be, and fine without it. */
function readFramework() {
  try {
    return findFramework(window.localStorage.getItem(FRAMEWORK_KEY) ?? DEFAULT_FRAMEWORK).id;
  } catch {
    return DEFAULT_FRAMEWORK;
  }
}

function saveFramework(id) {
  try {
    window.localStorage.setItem(FRAMEWORK_KEY, id);
  } catch {
    /* Storage can be blocked; the choice then lasts until the page closes. */
  }
}

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
  const [frameworkId, setFrameworkId] = useState(readFramework);
  const codeRef = useRef(null);
  const tabRefs = useRef({});
  const panelId = useId();
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

  const framework = findFramework(frameworkId);
  const snippet = buildSnippet(framework.id, {
    formId: form.formId,
    publicKey: form.publicKey,
    version: published.version,
    language: published.config.defaultLanguage ?? 'en',
    widgetSrc: widgetUrl(),
  });

  function choose(id, moveFocus) {
    setFrameworkId(id);
    setStatus('');
    saveFramework(id);
    if (moveFocus) tabRefs.current[id]?.focus();
  }

  /* Tabs pattern: arrows move along the row (and wrap), Home and End jump
     to the ends; the chosen tab is the only one in the Tab order. */
  function onTabKeyDown(event) {
    const index = FRAMEWORKS.findIndex((item) => item.id === framework.id);
    const last = FRAMEWORKS.length - 1;
    const target = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    choose(FRAMEWORKS[target].id, true);
  }
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

      <div className="embed-tag__tabs" role="tablist" aria-label={t('workspace.embed.frameworksLabel')}>
        {FRAMEWORKS.map((item) => {
          const selected = item.id === framework.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${panelId}-tab-${item.id}`}
              className="embed-tag__tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              ref={(node) => {
                tabRefs.current[item.id] = node;
              }}
              onClick={() => choose(item.id, false)}
              onKeyDown={onTabKeyDown}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="embed-tag__panel" role="tabpanel" id={panelId} aria-labelledby={`${panelId}-tab-${framework.id}`}>
        <p className="embed-tag__how">{t(`workspace.embed.how.${framework.id}`)}</p>
        <pre
          className="embed-tag__code"
          tabIndex={0}
          aria-label={t('workspace.embed.codeLabel', published.version, framework.label)}
          ref={codeRef}
        >
          <code>{snippet}</code>
        </pre>
      </div>

      <div className="embed-tag__actions">
        <Button variant="secondary" icon={status === 'copied' ? Check : Copy} onClick={copy}>
          {status === 'copied' ? t('workspace.embed.copied') : t('workspace.embed.copyTag', framework.label)}
        </Button>
        <p className="embed-tag__status" role="status">
          {status === 'copied'
            ? t('workspace.embed.copiedStatus', published.version, framework.label)
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
