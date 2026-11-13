/**
 * A single, always-mounted live region.
 *
 * The node has to exist before its text changes, otherwise assistive
 * technology has nothing to watch - so this renders even when empty.
 * One region per app keeps announcements from colliding.
 */
export function LiveRegion({ message = '', mode = 'polite' }) {
  return (
    <div
      className="visually-hidden"
      role={mode === 'assertive' ? 'alert' : 'status'}
      aria-live={mode}
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
