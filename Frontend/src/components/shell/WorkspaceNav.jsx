import { NavLink } from 'react-router-dom';
import { useT } from '../../i18n/index.js';
import './WorkspaceNav.css';

/**
 * The partner's workflow, in the order it happens: configure the form,
 * check how it will look, publish it, then take the tag that puts the
 * published version on their site. Each step is a card; the current one
 * is marked, and pressing one gives a small press-down.
 *
 * Like the sidebar these are routes, so they are links with
 * `aria-current`, not ARIA tabs - announcing "tab" for something that
 * navigates would misdescribe what pressing it does.
 */
const VIEWS = ['configure', 'preview', 'publish', 'embed'];

export function WorkspaceNav({ formSlug }) {
  const t = useT();

  return (
    <nav className="workspace-nav" aria-label={t('shell.workflow.label')}>
      <ul className="workspace-nav__list" role="list">
        {VIEWS.map((view, index) => (
          <li key={view}>
            <NavLink
              to={`/forms/${formSlug}/${view}`}
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
                <span className="workspace-nav__label">{t(`shell.workflow.${view}.label`)}</span>
                <span className="workspace-nav__description">{t(`shell.workflow.${view}.description`)}</span>
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
