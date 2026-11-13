/**
 * Field and option keys become property names on submitted answers, so
 * they are generated rather than typed: lower-case letters, numbers and
 * underscores only, matching what the shared schema accepts.
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

/** A slug that is not already taken, with a numeric suffix if needed. */
export function uniqueKey(text, taken, fallback = 'field') {
  const base = slugify(text) || fallback;
  const used = new Set(taken);

  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base}_${suffix}`)) suffix += 1;

  return `${base}_${suffix}`;
}
