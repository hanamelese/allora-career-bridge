import { createContext, useContext } from 'react';

/** `{ settings, update(patch) }` - see DisplayProvider. */
export const DisplayContext = createContext(null);

export function useDisplay() {
  const value = useContext(DisplayContext);
  if (!value) throw new Error('useDisplay must be used inside DisplayProvider.');
  return value;
}
