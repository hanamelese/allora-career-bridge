import './Badge.css';

/**
 * A small status label. Colour alone never carries the meaning - the text
 * inside the badge always says what the state is.
 */
export function Badge({ tone = 'neutral', icon: Icon, children, className = '' }) {
  const classes = ['badge', `badge--${tone}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {Icon ? <Icon className="badge__icon" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
