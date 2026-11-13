import './SkipLink.css';

/** The first thing in the tab order: a way past the navigation. */
export function SkipLink({ targetId = 'main-content', children = 'Skip to main content' }) {
  return (
    <a className="skip-link visually-hidden-focusable" href={`#${targetId}`}>
      {children}
    </a>
  );
}
