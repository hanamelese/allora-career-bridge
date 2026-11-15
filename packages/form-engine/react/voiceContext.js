import { createContext, useContext } from 'react';

/**
 * What the form's speaking parts share:
 *   voice          (text, language) => Promise<Blob>: the host's read-aloud
 *                  service (natural voices, including Amharic), or null for
 *                  the browser's own voice only;
 *   controlActive  whether hands-free Voice control is on, in which case
 *                  the per-question "Answer by speaking" button steps aside.
 */
export const VoiceContext = createContext({ voice: null, controlActive: false });

export function useVoiceContext() {
  return useContext(VoiceContext);
}
