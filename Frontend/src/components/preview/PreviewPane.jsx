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
import './PreviewPane.css';

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
function describeSubmission(data) {
  const files = Object.entries(data)
    .filter(([, value]) => isFileLike(value))
    .map(([key, file]) => `${key}: ${file.name} (${formatFileSize(file.size)})`);
  const count = Object.keys(data).length;

  return [
    `On your site, ${count} ${count === 1 ? 'answer goes' : 'answers go'} to your page in the onboarding-submit event.`,
    files.length ? `Files passed with them: ${files.join('; ')}.` : null,
    'Nothing was sent from this preview.',
  ]
    .filter(Boolean)
    .join(' ');
}

export function PreviewPane({ config, formId }) {
  const [runId, setRunId] = useState(0);
  /* The preview keeps its place across a reload too, as a learner's form
     does - under its own key, so it never mixes with a published form. */
  const progressKey = `fe-progress:preview:${formId}`;
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
    <div className="preview-pane">
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
          Start again
        </Button>
      </div>

      {asksForReferral ? (
        <p className="preview-pane__note">
          {partners.status === 'error'
            ? 'Your referral partners could not be loaded, so the referral step shows none.'
            : 'Send link in this preview really sends a text message to the referral partners you choose, marked as a test.'}
        </p>
      ) : null}

      <p className="preview-pane__note">
        Learners change contrast, text size, language and simple words from the Settings button at
        the top of the form.
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
          referral={referral}
          onSocialSignIn={(provider) =>
            setAccountNote(`On your site, “${provider.name}” opens ${provider.url}. The preview stays here.`)
          }
          onSubmit={
            config.type === 'account'
              ? (data) =>
                  setAccountNote(
                    `On your site, these details go to your own sign-in system: ${Object.keys(data)
                      .map((key) => (key === 'password' ? 'password (hidden)' : `${key} “${data[key]}”`))
                      .join(', ')}.`,
                  )
              : (data) => setAccountNote(describeSubmission(data))
          }
          renderIcon={renderIcon}
        />
      </div>
    </div>
  );
}
