import { useEffect, useRef, useState } from 'react';
import { buildReferralMessage, REFERRAL_LINK_PLACEHOLDER } from '@onboarding/contracts/referrals.js';

const COPY = {
  en: {
    none: 'This organisation has not listed any partner organisations yet. You can still finish and send this form, and staff will contact you.',
    choose: 'Choose the organisations to contact',
    sendLink: 'Send link',
    needOne: 'Choose at least one organisation to send the link.',
    unavailable: 'Sending a link is not available here.',
    dialogTitle: 'Send a text message to these organisations?',
    recipients: 'It will go to:',
    preview: 'Each organisation gets this message, with its own private link:',
    confirm: 'Yes, send it',
    cancel: 'Cancel',
    sending: 'Sending…',
    sent: 'Link sent',
    sentTo: (name) => `Link sent to ${name}.`,
    failedTo: (name) => `The link could not be sent to ${name}. You can try again.`,
    notConfigured:
      'Text messages cannot be sent at the moment. Nothing was sent. You can still finish and send this form, and staff will contact you.',
    tooMany: 'Too many links were sent from here in a short time. Please wait a few minutes and try again.',
    failed: 'The link could not be sent. Nothing was sent. Please try again.',
    summarySent: (count) => `The link was sent to ${count} ${count === 1 ? 'organisation' : 'organisations'}.`,
  },
  am: {
    none: 'ይህ ድርጅት እስካሁን አጋር ድርጅቶችን አልዘረዘረም። አሁንም ይህን ቅጽ ጨርሰው መላክ ይችላሉ፤ ሠራተኞች ያገኙዎታል።',
    choose: 'የሚገናኟቸውን ድርጅቶች ይምረጡ',
    sendLink: 'ማስፈንጠሪያ ላክ',
    needOne: 'ማስፈንጠሪያውን ለመላክ ቢያንስ አንድ ድርጅት ይምረጡ።',
    unavailable: 'እዚህ ማስፈንጠሪያ መላክ አይቻልም።',
    dialogTitle: 'ለእነዚህ ድርጅቶች የጽሑፍ መልዕክት ይላክ?',
    recipients: 'የሚላከው ለ፦',
    preview: 'እያንዳንዱ ድርጅት የራሱን የግል ማስፈንጠሪያ የያዘ ይህን መልዕክት ይቀበላል፦',
    confirm: 'አዎ፣ ላክ',
    cancel: 'ሰርዝ',
    sending: 'በመላክ ላይ…',
    sent: 'ማስፈንጠሪያው ተልኳል',
    sentTo: (name) => `ማስፈንጠሪያው ለ${name} ተልኳል።`,
    failedTo: (name) => `ማስፈንጠሪያው ለ${name} ሊላክ አልቻለም። እንደገና መሞከር ይችላሉ።`,
    notConfigured:
      'በአሁኑ ጊዜ የጽሑፍ መልዕክት መላክ አይቻልም። ምንም አልተላከም። አሁንም ይህን ቅጽ ጨርሰው መላክ ይችላሉ፤ ሠራተኞች ያገኙዎታል።',
    tooMany: 'በአጭር ጊዜ ውስጥ ብዙ ማስፈንጠሪያዎች ተልከዋል። እባክዎ ጥቂት ደቂቃዎች ጠብቀው እንደገና ይሞክሩ።',
    failed: 'ማስፈንጠሪያው ሊላክ አልቻለም። ምንም አልተላከም። እባክዎ እንደገና ይሞክሩ።',
    summarySent: (count) => `ማስፈንጠሪያው ለ${count} ድርጅት(ዎች) ተልኳል።`,
  },
};

/**
 * The referral step, for a learner with no identity document.
 *
 * The learner ticks one or more of the partner's referral organisations,
 * then presses Send link. Nothing is sent until they have read the exact
 * message in a confirmation dialog and agreed. The host's `onSend` talks
 * to the server, and "sent" is only ever shown for an organisation the
 * server says the SMS provider accepted.
 *
 * `status` lives with the renderer, not here, so going Back and returning
 * does not forget what was already sent (and invite sending it twice).
 */
