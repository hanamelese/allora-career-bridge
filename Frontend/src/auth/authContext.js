import { createContext, useContext } from 'react';

/**
 * The signed-in session.
 *
 * Kept apart from the provider component so that editing the provider does
 * not reload every consumer, and so this file can hold the hook.
 */
export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
