
import { describe, it, expect } from 'vitest';

import { createFormEngine } from './formEngine.js';

describe('Form Engine', () => {
  const config = {
    fields: [
      { key: 'name', enabled: true, required: true },
      { key: 'currentLevel', enabled: true, required: true },
      { key: 'phone', enabled: true, required: false },
    ],
  };

  it('starts with the first enabled question', () => {
    const engine = createFormEngine(config);

    expect(engine.getCurrentQuestion().key).toBe('name');
  });

  it('shows only one question at a time', () => {
    const engine = createFormEngine(config);

    expect(engine.getCurrentQuestion().key).toBe('name');
  });

  it('does not automatically advance after an answer', () => {
    const engine = createFormEngine(config);

    engine.answerQuestion('name', 'Miruk');

    expect(engine.getCurrentQuestion().key).toBe('name');
  });

  it('stores and retrieves answers', () => {
    const engine = createFormEngine(config);

    engine.answerQuestion('name', 'Miruk');

    expect(engine.getAnswer('name')).toBe('Miruk');
  });

  it('allows an answer to be edited', () => {
    const engine = createFormEngine(config);

    engine.answerQuestion('name', 'Miruk');
    engine.answerQuestion('name', 'New Name');

    expect(engine.getAnswer('name')).toBe('New Name');
  });

  it('moves to the next question when requested', () => {
    const engine = createFormEngine(config);

    expect(engine.goNext().key).toBe('currentLevel');
  });

  it('moves back to the previous question', () => {
    const engine = createFormEngine(config);

    engine.goNext();

    expect(engine.goBack().key).toBe('name');
  });

  it('does not move beyond the last question', () => {
    const engine = createFormEngine(config);

    engine.goNext();
    engine.goNext();

    expect(engine.getCurrentQuestion().key).toBe('phone');
  });

  it('supports simple wording in low-literacy mode', () => {
    const engine = createFormEngine(config, {}, {
      lowLiteracy: true,
    });

    expect(engine.getCurrentQuestion().label).toBe(
      'Your name'
    );
  });

  it('uses the simple wording for read-aloud text', () => {
    const engine = createFormEngine(config, {}, {
      lowLiteracy: true,
    });

    expect(engine.getCurrentQuestion().readAloudText).toBe(
      'Your name'
    );
  });

  it('supports Amharic language selection', () => {
    const engine = createFormEngine(config, {}, {
      language: 'am',
    });

    expect(engine.getCurrentQuestion().language).toBe('am');
  });

  it('allows accessibility settings to be updated', () => {
    const engine = createFormEngine(config);

    engine.updateSettings({
      lowLiteracy: true,
      largeText: true,
      readAloud: true,
    });

    const question = engine.getCurrentQuestion();

    expect(question.lowLiteracy).toBe(true);
    expect(question.largeText).toBe(true);
    expect(question.readAloud).toBe(true);
  });

  it('removes an answer when requested', () => {
    const engine = createFormEngine(config);

    engine.answerQuestion('name', 'Miruk');
    engine.removeAnswer('name');

    expect(engine.getAnswer('name')).toBeUndefined();
  });

  it('allows incomplete answers to be checked as progress', () => {
    const engine = createFormEngine(config);

    expect(engine.validateProgress().valid).toBe(true);
  });

  it('rejects an incomplete final submission', () => {
    const engine = createFormEngine(config);

    expect(engine.validateSubmission().valid).toBe(false);
  });
  it('generates a read-back message for an answer', () => {
    const engine = createFormEngine(config);

    engine.answerQuestion('name', 'Miruk');

    expect(engine.getReadBack('name')).toBe(
      'You said: Miruk. Is this correct?'
    );
  });

  it('allows an answer to be confirmed', () => {
    const engine = createFormEngine(config);

    engine.answerQuestion('name', 'Miruk');

    expect(engine.confirmAnswer('name')).toBe(true);
    expect(engine.isAnswerConfirmed('name')).toBe(true);
  });

  it('does not confirm an empty answer', () => {
    const engine = createFormEngine(config);

    expect(engine.confirmAnswer('name')).toBe(false);
  });

  it('allows a confirmed answer to be edited', () => {
    const engine = createFormEngine(config);

    engine.answerQuestion('name', 'Miruk');
    engine.confirmAnswer('name');

    engine.editAnswer('name', 'New Name');

    expect(engine.getAnswer('name')).toBe('New Name');
    expect(engine.isAnswerConfirmed('name')).toBe(false);
  });

  it('does not automatically advance after confirming an answer', () => {
    const engine = createFormEngine(config);

    engine.answerQuestion('name', 'Miruk');
    engine.confirmAnswer('name');

    expect(engine.getCurrentQuestion().key).toBe('name');
  });

  it('supports Amharic read-back messages', () => {
    const engine = createFormEngine(config, {}, {
      language: 'am',
    });

    engine.answerQuestion('name', 'ሚሩክ');

    expect(engine.getReadBack('name')).toBe(
      'ያሉት፦ ሚሩክ። ትክክል ነው?'
    );
  });

  it('can disable read-back messages', () => {
    const engine = createFormEngine(config, {}, {
      readBack: false,
    });

    engine.answerQuestion('name', 'Miruk');

    expect(engine.getReadBack('name')).toBe('');
  });  
});
