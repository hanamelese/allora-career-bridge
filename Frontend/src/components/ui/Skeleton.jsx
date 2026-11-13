import './Skeleton.css';

/**
 * A placeholder shape for content that is still loading.
 *
 * It is aria-hidden: the surrounding region announces "Loading..." once
 * through the live region, rather than every bar announcing itself.
 */
export function Skeleton({ width = '100%', height = '1rem', radius = 'var(--radius-sm)', className = '' }) {
  return (
    <span
      className={['skeleton', className].filter(Boolean).join(' ')}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
