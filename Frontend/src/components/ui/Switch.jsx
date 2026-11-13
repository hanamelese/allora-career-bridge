import './Switch.css';

/**
 * An on/off control backed by a real <input type="checkbox">.
 *
 * It looks like a switch and behaves like a checkbox, which is what
 * assistive technology and the keyboard already understand. A locked
 * control is rendered checked and disabled with a plain-language reason,
 * rather than hidden - a partner should be able to see that a field is
 * on and read why it cannot be turned off.
 */
export function Switch({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  lockedReason,
  className = '',
}) {
  const descriptionId = description ? `${id}-description` : null;
  const lockedId = lockedReason ? `${id}-locked` : null;
  const describedBy = [descriptionId, lockedId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={['switch', disabled ? 'switch--disabled' : '', className].filter(Boolean).join(' ')}>
      <div className="switch__control">
        <input
          type="checkbox"
          id={id}
          className="switch__input"
          checked={checked}
          disabled={disabled}
          aria-describedby={describedBy}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <label className="switch__label" htmlFor={id}>
          <span className="switch__track" aria-hidden="true">
            <span className="switch__thumb" />
          </span>
          <span className="switch__text">{label}</span>
        </label>
      </div>

      {description ? (
        <p className="switch__description" id={descriptionId}>
          {description}
        </p>
      ) : null}

      {lockedReason ? (
        <p className="switch__locked" id={lockedId}>
          {lockedReason}
        </p>
      ) : null}
    </div>
  );
}
