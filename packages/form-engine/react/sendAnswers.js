/**
 * Handing checked answers to the host, which may store them.
 *
 * A host's `onSubmit` either returns nothing (the dashboard preview) or a
 * promise (the embedded form, which stores the answers first). The form
 * says "sent" only once the promise has resolved; if it rejects, the
 * learner keeps every answer and can try again.
 *
 * Returns a promise that settles once the outcome is known, so callers and
 * tests can wait for it; it never rejects.
 */
export function sendAnswers(onSubmit, data, { onSending, onSent, onFailed }) {
  let outcome;

  try {
    outcome = onSubmit?.(data);
  } catch (error) {
    onFailed(error);
    return Promise.resolve(false);
  }

  if (!outcome || typeof outcome.then !== 'function') {
    onSent();
    return Promise.resolve(true);
  }

  onSending();

  return Promise.resolve(outcome).then(
    () => {
      onSent();
      return true;
    },
    (error) => {
      onFailed(error);
      return false;
    },
  );
}
