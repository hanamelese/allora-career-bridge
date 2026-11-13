/**
 * Matching a spoken answer to one of the options on screen.
 *
 * The normaliser is Unicode-aware: an earlier version used \w, which
 * strips Ethiopic script to an empty string and so could never match a
 * single Amharic answer.
 */

function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(text) {
  return normalize(text)
    .split(' ')
    .filter((word) => word.length >= 2);
}

/**
 * Returns the option that was probably meant, with how sure we are.
 *
 * 'high'   - the words line up; offer it as the answer.
 * 'medium' - only part of it lines up; ask before using it.
 * 'none'   - nothing recognisable; let the learner try again or pick.
 */
export function matchSpokenChoice(spokenText, options = []) {
  const spoken = normalize(spokenText);

  if (!spoken || options.length === 0) {
    return { option: null, confidence: 'none' };
  }

  for (const option of options) {
    const label = normalize(option.label);
    const value = normalize(String(option.value));

    if (label === spoken || (value && value === spoken)) {
      return { option, confidence: 'high' };
    }
  }

  for (const option of options) {
    const label = normalize(option.label);

    if (label && (label.includes(spoken) || spoken.includes(label))) {
      return { option, confidence: 'high' };
    }
  }

  const spokenWords = words(spokenText);

  for (const option of options) {
    const optionWords = words(option.label);

    if (optionWords.some((word) => spokenWords.includes(word))) {
      return { option, confidence: 'medium' };
    }
  }

  return { option: null, confidence: 'none' };
}
