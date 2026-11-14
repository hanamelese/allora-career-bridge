import { describe, it, expect } from 'vitest';

import { FORM_TEMPLATES } from './formTemplates.js';
import { formConfigSchema } from './formConfig.js';
import { buildSubmissionSchema } from './submissionSchema.js';
import { addUploadQuestions } from './formUpgrades.js';
import { acceptAttribute, checkFile, listFileTypes, resolveUploadRules } from './uploads.js';

const MB = 1024 * 1024;
const file = (name, type, size) => ({ name, type, size });

describe('upload rules', () => {
  it('defaults to every supported kind and the largest size when none are set', () => {
    expect(resolveUploadRules()).toEqual({ maxSizeMb: 25, accept: ['pdf', 'jpg', 'png', 'docx'] });
  });

  it('accepts a file within the partner’s rules', () => {
    expect(checkFile(file('id.pdf', 'application/pdf', 2 * MB), { maxSizeMb: 5, accept: ['pdf'] })).toBeNull();
    expect(checkFile(file('photo.JPEG', 'image/jpeg', MB), { accept: ['jpg'] })).toBeNull();
  });

  it('refuses a file that is too large, saying how large', () => {
    expect(checkFile(file('scan.pdf', 'application/pdf', 26 * MB), { maxSizeMb: 25 })).toEqual({
      problem: 'tooBig',
      size: '26 MB',
      maxSizeMb: 25,
    });
  });

  it('refuses a kind of file that is not allowed, naming the ones that are', () => {
    expect(checkFile(file('cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', MB), { accept: ['pdf', 'jpg'] })).toEqual({
      problem: 'wrongType',
      allowed: 'PDF or JPG',
    });
    /* A renamed file is not let through on its name alone. */
    expect(checkFile(file('virus.pdf', 'application/x-msdownload', MB), {})?.problem).toBe('wrongType');
    expect(checkFile(file('empty.pdf', 'application/pdf', 0), {})?.problem).toBe('empty');
  });

  it('describes the rules for the file picker and for people', () => {
    expect(acceptAttribute({ accept: ['pdf'] })).toBe('.pdf,application/pdf');
    expect(listFileTypes({ accept: ['pdf', 'jpg', 'png'] })).toBe('PDF, JPG or PNG');
  });
});

describe('upload questions', () => {
  it('offer an identity document upload on the learner and job forms, and a CV on the job form', () => {
    for (const type of ['signup', 'jobApplication']) {
      const upload = FORM_TEMPLATES[type].fields.find((field) => field.key === 'identityDocumentFile');
      expect(upload.showIf.in).toEqual(['kebele_id', 'passport', 'refugee_id', 'other_document']);
      expect(upload.visibility).toBe('private');
    }
    expect(FORM_TEMPLATES.jobApplication.fields.some((field) => field.key === 'cvFile')).toBe(true);
  });

  it('let a partner set restrictions, within limits, on upload questions only', () => {
    const job = FORM_TEMPLATES.jobApplication;
    const withRules = (key, upload) => ({
      ...job,
      fields: job.fields.map((field) => (field.key === key ? { ...field, upload } : field)),
    });

    expect(formConfigSchema.safeParse(withRules('cvFile', { maxSizeMb: 25, accept: ['pdf'] })).success).toBe(true);
    expect(formConfigSchema.safeParse(withRules('cvFile', {})).success).toBe(true);
    expect(formConfigSchema.safeParse(withRules('cvFile', { maxSizeMb: 26 })).success).toBe(false);
    expect(formConfigSchema.safeParse(withRules('cvFile', { accept: ['exe'] })).success).toBe(false);
    expect(formConfigSchema.safeParse(withRules('name', { maxSizeMb: 5 })).success).toBe(false);
  });

  it('check the answer against the partner’s rules, keeping the file itself', () => {
    const job = FORM_TEMPLATES.jobApplication;
    const config = {
      ...job,
      fields: job.fields.map((field) => (field.key === 'cvFile' ? { ...field, upload: { maxSizeMb: 1, accept: ['pdf'] } } : field)),
    };
    const schema = buildSubmissionSchema(config);
    const base = { name: 'Abebe', phone: '0911234567', jobReference: 'J1', identityRoute: 'no_document' };
    const cv = file('cv.pdf', 'application/pdf', 1000);

    const ok = schema.safeParse({ ...base, cvFile: cv });
    expect(ok.success).toBe(true);
    expect(ok.data.cvFile).toBe(cv);

    const big = schema.safeParse({ ...base, cvFile: file('cv.pdf', 'application/pdf', 2 * MB) });
    expect(big.error.issues[0].params.fileProblem).toBe('tooBig');

    const word = schema.safeParse({ ...base, cvFile: file('cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1000) });
    expect(word.error.issues[0].params).toMatchObject({ fileProblem: 'wrongType', allowed: 'PDF' });
  });

  it('are added to older drafts beside the questions they belong with', () => {
    const job = FORM_TEMPLATES.jobApplication;
    const older = { ...job, fields: job.fields.filter((field) => !['cvFile', 'identityDocumentFile'].includes(field.key)) };
    const after = addUploadQuestions(older);

    expect(after.fields.map((field) => field.key)).toEqual(job.fields.map((field) => field.key));
    expect(addUploadQuestions(after)).toBe(after);
    expect(formConfigSchema.safeParse(after).success).toBe(true);
  });
});

import { normalizeOrigin, allowedOriginSchema } from './origins.js';

describe('websites allowed to show a form', () => {
  it('keeps just the origin, over https', () => {
    expect(normalizeOrigin('https://www.example.org/jobs/apply?x=1')).toBe('https://www.example.org');
    expect(normalizeOrigin('  https://Example.org:8443/ ')).toBe('https://example.org:8443');
  });

  it('allows http only on this computer', () => {
    expect(normalizeOrigin('http://localhost:5175')).toBe('http://localhost:5175');
    expect(normalizeOrigin('http://www.example.org')).toBeNull();
    expect(normalizeOrigin('javascript:alert(1)')).toBeNull();
    expect(normalizeOrigin('example.org')).toBeNull();
  });

  it('explains how to fix a wrong address', () => {
    const result = allowedOriginSchema.safeParse('www.example.org');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/https:\/\//);
  });
});
