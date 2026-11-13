import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, setAuthToken, setUnauthorizedHandler } from '../api/http.js';
import { AuthContext } from './authContext.js';

/**
 * Who is signed in.
 *
 * The token is kept in sessionStorage, so it goes when the tab is closed
 * and is never shared with another site. It is the only credential the
 * browser ever holds: the partner's secret key stays on the server.
 */
const STORAGE_KEY = 'partner-dashboard.session';

function readStoredSession() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeSession(session) {
  try {
    if (session) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* Storage can be blocked; the session then lasts for this page only. */
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = readStoredSession();
    if (stored?.token) setAuthToken(stored.token);
    return stored;
  });

  const signOut = useCallback(() => {
    setAuthToken(null);
    storeSession(null);
    setSession(null);
  }, []);

  /* A rejected token means the session is over, wherever it was noticed. */
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const signIn = useCallback(async (email, password) => {
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });

    const next = { token: result.token, partner: result.partner, user: result.user };

    setAuthToken(next.token);
    storeSession(next);
    setSession(next);

    return next;
  }, []);

  const value = useMemo(
    () => ({
      isSignedIn: Boolean(session?.token),
      partner: session?.partner ?? null,
      user: session?.user ?? null,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
