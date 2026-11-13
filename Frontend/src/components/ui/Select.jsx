import { useId } from 'react';
import './Select.css';

/** A labelled native <select>. Native, so the platform supplies the behaviour. */
export function Select({ label, value, onChange, options, help, hideLabel = false, id: providedId, ...rest }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const helpId = `${id}-help`;

  return (
    <div className="select">
      <label
        className={['select__label', hideLabel ? 'visually-hidden' : ''].filter(Boolean).join(' ')}
        htmlFor={id}
      >
        {label}
      </label>

      <select
        id={id}
        className="select__control"
        value={value}
        aria-describedby={help ? helpId : undefined}
        onChange={(event) => onChange?.(event.target.value)}
        {...rest}
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {help ? (
        <p className="select__help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}
