import './Card.css';

/**
 * A surface that groups related content. `as` lets a card be a section or
 * an article where that is the honest element, so the document outline
 * stays meaningful.
 */
export function Card({ as: Element = 'div', padding = 'md', className = '', children, ...rest }) {
  const classes = ['card', `card--pad-${padding}`, className].filter(Boolean).join(' ');

  return (
    <Element className={classes} {...rest}>
      {children}
    </Element>
  );
}
