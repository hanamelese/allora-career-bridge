import './Checkbox.css';

/** A plain, honest checkbox with its label and optional help text linked. */
export function Checkbox({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
}) {
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className={['checkbox', className].filter(Boolean).join(' ')}>
      <div className="checkbox__row">
        <input
          type="checkbox"
          id={id}
          className="checkbox__input"
          checked={checked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <label className="checkbox__label" htmlFor={id}>
          {label}
        </label>
      </div>

      {description ? (
        <p className="checkbox__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
