import { NavLink } from 'react-router-dom';
import './WorkspaceNav.css';

/**
 * The three steps of the partner's workflow, in the order they happen:
 * configure the form, check how it will look, then publish it.
 *
 * Like the sidebar these are routes, so they are links with
 * `aria-current`, not ARIA tabs - announcing "tab" for something that
 * navigates would misdescribe what pressing it does.
 */
const VIEWS = [
  { slug: 'configure', label: 'Configure', description: 'Choose fields and settings' },
  { slug: 'preview', label: 'Preview', description: 'See the learner experience' },
  { slug: 'publish', label: 'Publish', description: 'Save, publish and embed' },
];

export function WorkspaceNav({ formSlug }) {
  return (
    <nav className="workspace-nav" aria-label="Form workflow">
      <ul className="workspace-nav__list" role="list">
        {VIEWS.map((view, index) => (
          <li key={view.slug}>
            <NavLink
              to={`/forms/${formSlug}/${view.slug}`}
              className={({ isActive }) =>
                ['workspace-nav__link', isActive ? 'workspace-nav__link--active' : '']
                  .filter(Boolean)
                  .join(' ')
              }
            >
              <span className="workspace-nav__step" aria-hidden="true">
                {index + 1}
              </span>
              <span className="workspace-nav__text">
                <span className="workspace-nav__label">{view.label}</span>
                <span className="workspace-nav__description">{view.description}</span>
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
