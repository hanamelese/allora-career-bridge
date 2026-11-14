/**
 * Matching a spoken answer to one of the options on screen.
 *
 * The normaliser is Unicode-aware: an earlier version used \w, which
 * strips Ethiopic script to an empty string and so could never match a
 * single Amharic answer.
 *
 * The rule throughout is that a wrong selection is worse than none. When
 * what was heard fits more than one option equally well, the result is
 * 'ambiguous' and nothing is chosen.
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

const NONE = { option: null, confidence: 'none' };

/**
 * Returns the option that was probably meant, with how sure we are.
 *
 * 'high'      - the words line up with exactly one option; use it.
 * 'medium'    - only part of it lines up; ask before using it.
 * 'ambiguous' - it fits several options equally; `candidates` lists them.
 * 'none'      - nothing recognisable; let the learner try again or pick.
 */
export function matchSpokenChoice(spokenText, options = []) {
  const spoken = normalize(spokenText);

  if (!spoken || options.length === 0) {
    return NONE;
  }

  const labelled = options.map((option) => ({
    option,
    label: normalize(option.label),
    value: normalize(String(option.value)),
  }));

  /* 1. The whole answer is an option. */
  const exact = labelled.find(({ label, value }) => label === spoken || (value && value === spoken));
  if (exact) return { option: exact.option, confidence: 'high' };

  /* 2. The answer contains an option ("I have a passport"), or is a
        shortened form of one ("refugee"). */
  const contains = labelled.filter(({ label }) => label && spoken.includes(label));
  if (contains.length === 1) return { option: contains[0].option, confidence: 'high' };
  if (contains.length > 1) {
    return { option: null, confidence: 'ambiguous', candidates: contains.map((item) => item.option) };
  }

  const within = labelled.filter(({ label }) => label && label.includes(spoken));
  if (within.length === 1) return { option: within[0].option, confidence: 'high' };
  if (within.length > 1) {
    return { option: null, confidence: 'ambiguous', candidates: within.map((item) => item.option) };
  }

  /* 3. Some words in common. The option sharing the most words is offered
        as a question; a tie is not guessed. */
  const spokenWords = new Set(words(spokenText));
  const scored = labelled
    .map((item) => ({
      ...item,
      score: words(item.option.label).filter((word) => spokenWords.has(word)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return NONE;

  const best = scored.filter((item) => item.score === scored[0].score);

  if (best.length > 1) {
    return { option: null, confidence: 'ambiguous', candidates: best.map((item) => item.option) };
  }

  return { option: best[0].option, confidence: 'medium' };
}

const RANK = { high: 3, medium: 2, ambiguous: 1, none: 0 };

/**
 * Speech recognition returns a few guesses at what was said. Each is tried,
 * and the most certain result wins - so "Pass port" heard first and
 * "passport" heard second still gives a confident match.
 */
export function matchSpokenAlternatives(alternatives = [], options = []) {
  let best = NONE;

  for (const alternative of alternatives) {
    const transcript = typeof alternative === 'string' ? alternative : alternative?.transcript;
    const result = matchSpokenChoice(transcript ?? '', options);

    if (RANK[result.confidence] > RANK[best.confidence]) {
      best = { ...result, transcript };
    }

    if (best.confidence === 'high') break;
  }

  return best;
}
