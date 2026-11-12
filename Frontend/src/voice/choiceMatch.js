/**
 * Normalizes text for matching by removing punctuation and converting to lowercase.
 */
function normalize(str = '') {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Matches a spoken transcript against a list of options.
 * @param {string} spokenText - What the learner said
 * @param {Array} options - List of { value, label }
 * @returns {Object} - { matchedOption, confidence: 'high' | 'medium' | 'none' }
 */
export function matchSpokenChoice(spokenText, options = []) {
  if (!spokenText || options.length === 0) {
    return { matchedOption: null, confidence: 'none' };
  }

  const cleanSpoken = normalize(spokenText);
  const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

  // 1. Exact match on label or value
  for (const opt of options) {
    const cleanLabel = normalize(opt.label);
    const cleanValue = normalize(opt.value);
    if (cleanSpoken === cleanLabel || cleanSpoken === cleanValue) {
      return { matchedOption: opt, confidence: 'high' };
    }
  }

  // 2. Substring match (e.g., saying "refugee" matches "Refugee ID")
  for (const opt of options) {
    const cleanLabel = normalize(opt.label);
    if (cleanLabel.includes(cleanSpoken) || cleanSpoken.includes(cleanLabel)) {
      return { matchedOption: opt, confidence: 'high' };
    }
  }

  // 3. Word-level match (e.g., saying "passport" matches "National ID or Passport")
  for (const opt of options) {
    const cleanLabel = normalize(opt.label);
    const labelWords = cleanLabel.split(/\s+/).filter(Boolean);
    const hasCommonWord = spokenWords.some((word) =>
      word.length > 2 && labelWords.includes(word)
    );

    if (hasCommonWord) {
      return { matchedOption: opt, confidence: 'medium' };
    }
  }

  return { matchedOption: null, confidence: 'none' };
}

export default {
  matchSpokenChoice
};
