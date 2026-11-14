import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/*
 * Reads the contrast levels straight from the stylesheet and checks every
 * colour pair the form actually uses, so the numbers promised in the
 * settings panel cannot drift from the CSS.
 */

const css = readFileSync(new URL('../react/form-engine.css', import.meta.url), 'utf8');

function tokensIn(block) {
  const tokens = {};
  for (const [, name, value] of block.matchAll(/--(fe-[a-z-]+):\s*([^;]+);/g)) {
    const hex = value.match(/#[0-9a-fA-F]{6}/g);
    if (hex) tokens[name] = hex[hex.length - 1];
  }
  return tokens;
}

function blockFor(selector) {
  const start = css.indexOf(`${selector} {`);
  return css.slice(start, css.indexOf('}', start));
}

const base = tokensIn(blockFor('.fe-form'));
const LEVELS = {
  1: base,
  2: { ...base, ...tokensIn(blockFor(".fe-form[data-contrast='2']")) },
  3: { ...base, ...tokensIn(blockFor(".fe-form[data-contrast='3']")) },
  4: { ...base, ...tokensIn(blockFor(".fe-form[data-contrast='4']")) },
};

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/* [foreground, background] pairs the form draws text with. */
const TEXT_PAIRS = [
  ['fe-ink', 'fe-surface'],
  ['fe-ink', 'fe-surface-sunken'],
  ['fe-ink', 'fe-selected'],
  ['fe-ink-secondary', 'fe-surface'],
  ['fe-ink-secondary', 'fe-surface-sunken'],
  ['fe-accent', 'fe-surface'],
  ['fe-danger', 'fe-surface'],
  ['fe-danger', 'fe-danger-surface'],
  ['fe-success', 'fe-success-surface'],
  ['fe-on-ink', 'fe-ink'],
  ['fe-on-ink', 'fe-ink-strong'],
];

/* Edges of controls and the focus ring: WCAG 1.4.11, 3:1. */
const UI_PAIRS = [
  ['fe-border', 'fe-surface'],
  ['fe-ink', 'fe-surface'],
];

const MINIMUM_TEXT = { 1: 4.5, 2: 7, 3: 7, 4: 7 };

describe.each(Object.keys(LEVELS))('contrast level %s', (level) => {
  const tokens = LEVELS[level];

  it.each(TEXT_PAIRS)(`%s on %s meets the text minimum`, (fg, bg) => {
    expect(tokens[fg], fg).toBeTruthy();
    expect(tokens[bg], bg).toBeTruthy();
    expect(ratio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(MINIMUM_TEXT[level]);
  });

  it.each(UI_PAIRS)('%s on %s meets 3:1 for controls', (fg, bg) => {
    expect(ratio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(3);
  });
});

it('level 4 is the strongest', () => {
  expect(ratio(LEVELS[4]['fe-ink'], LEVELS[4]['fe-surface'])).toBeGreaterThan(19);
});

it('prints the ratios', () => {
  for (const [level, tokens] of Object.entries(LEVELS)) {
    const lowest = Math.min(...TEXT_PAIRS.map(([fg, bg]) => ratio(tokens[fg], tokens[bg])));
    console.log(`level ${level}: lowest text ratio ${lowest.toFixed(2)}:1`);
  }
});
