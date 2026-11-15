import { describe, expect, it } from 'vitest';
import { normalisePhrase, parseCommand, tidyDictation } from './voiceCommands.js';
import { splitForSpeech } from './speech.js';

const type = (text) => parseCommand(text).type;

describe('voice commands', () => {
  it('knows the commands in English, whatever the punctuation or case', () => {
    expect(type('Next.')).toBe('next');
    expect(type('next question')).toBe('next');
    expect(type('Go back')).toBe('back');
    expect(type('previous question')).toBe('back');
    expect(type('Repeat that!')).toBe('repeat');
    expect(type('read the question')).toBe('read');
    expect(type('What are the options?')).toBe('options');
    expect(type('clear my answer')).toBe('clear');
    expect(type('Submit my answers')).toBe('send');
    expect(type('sign in')).toBe('send');
    expect(type('What can I say')).toBe('help');
    expect(type('stop listening')).toBe('stop');
    expect(type('Yes')).toBe('yes');
    expect(type('no thanks')).toBe('no');
  });

  it('knows the commands in Amharic', () => {
    expect(type('ቀጣይ')).toBe('next');
    expect(type('ቀጣዩ ጥያቄ።')).toBe('next');
    expect(type('ተመለስ')).toBe('back');
    expect(type('ወደ ኋላ')).toBe('back');
    expect(type('ድገም')).toBe('repeat');
    expect(type('ጥያቄውን አንብብ')).toBe('read');
    expect(type('አማራጮቹን አንብብ')).toBe('options');
    expect(type('አጥፋ')).toBe('clear');
    expect(type('ላክ')).toBe('send');
    expect(type('እገዛ')).toBe('help');
    expect(type('አቁም')).toBe('stop');
    expect(type('አዎ')).toBe('yes');
    expect(type('አይ')).toBe('no');
  });

  it('chooses an option by number, in words or digits, in both languages', () => {
    expect(parseCommand('option 2')).toEqual({ type: 'choose', number: 2 });
    expect(parseCommand('number three')).toEqual({ type: 'choose', number: 3 });
    expect(parseCommand('the second one')).toEqual({ type: 'choose', number: 2 });
    expect(parseCommand('choose the first')).toEqual({ type: 'choose', number: 1 });
    expect(parseCommand('option to')).toEqual({ type: 'choose', number: 2 });
    expect(parseCommand('4')).toEqual({ type: 'choose', number: 4 });
    expect(parseCommand('ሁለተኛው')).toEqual({ type: 'choose', number: 2 });
    expect(parseCommand('አማራጭ ሶስት')).toEqual({ type: 'choose', number: 3 });
    expect(parseCommand('ሦስተኛውን ምረጥ').type).toBe('choose');
  });

  it('does not read a lone sound-alike as a number', () => {
    expect(parseCommand('for')).toEqual({ type: 'answer', text: 'for' });
  });

  it('chooses an option by name', () => {
    expect(parseCommand('Choose Addis Ababa')).toEqual({ type: 'choose', target: 'addis ababa' });
    expect(parseCommand('select part-time work')).toEqual({ type: 'choose', target: 'part-time work' });
    expect(parseCommand('ምረጥ አዲስ አበባ')).toEqual({ type: 'choose', target: 'አዲስ አበባ' });
    expect(parseCommand('አዲስ አበባ ምረጥ')).toEqual({ type: 'choose', target: 'አዲስ አበባ' });
  });

  it('takes anything else as the answer, and "my answer is" even for a command word', () => {
    expect(parseCommand('Selam Bekele')).toEqual({ type: 'answer', text: 'Selam Bekele' });
    expect(parseCommand('I want to go next week')).toEqual({ type: 'answer', text: 'I want to go next week' });
    expect(parseCommand('My answer is Next')).toEqual({ type: 'answer', text: 'Next' });
    expect(parseCommand('መልሴ ቀጣይ ነው')).toEqual({ type: 'answer', text: 'ቀጣይ' });
    expect(parseCommand('   ')).toEqual({ type: 'none' });
  });

  it('normalises punctuation including Ethiopic marks', () => {
    expect(normalisePhrase('  ቀጣይ፣ ጥያቄ።  ')).toBe('ቀጣይ ጥያቄ');
  });

  it('tidies a dictated email address and phone number', () => {
    expect(tidyDictation('Selam at example dot org.', 'email')).toBe('selam@example.org');
    expect(tidyDictation('selam@example.org', 'email')).toBe('selam@example.org');
    expect(tidyDictation('0911 23 45 67', 'phone')).toBe('0911234567');
    expect(tidyDictation('Addis Ababa.', 'text')).toBe('Addis Ababa');
  });
});

describe('splitting text for speaking', () => {
  it('keeps short text whole and splits long text at sentence ends', () => {
    expect(splitForSpeech('One. Two.')).toEqual(['One. Two.']);
    const long = `${'a'.repeat(300)}. ${'b'.repeat(300)}.`;
    expect(splitForSpeech(long, 400)).toEqual([`${'a'.repeat(300)}.`, `${'b'.repeat(300)}.`]);
  });

  it('splits at the Amharic full stop, and cuts a sentence that is too long', () => {
    expect(splitForSpeech(`${'ሀ'.repeat(10)}። ${'ለ'.repeat(10)}።`, 15)).toEqual([`${'ሀ'.repeat(10)}።`, `${'ለ'.repeat(10)}።`]);
    expect(splitForSpeech('x'.repeat(25), 10).every((piece) => piece.length <= 10)).toBe(true);
  });

  it('gives nothing for empty text', () => {
    expect(splitForSpeech('  ')).toEqual([]);
  });
});
