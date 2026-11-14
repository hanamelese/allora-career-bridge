import { describe, it, expect } from 'vitest';

import { FORM_TEMPLATES } from './formTemplates.js';
import { buildSubmissionSchema } from './submissionSchema.js';
import {
  storedSubmissionConfig,
  submissionRequestSchema,
  toStorableSubmission,
} from './submissions.js';

const job = FORM_TEMPLATES.jobApplication;
const signup = FORM_TEMPLATES.signup;
const cv = { name: 'cv.pdf', size: 2048, type: 'application/pdf', lastModified: 1 };
const idScan = { name: 'kebele.jpg', size: 4096, type: 'image/jpeg' };

describe('what is stored when an embedded form is sent', () => {
  it('keeps the answers an organisation can act on, and a file only as its description', () => {
    const stored = toStorableSubmission(job, {
      name: 'Abebe Kebede',
      phone: '0911234567',
      jobReference: 'VA-12',
      cvFile: cv,
      identityRoute: 'kebele_id',
      documentId: 'AA123456',
      identityDocumentFile: idScan,
      interviewAccommodations: ['extra_time'],
    });

    expect(stored).toEqual({
      name: 'Abebe Kebede',
      phone: '0911234567',
      jobReference: 'VA-12',
      cvFile: { name: 'cv.pdf', size: 2048, type: 'application/pdf' },
      identityRoute: 'kebele_id',
    });
  });

  it('never keeps private support answers, the referral choice, or an ID number', () => {
    const stored = toStorableSubmission(signup, {
      name: 'Hana',
      phone: '0911234567',
      supportNeeds: ['screen_reader'],
      supportNote: 'I use a screen reader.',
      identityRoute: 'no_document',
      referral: { partnerIds: ['rp_1'] },
      documentId: 'ignored because hidden',
    });

    for (const key of ['supportNeeds', 'supportNote', 'referral', 'documentId']) {
      expect(stored).not.toHaveProperty(key);
    }
    expect(stored.identityRoute).toBe('no_document');
  });

  it('is checked by the server with private questions no longer required', () => {
    const config = storedSubmissionConfig(job);
    const schema = buildSubmissionSchema(config);
    const base = { name: 'Abebe', phone: '0911234567', jobReference: 'J1', identityRoute: 'passport' };

    /* The passport number is never sent, so its absence is not an error. */
    expect(schema.safeParse(base).success).toBe(true);
    expect(schema.safeParse({ ...base, cvFile: { name: 'cv.pdf', size: 10, type: 'application/pdf' } }).success).toBe(true);
    /* A required, storable answer is still required. */
    expect(schema.safeParse({ ...base, name: undefined }).success).toBe(false);
    /* A file description that breaks the rules is still refused. */
    expect(schema.safeParse({ ...base, cvFile: { name: 'cv.exe', size: 10, type: 'application/x-msdownload' } }).success).toBe(false);
  });

  it('accepts a request naming the version and its answers, and nothing else', () => {
    expect(submissionRequestSchema.safeParse({ version: 2, answers: { name: 'A' } }).success).toBe(true);
    expect(submissionRequestSchema.safeParse({ version: 0, answers: {} }).success).toBe(false);
    expect(submissionRequestSchema.safeParse({ version: 1, answers: {}, extra: true }).success).toBe(false);
  });
});