export function ReferralAnswer({
  question,
  value,
  onChange,
  describedBy,
  hasError,
  answers = {},
  referral,
  referralStatus,
  onReferralStatus,
}) {
  const copy = COPY[question.language] ?? COPY.en;
  const language = question.language ?? 'en';
  const selected = Array.isArray(value) ? value : [];
  const status = referralStatus ?? {};

  const [isConfirming, setIsConfirming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const dialogRef = useRef(null);
  const sendRef = useRef(null);
  const statusRef = useRef(null);
  const restoreFocusRef = useRef(false);

  const pending = selected.filter((id) => status[id] !== 'sent');
  const canSend = Boolean(referral?.onSend) && pending.length > 0 && !isSending;
  const nameOf = (id) => question.options.find((option) => option.value === id)?.label ?? id;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isConfirming && !dialog.open) dialog.showModal();
    if (!isConfirming && dialog.open) dialog.close();

    /* Only after the dialog has closed - otherwise the browser's own focus
       restore runs last and wins. Back to Send link, or, once everything is
       sent and it is disabled, to the result, so focus is never lost. */
    if (!isConfirming && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      if (sendRef.current && !sendRef.current.disabled) sendRef.current.focus();
      else statusRef.current?.focus();
    }
  });

  /* Escape closes through React state, and focus goes back to Send link. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    function handleCancel(event) {
      event.preventDefault();
      closeDialog();
    }

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  });

  function closeDialog() {
    restoreFocusRef.current = true;
    setIsConfirming(false);
  }

  function toggle(id, checked) {
    onChange(checked ? [...selected, id] : selected.filter((current) => current !== id));
  }

  async function send() {
    setIsSending(true);
    setMessage('');

    try {
      const { results } = await referral.onSend({
        partnerIds: pending,
        learner: {
          name: String(answers.name ?? '').trim(),
          ...(answers.phone ? { phone: String(answers.phone).trim() } : {}),
        },
        language,
      });

      const next = { ...status };
      const lines = [];

      for (const result of results) {
        next[result.partnerId] = result.status === 'sent' ? 'sent' : 'failed';
        lines.push(
          result.status === 'sent' ? copy.sentTo(nameOf(result.partnerId)) : copy.failedTo(nameOf(result.partnerId)),
        );
      }

      onReferralStatus(next);
      setMessage(lines.join(' '));
    } catch (error) {
      setMessage(
        error?.code === 'sms_not_configured'
          ? copy.notConfigured
          : error?.code === 'rate_limited'
            ? copy.tooMany
            : copy.failed,
      );
    } finally {
      setIsSending(false);
      closeDialog();
    }
  }

  if (question.options.length === 0) {
    return <p className="fe-question__note">{copy.none}</p>;
  }

  const previewText = buildReferralMessage({
    organisationName: referral?.organisationName ?? '',
    learnerName: String(answers.name ?? '').trim(),
    learnerPhone: answers.phone ? String(answers.phone) : undefined,
    link: REFERRAL_LINK_PLACEHOLDER[language] ?? REFERRAL_LINK_PLACEHOLDER.en,
    language,
  });

  const hintId = `fe-${question.key}-send-hint`;
  const sentCount = Object.values(status).filter((state) => state === 'sent').length;

  return (
    <div className="fe-referral">
      <fieldset
        className={`fe-options${hasError ? ' fe-options--invalid' : ''}`}
        aria-describedby={describedBy}
      >
        <legend className="fe-referral__legend">{copy.choose}</legend>

        {question.options.map((option) => {
          const id = `fe-${question.key}-${option.value}`;
          const isSent = status[option.value] === 'sent';
          const isChecked = selected.includes(option.value) || isSent;

          return (
            <label className="fe-option" htmlFor={id} key={option.value}>
              <input
                type="checkbox"
                id={id}
                className="fe-option__input"
                checked={isChecked}
                disabled={isSent}
                onChange={(event) => toggle(option.value, event.target.checked)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    if (!isSent) toggle(option.value, !isChecked);
                  }
                }}
              />
              <span className="fe-option__label">
                {option.label}
                {isSent ? <span className="fe-referral__sent"> — {copy.sent}</span> : null}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="fe-referral__send">
        <button
          type="button"
          ref={sendRef}
          className="fe-button fe-button--primary"
          disabled={!canSend}
          aria-describedby={canSend ? undefined : hintId}
          onClick={() => setIsConfirming(true)}
        >
          {isSending ? copy.sending : copy.sendLink}
        </button>

        {!canSend && !isSending ? (
          <p className="fe-question__help" id={hintId}>
            {referral?.onSend ? (pending.length === 0 && sentCount > 0 ? copy.summarySent(sentCount) : copy.needOne) : copy.unavailable}
          </p>
        ) : null}
      </div>

      <p className="fe-referral__status" role="status" aria-live="polite" ref={statusRef} tabIndex={-1}>
        {message}
      </p>

      <dialog className="fe-dialog" ref={dialogRef} aria-labelledby={`fe-${question.key}-dialog-title`}>
        <h2 className="fe-dialog__title" id={`fe-${question.key}-dialog-title`}>
          {copy.dialogTitle}
        </h2>

        <p>{copy.recipients}</p>
        <ul className="fe-dialog__list">
          {pending.map((id) => (
            <li key={id}>{nameOf(id)}</li>
          ))}
        </ul>

        <p>{copy.preview}</p>
        <p className="fe-dialog__message" lang={language}>
          {previewText}
        </p>

        <div className="fe-actions">
          <button type="button" className="fe-button" onClick={closeDialog} disabled={isSending}>
            {copy.cancel}
          </button>
          <button type="button" className="fe-button fe-button--primary" onClick={send} disabled={isSending}>
            {isSending ? copy.sending : copy.confirm}
          </button>
        </div>
      </dialog>
    </div>
  );
}
