
import { describe, it, expect } from 'vitest';

import {
  getVisibleQuestions,
  getFirstQuestion,
  getNextQuestion,
} from './questionFlow.js';

describe('Question Flow', () => {
  const fields = [
    {
      key: 'hasId',
      enabled: true,
      required: true,
    },
    {
      key: 'idNumber',
      enabled: true,
      required: true,
      showIf: {
        field: 'hasId',
        equals: true,
      },
    },
    {
      key: 'phone',
      enabled: true,
      required: false,
    },
  ];

  it('shows only questions without unmet conditions initially', () => {
    const questions = getVisibleQuestions(fields, {});

    expect(questions.map((question) => question.key)).toEqual([
      'hasId',
      'phone',
    ]);
  });

  it('shows the ID number question when the answer is yes', () => {
    const questions = getVisibleQuestions(fields, {
      hasId: true,
    });

    expect(questions.map((question) => question.key)).toEqual([
      'hasId',
      'idNumber',
      'phone',
    ]);
  });

  it('hides the ID number question when the answer is no', () => {
    const questions = getVisibleQuestions(fields, {
      hasId: false,
    });

    expect(questions.map((question) => question.key)).toEqual([
      'hasId',
      'phone',
    ]);
  });

  it('starts with the first visible question', () => {
    const question = getFirstQuestion(fields, {
      hasId: false,
    });

    expect(question.key).toBe('hasId');
  });

  it('skips the conditional question when its condition is false', () => {
    const question = getNextQuestion(
      fields,
      'hasId',
      { hasId: false }
    );

    expect(question.key).toBe('phone');
  });

  it('includes the conditional question when its condition is true', () => {
    const question = getNextQuestion(
      fields,
      'hasId',
      { hasId: true }
    );

    expect(question.key).toBe('idNumber');
  });
});
