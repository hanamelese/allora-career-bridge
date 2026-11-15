import { useCallback, useEffect, useMemo, useState } from 'react';
import { DisplayContext } from './displayContext.js';
import { applySettings, loadSettings, saveSettings } from './displaySettings.js';

/**
 * Holds the dashboard's display settings and keeps <html> in step with
 * them. A change is saved in this browser and applied at once.
 */
export function DisplayProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  /* When motion follows the system, follow it live too. */
  useEffect(() => {
    if (settings.motion !== null) return undefined;

    let query;
    try {
      query = window.matchMedia('(prefers-reduced-motion: reduce)');
    } catch {
      return undefined;
    }

    const onChange = () => applySettings(settings);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [settings]);

  const update = useCallback((patch) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);

  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>;
}
