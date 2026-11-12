const CONSENT_STORAGE_KEY = 'alx_voice_consent';

/**
 * Check if the learner has given consent for speech services.
 */
export function hasVoiceConsent() {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === 'granted';
  } catch (e) {
    return false;
  }
}

/**
 * Save user consent choice (granted or denied).
 */
export function setVoiceConsent(granted) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, granted ? 'granted' : 'denied');
  } catch (e) {
    // If storage is unavailable
  }
}

/**
 * Plain-language privacy text for cloud audio.
 */
export const VOICE_CONSENT_TEXT = {
  title: 'Voice Input Privacy Notice',
  message:
    'To type with your voice, your browser may send your spoken words to a speech service. It is only used to fill this answer and never saved for advertising. Do you want to use voice typing?',
  allowBtn: 'Yes, use voice typing',
  denyBtn: 'No, type with keyboard'
};

export default {
  hasVoiceConsent,
  setVoiceConsent,
  VOICE_CONSENT_TEXT
};
