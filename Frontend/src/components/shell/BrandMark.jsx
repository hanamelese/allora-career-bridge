/**
 * The Allora Accessibility Bridge mark: its initials on the brand
 * gradient. Decorative - the name always appears as text beside it.
 */
export function BrandMark({ className = '' }) {
  return (
    <span className={className} aria-hidden="true">
      AB
    </span>
  );
}
