import { useT } from '../../i18n/index.js';
import './SkipLink.css';

/** The first thing in the tab order: a way past the navigation. */
export function SkipLink({ targetId = 'main-content', children }) {
  const t = useT();

  return (
    <a className="skip-link visually-hidden-focusable" href={`#${targetId}`}>
      {children ?? t('common.skipToContent')}
    </a>
  );
}
