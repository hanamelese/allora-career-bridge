import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { FormRenderer } from '@onboarding/form-engine/react';
import { Button } from '../ui/Button.jsx';
import { Select } from '../ui/Select.jsx';
import { getIcon } from '../../icons.js';
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

/* The engine names icons as strings so it needs no icon library of its
   own; the dashboard supplies the components. */
function renderIcon(name) {
  const Icon = getIcon(name);
  return <Icon />;
}

export function PreviewPane({ config, formId }) {
  const [language, setLanguage] = useState(config.defaultLanguage);
  const [runId, setRunId] = useState(0);
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
        <Select
          id="preview-language"
          label="Preview in"
          value={language}
          onChange={setLanguage}
          options={config.languages.map((code) => ({
            value: code,
            label: code === 'am' ? 'Amharic (አማርኛ)' : 'English',
          }))}
        />

        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={() => setRunId((current) => current + 1)}
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

      <div className="preview-pane__frame">
        <FormRenderer
          /* A new run remounts the renderer, which is how "start again"
             clears the answers without the engine needing a reset API. */
          key={`${runId}-${language}`}
          config={config}
          settings={{ language }}
          referral={referral}
          renderIcon={renderIcon}
        />
      </div>
    </div>
  );
}
