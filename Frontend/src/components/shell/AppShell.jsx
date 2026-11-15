import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { House, LogOut } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { LiveRegion } from '../ui/LiveRegion.jsx';
import { SkipLink } from '../ui/SkipLink.jsx';
import { FormsSidebar } from './FormsSidebar.jsx';
import { BrandMark } from './BrandMark.jsx';
import { AccessibilityBar } from './AccessibilityBar.jsx';
import { useT } from '../../i18n/index.js';
import { getFormTypeBySlug } from '../../formTypes.js';
import { useAuth } from '../../auth/authContext.js';
import './AppShell.css';

/**
 * The dashboard frame: a banner, the forms navigation, and the workspace.
 *
 * Landmarks are real elements - header, nav, main - so a screen-reader
 * user can jump straight to the part they want.
 *
 * The brand and a labelled Home button both lead back to the front page,
 * so the way home is visible, not only known. The display controls (text
 * size, contrast, motion, language) sit in the header too.
 *
 * The header's height changes with those controls and with the text
 * size, so it is measured and shared as --header-height, which keeps the
 * sidebar tucked exactly beneath it.
 *
 * Moving between views does not reload the page, so nothing would
 * otherwise tell a screen-reader user that the content changed. The shell
 * announces each change politely through one shared live region.
 */
export function AppShell() {
  const { partner, signOut } = useAuth();
  const location = useLocation();
  const t = useT();
  const headerRef = useRef(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header || typeof ResizeObserver === 'undefined') return undefined;

    const root = document.documentElement;
    let frame = 0;
    let last = 0;
    /* Written on the next frame, and only when it changed, so the update
       never re-enters the observer within one layout. */
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = header.offsetHeight;
        if (height === last) return;
        last = height;
        root.style.setProperty('--header-height', `${height}px`);
      });
    });
    observer.observe(header);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.style.removeProperty('--header-height');
    };
  }, []);

  // Read the slug from the path rather than useParams: this is the layout
  // route, so the child route's :formSlug is not among its own params.
  // Derived during render rather than in an effect, which also means the
  // region is not announced on first load - only on a real change.
  const [section, formSlug, view] = location.pathname.split('/').filter(Boolean);
  const activeFormType = section === 'forms' ? getFormTypeBySlug(formSlug) : null;
  const announcement =
    activeFormType && view
      ? t('shell.announce.view', t(`formTypes.${activeFormType.id}.name`), t(`shell.workflow.${view}.label`))
      : section === 'organisation'
        ? t('shell.announce.organisation')
        : '';

  return (
    <div className="app-shell">
      <SkipLink />
      <LiveRegion message={announcement} />

      <header className="app-shell__header" ref={headerRef}>
        <Link to="/" className="app-shell__brand">
          <BrandMark className="app-shell__logo" />
          <span className="app-shell__brand-text">
            <span className="app-shell__product">{t('shell.product')}</span>
            <span className="app-shell__tagline">{t('shell.tagline')}</span>
          </span>
        </Link>

        <div className="app-shell__account">
          <span className="app-shell__org">{partner?.name}</span>
          <Button as={Link} to="/" variant="ghost" size="sm" icon={House} className="app-shell__home">
            {t('shell.home')}
          </Button>
          <Button variant="secondary" size="sm" icon={LogOut} onClick={signOut}>
            {t('shell.signOut')}
          </Button>
        </div>

        <AccessibilityBar />
      </header>

      <div className="app-shell__body">
        <FormsSidebar id="forms-navigation" />

        <main className="app-shell__main" id="main-content" tabIndex={-1}>
          <div className="app-shell__content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
