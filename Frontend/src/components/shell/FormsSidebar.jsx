import { NavLink } from 'react-router-dom';
import { FORM_TYPES } from '../../formTypes.js';
import './FormsSidebar.css';

/**
 * The forms list.
 *
 * These are routes, not tab panels, so this is a navigation landmark with
 * links and `aria-current="page"` on the active one - which is what both
 * the keyboard and a screen reader expect from navigation. Each entry
 * carries a one-line summary so staff can tell the four forms apart
 * without opening them.
 */
export function FormsSidebar({ id, isOpen = false, onNavigate }) {
  return (
    <nav
      id={id}
      className={['forms-sidebar', isOpen ? 'forms-sidebar--open' : ''].filter(Boolean).join(' ')}
      aria-label="Forms"
    >
      <h2 className="forms-sidebar__heading">Forms</h2>

      <ul className="forms-sidebar__list" role="list">
        {FORM_TYPES.map((formType) => {
          const Icon = formType.icon;

          return (
            <li key={formType.id}>
              <NavLink
                to={`/forms/${formType.slug}/configure`}
                className={({ isActive }) =>
                  ['forms-sidebar__link', isActive ? 'forms-sidebar__link--active' : '']
                    .filter(Boolean)
                    .join(' ')
                }
                onClick={onNavigate}
              >
                <Icon className="forms-sidebar__icon" aria-hidden="true" />
                <span className="forms-sidebar__text">
                  <span className="forms-sidebar__name">{formType.name}</span>
                  <span className="forms-sidebar__summary">{formType.summary}</span>
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
