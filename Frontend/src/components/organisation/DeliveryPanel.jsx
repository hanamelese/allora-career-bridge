import { useRef, useState } from 'react';
import { Copy, Eye, EyeOff, KeyRound, Save, Send, Trash2 } from 'lucide-react';
import { deliveryUrlSchema } from '@onboarding/contracts';
import { getDelivery, renewDeliverySecret, saveDelivery } from '../../api/organisationClient.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Button } from '../ui/Button.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { LiveRegion } from '../ui/LiveRegion.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import { useT } from '../../i18n/index.js';
import './DeliveryPanel.css';

/**
 * Where this organisation's submitted forms are delivered.
 *
 * Learners' browsers send their answers straight to this address, which
 * the organisation runs; Allora Accessibility Bridge never receives or
 * keeps them. Each delivery carries a short-lived token signed with the
 * secret shown here, so the organisation's server can check it came
 * through one of its own published forms.
 */
export function DeliveryPanel() {
  const t = useT();
  const { status, data, error, reload } = useAsync(getDelivery, []);
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [fieldError, setFieldError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const inputRef = useRef(null);

  const current = saved ?? data ?? { url: null, secret: null };
  const value = draft ?? current.url ?? '';

  async function run(action, message) {
    setIsBusy(true);
    try {
      const next = await action();
      setSaved(next);
      setDraft(null);
      setFieldError('');
      setAnnouncement(message(next));
      return next;
    } catch (failure) {
      setFieldError(failure.issues?.[0]?.message ?? failure.message);
      inputRef.current?.focus();
      return null;
    } finally {
      setIsBusy(false);
    }
  }

  function save(event) {
    event.preventDefault();
    const checked = deliveryUrlSchema.safeParse(value);

    if (!checked.success) {
      setFieldError(t('organisation.delivery.invalid'));
      inputRef.current?.focus();
      return;
    }

    run(() => saveDelivery(checked.data), (next) => t('organisation.delivery.saved', next.url));
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(current.secret);
      setAnnouncement(t('organisation.delivery.secretCopied'));
    } catch {
      setShowSecret(true);
      setAnnouncement(t('organisation.delivery.copyFailed'));
    }
  }

  if (status === 'loading' && !saved) return <Skeleton height="6rem" />;
  if (status === 'error' && !saved) return <ErrorState description={error?.message} onRetry={reload} />;

  return (
    <div className="delivery">
      <LiveRegion message={announcement} />

      <p className={`delivery__status${current.url ? ' delivery__status--on' : ''}`}>
        <Send aria-hidden="true" />
        <span>
          {current.url ? t('organisation.delivery.statusOn') : t('organisation.delivery.statusOff')}
          {current.url ? <code className="delivery__url"> {current.url}</code> : null}
        </span>
      </p>

      <form className="delivery__form" noValidate onSubmit={save}>
        <TextInput
          id="delivery-url"
          ref={inputRef}
          label={t('organisation.delivery.label')}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://forms.example.org/receive"
          value={value}
          onChange={(next) => {
            setDraft(next);
            if (fieldError) setFieldError('');
          }}
          error={fieldError}
          help={t('organisation.delivery.help')}
        />
        <div className="delivery__actions">
          <Button type="submit" variant="primary" icon={Save} disabled={isBusy}>
            {t('organisation.delivery.save')}
          </Button>
          {current.url ? (
            <Button
              variant="ghost"
              icon={Trash2}
              disabled={isBusy}
              onClick={() => run(() => saveDelivery(null), () => t('organisation.delivery.stopped'))}
            >
              {t('organisation.delivery.stop')}
            </Button>
          ) : null}
        </div>
      </form>

      {current.url && current.secret ? (
        <section className="delivery__secret" aria-labelledby="delivery-secret-heading">
          <h3 className="delivery__subheading" id="delivery-secret-heading">
            <KeyRound aria-hidden="true" />
            {t('organisation.delivery.secretTitle')}
          </h3>
          <p className="delivery__note">{t('organisation.delivery.secretHelp')}</p>
          <code className="delivery__secret-value" aria-label={t('organisation.delivery.secretTitle')}>
            {showSecret ? current.secret : '•'.repeat(24)}
          </code>
          <div className="delivery__actions">
            <Button
              variant="secondary"
              size="sm"
              icon={showSecret ? EyeOff : Eye}
              aria-pressed={showSecret}
              onClick={() => setShowSecret((shown) => !shown)}
            >
              {t('organisation.delivery.showSecret')}
            </Button>
            <Button variant="secondary" size="sm" icon={Copy} onClick={copySecret}>
              {t('organisation.delivery.copySecret')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={KeyRound}
              disabled={isBusy}
              onClick={() => run(renewDeliverySecret, () => t('organisation.delivery.secretRenewed'))}
            >
              {t('organisation.delivery.renewSecret')}
            </Button>
          </div>
        </section>
      ) : null}

      <details className="delivery__details">
        <summary>{t('organisation.delivery.howTitle')}</summary>
        <ol className="delivery__steps">
          <li>{t('organisation.delivery.how1')}</li>
          <li>{t('organisation.delivery.how2')}</li>
          <li>{t('organisation.delivery.how3')}</li>
          <li>{t('organisation.delivery.how4')}</li>
        </ol>
        <p className="delivery__note">{t('organisation.delivery.howNote')}</p>
      </details>
    </div>
  );
}
