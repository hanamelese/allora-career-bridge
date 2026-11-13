import { describe, it, expect } from 'vitest';

import { matchSpokenChoice } from './choiceMatch.js';

const OPTIONS = [
  { value: 'kebele_id', label: 'Kebele ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'refugee_id', label: 'Refugee ID' },
  { value: 'no_document', label: 'I have no document' },
];

const AMHARIC_OPTIONS = [
  { value: 'kebele_id', label: 'የቀበሌ መታወቂያ' },
  { value: 'passport', label: 'ፓስፖርት' },
  { value: 'no_document', label: 'ምንም ሰነድ የለኝም' },
];

describe('matching a spoken answer to an option', () => {
  it('matches the exact words', () => {
    const { option, confidence } = matchSpokenChoice('Passport', OPTIONS);

    expect(option.value).toBe('passport');
    expect(confidence).toBe('high');
  });

  it('ignores case and punctuation', () => {
    expect(matchSpokenChoice('passport.', OPTIONS).option.value).toBe('passport');
  });

  it('matches when the answer contains the option', () => {
    expect(matchSpokenChoice('I have a passport', OPTIONS).option.value).toBe('passport');
  });

  it('is sure when the answer is a shortened form of the option', () => {
    const { option, confidence } = matchSpokenChoice('refugee', OPTIONS);

    expect(option.value).toBe('refugee_id');
    expect(confidence).toBe('high');
  });

  it('is only half sure when the answer merely shares a word', () => {
    const { option, confidence } = matchSpokenChoice('refugee papers', OPTIONS);

    expect(option.value).toBe('refugee_id');
    expect(confidence).toBe('medium');
  });

  it('admits when nothing matches rather than guessing', () => {
    expect(matchSpokenChoice('something else entirely', OPTIONS)).toEqual({
      option: null,
      confidence: 'none',
    });
  });

  it('matches nothing when there is nothing to match', () => {
    expect(matchSpokenChoice('', OPTIONS).confidence).toBe('none');
    expect(matchSpokenChoice('passport', []).confidence).toBe('none');
  });
});

/* The previous implementation normalised with \w, which deletes Ethiopic
   script entirely - so no Amharic answer could ever match. */
describe('matching Amharic answers', () => {
  it('matches an exact Amharic option', () => {
    const { option, confidence } = matchSpokenChoice('ፓስፖርት', AMHARIC_OPTIONS);

    expect(option.value).toBe('passport');
    expect(confidence).toBe('high');
  });

  it('matches an Amharic option inside a longer phrase', () => {
    expect(matchSpokenChoice('የቀበሌ መታወቂያ አለኝ', AMHARIC_OPTIONS).option.value).toBe('kebele_id');
  });

  it('matches on a shared Amharic word', () => {
    const { option } = matchSpokenChoice('ሰነድ', AMHARIC_OPTIONS);

    expect(option.value).toBe('no_document');
  });

  it('still reports no match for unrelated Amharic', () => {
    expect(matchSpokenChoice('ሰላም እንደምን ነህ', AMHARIC_OPTIONS).confidence).toBe('none');
  });
});
