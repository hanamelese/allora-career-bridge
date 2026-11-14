import { describe, it, expect } from 'vitest';
import { FORM_TEMPLATES } from '@onboarding/contracts';
import { createFormEngine } from './formEngine.js';
import { formatAnswerText } from './accessibility.js';

const MB = 1024 * 1024;

function jobEngine(answers = {}, language = 'en', upload) {
  const job = FORM_TEMPLATES.jobApplication;
  const config = upload
    ? { ...job, fields: job.fields.map((field) => (field.key === 'cvFile' ? { ...field, upload } : field)) }
    : job;
  return createFormEngine(config, answers, { language });
}

describe('upload questions in the engine', () => {
  it('carries the partner’s restrictions to the screen', () => {
    const engine = jobEngine({}, 'en', { maxSizeMb: 5, accept: ['pdf'] });
    engine.goTo('cvFile');

    expect(engine.getCurrentQuestion()).toMatchObject({
      type: 'file',
      upload: { maxSizeMb: 5, accept: ['pdf'] },
      voiceInput: false,
    });
  });

  it('says what to do about a file that is too big, or the wrong kind', () => {
    const big = jobEngine({ cvFile: { name: 'cv.pdf', type: 'application/pdf', size: 12 * MB } });
    expect(big.validateAnswer('cvFile')).toBe('Your CV or résumé: This file is 12 MB. Choose a file of 10 MB or less.');

    const exe = jobEngine({ cvFile: { name: 'cv.exe', type: 'application/x-msdownload', size: MB } });
    expect(exe.validateAnswer('cvFile')).toBe('Your CV or résumé: This kind of file cannot be used. Choose a PDF or Word (.docx) file.');

    const am = jobEngine({ cvFile: { name: 'cv.pdf', type: 'application/pdf', size: 12 * MB } }, 'am');
    expect(am.validateAnswer('cvFile')).toMatch(/12 MB ነው።/);
  });

  it('lets an optional upload be skipped, and accepts a good file', () => {
    expect(jobEngine({}).validateAnswer('cvFile')).toBeNull();
    expect(jobEngine({ cvFile: { name: 'cv.pdf', type: 'application/pdf', size: MB } }).validateAnswer('cvFile')).toBeNull();
  });

  it('describes a chosen file on the review by name and size, never its contents', () => {
    expect(formatAnswerText({ type: 'file' }, { name: 'cv.pdf', type: 'application/pdf', size: 2 * MB })).toBe('cv.pdf (2 MB)');
    expect(formatAnswerText({ type: 'file' }, undefined)).toBe('Not answered');
  });
});
