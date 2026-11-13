import './StateViews.css';

/** Shown when there is genuinely nothing yet - and what to do about it. */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="state-view">
      {Icon ? (
        <span className="state-view__icon state-view__icon--neutral" aria-hidden="true">
          <Icon />
        </span>
      ) : null}
      <h3 className="state-view__title">{title}</h3>
      {description ? <p className="state-view__description">{description}</p> : null}
      {action ? <div className="state-view__action">{action}</div> : null}
    </div>
  );
}
