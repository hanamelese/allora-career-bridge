import { useRef, useState } from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';
import { normalizeOrigin } from '@onboarding/contracts';
import { addAllowedOrigin, listAllowedOrigins, removeAllowedOrigin } from '../../api/organisationClient.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Button } from '../ui/Button.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { LiveRegion } from '../ui/LiveRegion.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import { useT } from '../../i18n/index.js';
import './AllowedOriginsPanel.css';

/**
 * The websites allowed to show this organisation's embedded forms.
 *
 * A browser on any other site is refused by the public API, so a copied
 * embed tag only works where the organisation says it may.
 */
export function AllowedOriginsPanel() {
  const t = useT();
  const { status, data, error, reload } = useAsync(listAllowedOrigins, []);
  const [rows, setRows] = useState(null);
  const [value, setValue] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  const list = rows ?? data ?? [];

  async function add(event) {
    event.preventDefault();
    const origin = normalizeOrigin(value);

    if (!origin) {
      setFieldError(t('organisation.origins.invalid'));
      inputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const created = await addAllowedOrigin(origin);
      const next = [...list.filter((row) => row.id !== created.id), created].sort((a, b) => a.origin.localeCompare(b.origin));
      setRows(next);
      setValue('');
      setFieldError('');
      setAnnouncement(t('organisation.origins.added', created.origin));
    } catch (failure) {
      setFieldError(failure.issues?.[0]?.message ?? failure.message);
      inputRef.current?.focus();
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(row) {
    try {
      await removeAllowedOrigin(row.id);
      setRows(list.filter((other) => other.id !== row.id));
      setAnnouncement(t('organisation.origins.removed', row.origin));
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (failure) {
      setAnnouncement(failure.message);
    }
  }

  return (
    <div className="allowed-origins">
      <LiveRegion message={announcement} />

      {status === 'loading' && !rows ? <Skeleton height="2.5rem" /> : null}
      {status === 'error' && !rows ? <ErrorState description={error?.message} onRetry={reload} /> : null}

      {list.length > 0 ? (
        <ul className="allowed-origins__list" role="list">
          {list.map((row) => (
            <li key={row.id} className="allowed-origins__item">
              <Globe className="allowed-origins__icon" aria-hidden="true" />
              <span className="allowed-origins__origin">{row.origin}</span>
              <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(row)}>
                {t('organisation.origins.remove')}<span className="visually-hidden"> {row.origin}</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : status === 'success' || rows ? (
        <p className="allowed-origins__empty">
          {t('organisation.origins.empty')}
        </p>
      ) : null}

      <form className="allowed-origins__form" noValidate onSubmit={add}>
        <TextInput
          id="allowed-origin"
          ref={inputRef}
          label={t('organisation.origins.label')}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://www.example.org"
          value={value}
          onChange={(next) => {
            setValue(next);
            if (fieldError) setFieldError('');
          }}
          error={fieldError}
          help={t('organisation.origins.help')}
        />
        <Button type="submit" variant="secondary" icon={Plus} disabled={isSaving}>
          {t('organisation.origins.add')}
        </Button>
      </form>
    </div>
  );
}
