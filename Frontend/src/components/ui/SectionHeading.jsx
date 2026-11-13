import './SectionHeading.css';

/**
 * A heading with optional supporting text and trailing actions.
 *
 * `level` is explicit so each screen keeps a correct heading outline
 * instead of picking a tag for its appearance.
 */
export function SectionHeading({ level = 2, title, description, actions, id }) {
  const Heading = `h${level}`;

  return (
    <div className="section-heading">
      <div className="section-heading__text">
        <Heading className="section-heading__title" id={id}>
          {title}
        </Heading>
        {description ? <p className="section-heading__description">{description}</p> : null}
      </div>
      {actions ? <div className="section-heading__actions">{actions}</div> : null}
    </div>
  );
}
