import { OFFERED_IDENTITY_ROUTES } from '@onboarding/contracts';
import { Checkbox } from '../ui/Checkbox.jsx';
import { getIcon } from '../../icons.js';
import { useLanguage, useT } from '../../i18n/index.js';
import './IdentityRoutesEditor.css';

/* Resolved once, not per render: the icon for a route never changes. */
const ROUTES = OFFERED_IDENTITY_ROUTES.map((route) => ({ ...route, Icon: getIcon(route.icon) }));

/**
 * Which ways a learner may identify themselves.
 *
 * "I have no document, refer me" is offered permanently: the whole point of this
 * question is that it has no dead end, so the shared schema rejects any
 * configuration that removes it and the control here is fixed on.
 */
export function IdentityRoutesEditor({ selectedRoutes, error, onChange }) {
  const t = useT();
  const language = useLanguage();
  /* The route's name in the dashboard's language, with the other
     language's name under it. */
  const otherLanguage = language === 'am' ? 'en' : 'am';

  function toggleRoute(key, checked) {
    const next = checked
      ? OFFERED_IDENTITY_ROUTES.filter(
          (route) => route.key === key || selectedRoutes.includes(route.key),
        ).map((route) => route.key)
      : selectedRoutes.filter((route) => route !== key);

    onChange(next);
  }

  return (
    <div className="identity-routes">
      {error ? (
        <p className="identity-routes__error" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="identity-routes__list" role="list">
        {ROUTES.map((route) => {
          const isFixed = route.alwaysAvailable === true;

          return (
            <li className="identity-routes__item" key={route.key}>
              <span className="identity-routes__icon" aria-hidden="true">
                <route.Icon />
              </span>

              <Checkbox
                id={`identity-route-${route.key}`}
                label={route.label[language] ?? route.label.en}
                description={
                  isFixed
                    ? t('configure.identity.alwaysOffered')
                    : route.label[otherLanguage]
                }
                checked={isFixed || selectedRoutes.includes(route.key)}
                disabled={isFixed}
                onChange={(checked) => toggleRoute(route.key, checked)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
