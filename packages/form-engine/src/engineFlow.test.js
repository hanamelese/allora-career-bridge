import { describe, it, expect } from 'vitest';

import { FORM_TEMPLATES } from '@onboarding/contracts';
import { createFormEngine } from './formEngine.js';
import { formatAnswerText } from './accessibility.js';

const engineFor = (type, answers = {}, settings = {}) =>
  createFormEngine(FORM_TEMPLATES[type], answers, settings);

describe('conditional questions', () => {
  it('skips the ID number when the learner has no document', () => {
    const engine = engineFor('signup');
    engine.answerQuestion('identityRoute', 'no_document');

    const keys = engine.getVisibleQuestions().map((question) => question.key);
    expect(keys).not.toContain('documentId');
  });

  it('asks for the ID number for each document that carries one', () => {
    for (const route of ['kebele_id', 'passport', 'refugee_id']) {
      const engine = engineFor('signup');
      engine.answerQuestion('identityRoute', route);

      const keys = engine.getVisibleQuestions().map((question) => question.key);
      expect(keys).toContain('documentId');
    }
  });

  it('counts only the questions actually being asked', () => {
    const engine = engineFor('signup');
    const before = engine.getProgress().total;

    engine.answerQuestion('identityRoute', 'passport');

    expect(engine.getProgress().total).toBe(before + 1);
  });
});

describe('question content', () => {
  it('describes a question well enough to render it', () => {
    const question = engineFor('signup').getCurrentQuestion();

    expect(question).toMatchObject({
      key: 'name',
      type: 'text',
      label: 'Full name',
      required: true,
      autocomplete: 'name',
    });
  });

  it('answers in Amharic when asked in Amharic', () => {
    const engine = engineFor('signup', {}, { language: 'am' });

    expect(engine.getCurrentQuestion().label).toBe('ሙሉ ስም');
  });

  it('uses the simpler wording and the simpler options in simple-words mode', () => {
    const engine = engineFor('signup', {}, { language: 'en', lowLiteracy: true });
    engine.goTo('identityRoute');

    const question = engine.getCurrentQuestion();

    expect(question.label).toBe('Which paper do you have?');
    expect(question.options.map((option) => option.label)).toContain('I have no papers');
  });

  it('offers only the identity documents the partner accepts', () => {
    const config = {
      ...FORM_TEMPLATES.signup,
      identityRoutes: ['kebele_id', 'no_document'],
    };

    const engine = createFormEngine(config, {});
    engine.goTo('identityRoute');

    expect(engine.getCurrentQuestion().options.map((option) => option.value)).toEqual([
      'kebele_id',
      'no_document',
    ]);
  });

  it('draws multi-choice options from the catalogue the field names', () => {
    const engine = engineFor('jobApplication');
    engine.goTo('interviewAccommodations');

    const question = engine.getCurrentQuestion();

    expect(question.type).toBe('multiChoice');
    expect(question.isPrivate).toBe(true);
    expect(question.options.map((option) => option.value)).toContain('extra_time');
    expect(question.options.map((option) => option.value)).not.toContain('transport_support');
  });

  it('reads the privacy notice aloud along with the question', () => {
    const engine = engineFor('jobApplication', {}, { readAloud: true });
    engine.goTo('interviewAccommodations');

    const question = engine.getCurrentQuestion();

    expect(question.readAloudText).toContain(question.label);
    expect(question.readAloudText).toContain('medical proof');
  });
});

describe('moving through the form', () => {
  it('jumps to a named question, which is how review lets you change one', () => {
    const engine = engineFor('signup');

    expect(engine.goTo('location').key).toBe('location');
  });

  it('will not jump to a question that is not being asked', () => {
    const engine = engineFor('signup');
    engine.answerQuestion('identityRoute', 'no_document');
    engine.goTo('name');

    expect(engine.goTo('documentId').key).toBe('name');
  });

  it('never advances on its own when an answer is given', () => {
    const engine = engineFor('signup');
    engine.answerQuestion('name', 'Miruk');

    expect(engine.getCurrentQuestion().key).toBe('name');
  });
});

describe('reviewing and confirming an answer', () => {
  it('treats an answer as unconfirmed until it is confirmed', () => {
    const engine = engineFor('signup');
    engine.answerQuestion('name', 'Miruk');

    expect(engine.isAnswerConfirmed('name')).toBe(false);
    expect(engine.confirmAnswer('name')).toBe(true);
    expect(engine.isAnswerConfirmed('name')).toBe(true);
  });

  it('asks for confirmation again once an answer is edited', () => {
    const engine = engineFor('signup');
    engine.answerQuestion('name', 'Miruk');
    engine.confirmAnswer('name');
    engine.editAnswer('name', 'Miruk Tesfaye');

    expect(engine.isAnswerConfirmed('name')).toBe(false);
  });

  it('will not confirm an empty answer', () => {
    const engine = engineFor('signup');

    expect(engine.confirmAnswer('name')).toBe(false);
  });
});

describe('answers written out for the review step', () => {
  const question = (type, key) => {
    const engine = engineFor(type);
    engine.goTo(key);
    return engine.getCurrentQuestion();
  };

  it('writes a chosen option as its label, not its key', () => {
    const route = question('signup', 'identityRoute');

    expect(formatAnswerText(route, 'refugee_id', 'en')).toBe('Refugee ID');
  });

  it('lists several chosen options', () => {
    const needs = question('jobApplication', 'interviewAccommodations');

    expect(formatAnswerText(needs, ['extra_time', 'quiet_room'], 'en')).toBe(
      'Extra time in the interview, A quiet room',
    );
  });

  it('says plainly when nothing was answered, in either language', () => {
    const name = question('signup', 'name');

    expect(formatAnswerText(name, '', 'en')).toBe('Not answered');
    expect(formatAnswerText(name, undefined, 'am')).toBe('አልተመለሰም');
  });
});

describe('plain-language validation', () => {
  it('explains a missing answer in the learner‘s language', () => {
    expect(engineFor('signup', {}, { language: 'en' }).validateAnswer('name')).toBe(
      'Please answer this question before moving on.',
    );
    expect(engineFor('signup', {}, { language: 'am' }).validateAnswer('name')).toBe(
      'ከመቀጠልዎ በፊት እባክዎ ይህን ጥያቄ ይመልሱ።',
    );
  });

  it('says how to fix an email address rather than that it is invalid', () => {
    const message = engineFor('employer', { contactEmail: 'nope' }).validateAnswer('contactEmail');

    expect(message).toContain('@');
  });

  it('says how to fix a web address', () => {
    const message = engineFor('employer', { website: 'nope' }).validateAnswer('website');

    expect(message).toContain('https://');
  });

  it('asks for permission rather than reporting a type error', () => {
    const message = engineFor('signup', { consent: false }).validateAnswer('consent');

    expect(message).toBe('Tick the box to give your permission before moving on.');
  });

  it('accepts a good answer', () => {
    expect(engineFor('signup', { name: 'Miruk' }).validateAnswer('name')).toBeNull();
  });

  it('lets an optional question pass unanswered, with no timeout to beat', () => {
    expect(engineFor('signup', {}).validateAnswer('location')).toBeNull();
  });
});
