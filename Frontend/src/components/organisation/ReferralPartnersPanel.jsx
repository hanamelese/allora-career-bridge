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
import './ReferralPartnersPanel.css';

/**
 * The organisations this partner refers learners to.
 *
 * Learners who have no identity document see these names - only the
 * names - at the end of the learner form and can ask for a link to be sent
 * to them. The email and phone number stay on the server.
 */
export function ReferralPartnersPanel() {
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
    setAnnouncement(`${created.name} was added.`);
  }

  async function update(id, details) {
    const updated = await updateReferralPartner(id, details);
    setPartners(list.map((item) => (item.id === id ? updated : item)));
    setEditingId(null);
    setAnnouncement(`${updated.name} was updated.`);
    requestAnimationFrame(() => document.getElementById(`rp-edit-${id}`)?.focus());
  }

  async function remove(item) {
    setActionError('');

    try {
      await removeReferralPartner(item.id);
      setPartners(list.filter((other) => other.id !== item.id));
      setConfirmingId(null);
      setAnnouncement(`${item.name} was removed.`);
      requestAnimationFrame(() => document.getElementById('rp-new-name')?.focus());
    } catch (failure) {
      setActionError(failure.message);
    }
  }

  if (status === 'loading') {
    return (
      <div className="stack-md" aria-busy="true">
        <p className="visually-hidden">Loading referral partners.</p>
        <Skeleton height="3rem" />
        <Skeleton height="3rem" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Referral partners could not be loaded"
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
          title="No referral partners yet"
          description="Add the organisations you work with. Learners with no identity document can then ask for one of them to help."
        />
      ) : (
        <ul className="referral-partners__list" role="list">
          {list.map((item) => (
            <li className="referral-partners__item" key={item.id}>
              {editingId === item.id ? (
                <ReferralPartnerForm
                  idPrefix={`rp-${item.id}`}
                  initial={{ name: item.name, email: item.email, phone: item.phone }}
                  submitLabel={`Save ${item.name}`}
                  onSubmit={(details) => update(item.id, details)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="referral-partners__details">
                    <p className="referral-partners__name">{item.name}</p>
                    <p className="referral-partners__contact">
                      <Mail aria-hidden="true" />
                      <span className="visually-hidden">Email: </span>
                      {item.email}
                    </p>
                    <p className="referral-partners__contact">
                      <Phone aria-hidden="true" />
                      <span className="visually-hidden">Phone: </span>
                      {item.phone}
                    </p>
                  </div>

                  {confirmingId === item.id ? (
                    <div className="referral-partners__confirm" role="group" aria-label={`Remove ${item.name}?`}>
                      <p>Remove {item.name}? Learners will no longer be able to choose it.</p>
                      <div className="referral-partners__actions">
                        <Button variant="primary" size="sm" onClick={() => remove(item)}>
                          Remove
                        </Button>
                        <Button size="sm" onClick={() => setConfirmingId(null)}>
                          Keep
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="referral-partners__actions">
                      <Button
                        id={`rp-edit-${item.id}`}
                        size="sm"
                        icon={Pencil}
                        aria-label={`Edit ${item.name}`}
                        onClick={() => setEditingId(item.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        icon={Trash2}
                        aria-label={`Remove ${item.name}`}
                        onClick={() => setConfirmingId(item.id)}
                      >
                        Remove
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
          Add a referral partner
        </h3>
        <ReferralPartnerForm idPrefix="rp-new" submitLabel="Add partner" onSubmit={add} />
      </section>
    </div>
  );
}
