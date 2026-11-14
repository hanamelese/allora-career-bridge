import { useState } from 'react';
import { referralPartnerSchema } from '@onboarding/contracts';
import { Button } from '../ui/Button.jsx';
import { TextInput } from '../ui/TextInput.jsx';

const EMPTY = { name: '', email: '', phone: '' };

/**
 * Add or edit one referral partner.
 *
 * Checked with the same schema the API uses, so a partner hears about a
 * problem at the field, before saving. All three details are required:
 * the phone number is where the referral SMS goes.
 */
export function ReferralPartnerForm({ initial = EMPTY, idPrefix, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function set(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const parsed = referralPartnerSchema.safeParse(values);

    if (!parsed.success) {
      const next = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);

      /* Take the partner to the first thing that needs fixing. */
      const first = ['name', 'email', 'phone'].find((key) => next[key]);
      document.getElementById(`${idPrefix}-${first}`)?.focus();
      return;
    }

    setIsSaving(true);

    try {
      await onSubmit(parsed.data);
      if (initial === EMPTY) setValues(EMPTY);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="referral-form" onSubmit={handleSubmit} noValidate>
      <p className="referral-form__note">All three details are required.</p>

      <div className="referral-form__fields">
        <TextInput
          id={`${idPrefix}-name`}
          label="Organisation name *"
          value={values.name}
          onChange={(value) => set('name', value)}
          error={errors.name}
          required
          autoComplete="organization"
        />
        <TextInput
          id={`${idPrefix}-email`}
          label="Email address *"
          type="email"
          value={values.email}
          onChange={(value) => set('email', value)}
          error={errors.email}
          required
          autoComplete="email"
        />
        <TextInput
          id={`${idPrefix}-phone`}
          label="Mobile number for SMS *"
          type="tel"
          value={values.phone}
          onChange={(value) => set('phone', value)}
          error={errors.phone}
          help="Start with the country code, for example +251 911 234 567. Referral links are sent here by SMS."
          required
          autoComplete="tel"
        />
      </div>

      {formError ? (
        <p className="referral-form__error" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="referral-form__actions">
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? 'Saving…' : submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
