import './Button.css';

/**
 * A button.
 *
 * By default this is a real <button>, so keyboard activation, focus order
 * and screen-reader semantics come from the platform. Pass `as` to render
 * a navigation element instead - a link that looks like a button is still
 * a link, and should be one in the markup.
 *
 * For an icon-only button pass `label`: it becomes the accessible name.
 * A title attribute on its own is not a label.
 */
export function Button({
  as: Element = 'button',
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  label,
  children,
  className = '',
  type,
  ...rest
}) {
  const iconOnly = Boolean(Icon) && !children;
  const isNativeButton = Element === 'button';

  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    iconOnly ? 'button--icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Element
      className={classes}
      type={isNativeButton ? (type ?? 'button') : type}
      aria-label={iconOnly ? label : undefined}
      {...rest}
    >
      {Icon ? <Icon className="button__icon" aria-hidden="true" /> : null}
      {children}
    </Element>
  );
}
