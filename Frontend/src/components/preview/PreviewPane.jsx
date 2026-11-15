import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { formatFileSize, isFileLike } from '@onboarding/contracts';
import { FormRenderer, clearProgress } from '@onboarding/form-engine/react';
import { Button } from '../ui/Button.jsx';
import { renderIcon } from '../../icons.js';
import { sendTestReferral } from '../../api/formsClient.js';
import { listReferralPartners } from '../../api/organisationClient.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../auth/authContext.js';
import { useT } from '../../i18n/index.js';
import './PreviewPane.css';
import { fetchSpeech } from '../../api/http.js';

/**
 * The live preview.
 *
 * It mounts the same `FormRenderer` the embedded form will use, driven by
 * the draft configuration being edited - so this is the learner experience
 * itself, not a drawing of it. Every change in the Configure view shows up
 * here immediately.
 */

/* What the embedded form would hand to the partner's page. Files are
   named, not opened: this system never uploads or keeps them. */
function describeSubmission(data, t) {
  const files = Object.entries(data)
    .filter(([, value]) => isFileLike(value))
    .map(([key, file]) => `${key}: ${file.name} (${formatFileSize(file.size)})`);
  const count = Object.keys(data).length;

  return [
    t('workspace.preview.answersSent', count),
    files.length ? t('workspace.preview.filesPassed', files.join('; ')) : null,
    t('workspace.preview.nothingSent'),
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * `variant="full"` is the larger copy shown in the Full view popup: the same
 * renderer and draft, with its own saved place, so starting it again never
 * disturbs the preview on the page.
 */
export function PreviewPane({ config, formId, variant = 'inline' }) {
  const t = useT();
  const [runId, setRunId] = useState(0);
  const isFull = variant === 'full';
  /* The preview keeps its place across a reload too, as a learner's form
     does - under its own key, so it never mixes with a published form. */
  const progressKey = `fe-progress:${isFull ? 'preview-full' : 'preview'}:${formId}`;
  /* What a sign-in button or the sign-in form would have done on the
     partner's site; the preview reports it instead of leaving the page. */
  const [accountNote, setAccountNote] = useState('');
  const { partner } = useAuth();

  /* The organisation's real referral partners, so the referral step shows
     exactly what a learner would see. Names only reach the form. */
  const asksForReferral = config.fields.some((field) => field.key === 'referral' && field.enabled);
  const partners = useAsync(
    () => (asksForReferral ? listReferralPartners() : Promise.resolve([])),
    [asksForReferral],
  );

  const referral = useMemo(
    () => ({
      partners: (partners.data ?? []).map(({ id, name }) => ({ id, name })),
      organisationName: partner?.name ?? '',
      onSend: (request) => sendTestReferral(formId, request),
    }),
    [partners.data, partner?.name, formId],
  );

  return (
    <div className={`preview-pane${isFull ? ' preview-pane--full' : ''}`}>
      <div className="preview-pane__controls">
        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={() => {
            setAccountNote('');
            /* What this preview kept in the tab goes too, so it really
               starts again. */
            clearProgress(progressKey);
            setRunId((current) => current + 1);
          }}
        >
          {t('workspace.preview.startAgain')}
        </Button>
      </div>

      {asksForReferral ? (
        <p className="preview-pane__note">
          {partners.status === 'error'
            ? t('workspace.preview.partnersError')
            : t('workspace.preview.partnersNote')}
        </p>
      ) : null}

      <p className="preview-pane__note">
        {t('workspace.preview.settingsNote')}
      </p>

      <p className="preview-pane__note" role="status">
        {accountNote}
      </p>

      <div className="preview-pane__frame">
        <FormRenderer
          /* A new run remounts the renderer, which is how "start again"
             clears the answers without the engine needing a reset API. */
          key={`${runId}-${config.defaultLanguage}`}
          config={config}
          progressKey={progressKey}
          settings={{ language: config.defaultLanguage }}
          voice={fetchSpeech}
          referral={referral}
          onSocialSignIn={(provider) =>
            setAccountNote(t('workspace.preview.socialSignIn', provider.name, provider.url))
          }
          onSubmit={
            config.type === 'account'
              ? (data) =>
                  setAccountNote(
                    t(
                      'workspace.preview.accountSubmit',
                      Object.keys(data)
                        .map((key) =>
                          key === 'password' ? t('workspace.preview.passwordHidden') : `${key} “${data[key]}”`,
                        )
                        .join(t('workspace.preview.listSeparator')),
                    ),
                  )
              : (data) => setAccountNote(describeSubmission(data, t))
          }
          renderIcon={renderIcon}
        />
      </div>
    </div>
  );
}
