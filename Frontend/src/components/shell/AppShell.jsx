import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { LiveRegion } from '../ui/LiveRegion.jsx';
import { SkipLink } from '../ui/SkipLink.jsx';
import { FormsSidebar } from './FormsSidebar.jsx';
import { getFormTypeBySlug } from '../../formTypes.js';
import './AppShell.css';

/**
 * The dashboard frame: a banner, the forms navigation, and the workspace.
 *
 * Landmarks are real elements - header, nav, main - so a screen-reader
 * user can jump straight to the part they want.
 *
 * Moving between views does not reload the page, so nothing would
 * otherwise tell a screen-reader user that the content changed. The shell
 * announces each change politely through one shared live region.
 */
export function AppShell() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();

  // Read the slug from the path rather than useParams: this is the layout
  // route, so the child route's :formSlug is not among its own params.
  // Derived during render rather than in an effect, which also means the
  // region is not announced on first load - only on a real change.
  const [section, formSlug, view] = location.pathname.split('/').filter(Boolean);
  const activeFormType = section === 'forms' ? getFormTypeBySlug(formSlug) : null;
  const announcement =
    activeFormType && view ? `${activeFormType.name}, ${view} view.` : '';

  return (
    <div className="app-shell">
      <SkipLink />
      <LiveRegion message={announcement} />

      <header className="app-shell__header">
        <div className="app-shell__brand">
          <Button
            className="app-shell__nav-toggle"
            variant="quiet-inverse"
            icon={Menu}
            label={isNavOpen ? 'Hide forms navigation' : 'Show forms navigation'}
            aria-expanded={isNavOpen}
            aria-controls="forms-navigation"
            onClick={() => setIsNavOpen((open) => !open)}
          />
          <div>
            <p className="app-shell__product">Partner Dashboard</p>
            <p className="app-shell__tagline">Accessible Onboarding</p>
          </div>
        </div>

        <div className="app-shell__account">
          <span className="app-shell__org">ALX Ethiopia</span>
        </div>
      </header>

      <div className="app-shell__body">
        <FormsSidebar
          id="forms-navigation"
          isOpen={isNavOpen}
          onNavigate={() => setIsNavOpen(false)}
        />

        <main className="app-shell__main" id="main-content" tabIndex={-1}>
          <div className="app-shell__content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
