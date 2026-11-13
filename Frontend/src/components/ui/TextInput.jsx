import { useId } from 'react';
import './TextInput.css';

/**
 * A labelled text field.
 *
 * The label is a real <label>, and help text and error messages are linked
 * through aria-describedby with the error first, so a screen reader reads
 * the problem before the hint. An error also carries role="alert" so it is
 * announced when it appears.
 */
export function TextInput({
  label,
  value,
  onChange,
  help,
  error,
  multiline = false,
  rows = 2,
  hideLabel = false,
  lang,
  id: providedId,
  ...rest
}) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  const describedBy =
    [error ? errorId : null, help ? helpId : null].filter(Boolean).join(' ') || undefined;

  const Element = multiline ? 'textarea' : 'input';

  return (
    <div className="text-input">
      <label
        className={['text-input__label', hideLabel ? 'visually-hidden' : ''].filter(Boolean).join(' ')}
        htmlFor={id}
      >
        {label}
      </label>

      <Element
        id={id}
        className={['text-input__control', error ? 'text-input__control--invalid' : '']
          .filter(Boolean)
          .join(' ')}
        value={value}
        lang={lang}
        rows={multiline ? rows : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange?.(event.target.value)}
        {...rest}
      />

      {error ? (
        <p className="text-input__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}

      {help ? (
        <p className="text-input__help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}
