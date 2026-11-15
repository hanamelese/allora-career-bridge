import { useState } from 'react';
import { Mail, Pencil, Phone, Trash2, Users } from 'lucide-react';
import {
  addReferralPartner,
  listReferralPartners,
  removeReferralPartner,
  updateReferralPartner,
} from '../../api/organisationClient.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { LiveRegion } from '../ui/LiveRegion.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { ReferralPartnerForm } from './ReferralPartnerForm.jsx';
import { useT } from '../../i18n/index.js';
import './ReferralPartnersPanel.css';

/**
 * The organisations this partner refers learners to.
 *
 * Learners who have no identity document see these names - only the
 * names - at the end of the learner form and can ask for a link to be sent
 * to them. The email and phone number stay on the server.
 */
export function ReferralPartnersPanel() {
  const t = useT();
  const { status, data, error, reload } = useAsync(listReferralPartners, []);
  const [partners, setPartners] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [actionError, setActionError] = useState('');

  /* Local edits win over the first load. */
  const list = partners ?? data ?? [];

  async function add(details) {
    const created = await addReferralPartner(details);
    setPartners([...list, created].sort((a, b) => a.name.localeCompare(b.name)));
    setAnnouncement(t('organisation.partners.added', created.name));
  }

  async function update(id, details) {
    const updated = await updateReferralPartner(id, details);
    setPartners(list.map((item) => (item.id === id ? updated : item)));
    setEditingId(null);
    setAnnouncement(t('organisation.partners.updated', updated.name));
    requestAnimationFrame(() => document.getElementById(`rp-edit-${id}`)?.focus());
  }

  async function remove(item) {
    setActionError('');

    try {
      await removeReferralPartner(item.id);
      setPartners(list.filter((other) => other.id !== item.id));
      setConfirmingId(null);
      setAnnouncement(t('organisation.partners.removed', item.name));
      requestAnimationFrame(() => document.getElementById('rp-new-name')?.focus());
    } catch (failure) {
      setActionError(failure.message);
    }
  }

  if (status === 'loading') {
    return (
      <div className="stack-md" aria-busy="true">
        <p className="visually-hidden">{t('organisation.partners.loading')}</p>
        <Skeleton height="3rem" />
        <Skeleton height="3rem" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        title={t('organisation.partners.loadError')}
        description={error?.message}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="referral-partners">
      <LiveRegion message={announcement} />

      {actionError ? (
        <p className="referral-form__error" role="alert">
          {actionError}
        </p>
      ) : null}

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('organisation.partners.emptyTitle')}
          description={t('organisation.partners.emptyDescription')}
        />
      ) : (
        <ul className="referral-partners__list" role="list">
          {list.map((item) => (
            <li className="referral-partners__item" key={item.id}>
              {editingId === item.id ? (
                <ReferralPartnerForm
                  idPrefix={`rp-${item.id}`}
                  initial={{ name: item.name, email: item.email, phone: item.phone }}
                  submitLabel={t('organisation.partners.save', item.name)}
                  onSubmit={(details) => update(item.id, details)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="referral-partners__details">
                    <p className="referral-partners__name">{item.name}</p>
                    <p className="referral-partners__contact">
                      <Mail aria-hidden="true" />
                      <span className="visually-hidden">{t('organisation.partners.email')}</span>
                      {item.email}
                    </p>
                    <p className="referral-partners__contact">
                      <Phone aria-hidden="true" />
                      <span className="visually-hidden">{t('organisation.partners.phone')}</span>
                      {item.phone}
                    </p>
                  </div>

                  {confirmingId === item.id ? (
                    <div className="referral-partners__confirm" role="group" aria-label={t('organisation.partners.confirmLabel', item.name)}>
                      <p>{t('organisation.partners.confirmText', item.name)}</p>
                      <div className="referral-partners__actions">
                        <Button variant="primary" size="sm" onClick={() => remove(item)}>
                          {t('organisation.partners.remove')}
                        </Button>
                        <Button size="sm" onClick={() => setConfirmingId(null)}>
                          {t('organisation.partners.keep')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="referral-partners__actions">
                      <Button
                        id={`rp-edit-${item.id}`}
                        size="sm"
                        icon={Pencil}
                        aria-label={t('organisation.partners.editLabel', item.name)}
                        onClick={() => setEditingId(item.id)}
                      >
                        {t('organisation.partners.edit')}
                      </Button>
                      <Button
                        size="sm"
                        icon={Trash2}
                        aria-label={t('organisation.partners.removeLabel', item.name)}
                        onClick={() => setConfirmingId(item.id)}
                      >
                        {t('organisation.partners.remove')}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className="referral-partners__add" aria-labelledby="rp-add-heading">
        <h3 className="referral-partners__add-heading" id="rp-add-heading">
          {t('organisation.partners.addHeading')}
        </h3>
        <ReferralPartnerForm idPrefix="rp-new" submitLabel={t('organisation.partners.addSubmit')} onSubmit={add} />
      </section>
    </div>
  );
}
