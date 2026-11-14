import { NavLink } from 'react-router-dom';
import { Building } from 'lucide-react';
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
 *
 * It is static: always shown, never collapsed, and it stays in place while
 * the workspace beside it scrolls. On a phone-width screen it becomes a
 * strip of links across the top instead, so the workspace keeps its width.
 */
export function FormsSidebar({ id }) {
  return (
    <nav
      id={id}
      className="forms-sidebar"
      aria-label="Dashboard"
    >
      <h2 className="forms-sidebar__heading">Organisation</h2>

      <ul className="forms-sidebar__list forms-sidebar__list--section" role="list">
        <li>
          <NavLink
            to="/organisation"
            className={({ isActive }) =>
              ['forms-sidebar__link', isActive ? 'forms-sidebar__link--active' : '']
                .filter(Boolean)
                .join(' ')
            }
          >
            <Building className="forms-sidebar__icon" aria-hidden="true" />
            <span className="forms-sidebar__text">
              <span className="forms-sidebar__name">Referral partners</span>
              <span className="forms-sidebar__summary">Organisations learners can be referred to</span>
            </span>
          </NavLink>
        </li>
      </ul>

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
