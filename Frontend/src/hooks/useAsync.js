import { useCallback, useEffect, useState } from 'react';

/**
 * Runs an async read and tracks its three honest outcomes: loading, an
 * error the user can act on, or data.
 *
 * `reload` re-runs the same request, which is what the error state's
 * "Try again" needs. A request that resolves after the inputs changed is
 * discarded rather than overwriting newer data.
 */
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  // The caller passes a fresh closure each render; deps say when it matters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(asyncFn, deps);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', data: null, error: null });

    run()
      .then((data) => {
        if (active) setState({ status: 'success', data, error: null });
      })
      .catch((error) => {
        if (active) setState({ status: 'error', data: null, error });
      });

    return () => {
      active = false;
    };
  }, [run, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { ...state, reload };
}
