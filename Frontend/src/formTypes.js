import { ClipboardList, UserRound, Briefcase, Building2 } from 'lucide-react';

/**
 * The four form types, as partner staff see them.
 *
 * `id` is the value stored in the form config and validated by
 * `formTypeSchema` in @onboarding/contracts. Those identifiers predate the
 * clearer names below and are deliberately left alone - renaming them
 * would be a breaking schema change for a cosmetic gain. The dashboard
 * never shows an id; it shows `name`.
 *
 * `slug` is what appears in the URL, so a partner can bookmark or share a
 * link to one form without the legacy identifier leaking into it.
 *
 * `formId` is the stable key the API and the embed tag use.
 */
export const FORM_TYPES = [
  {
    id: 'signup',
    formId: 'frm_learner_registration',
    slug: 'learner-registration',
    name: 'Learner Registration',
    summary: 'Basic details and account registration',
    purpose:
      'Register a learner without assuming they hold a national ID or passport, and take clear consent before anything is submitted.',
    audience: 'Completed by the learner',
    icon: ClipboardList,
  },
  {
    id: 'learner',
    formId: 'frm_learner_profile',
    slug: 'learner-profile',
    name: 'Learner Profile & Support',
    summary: 'Onboarding profile and private support requests',
    purpose:
      'Collect profile and onboarding details, and give learners a private way to ask for the support they need - with no medical proof and no requirement to disclose a disability.',
    audience: 'Completed by the learner',
    icon: UserRound,
  },
  {
    id: 'jobApplication',
    formId: 'frm_job_application',
    slug: 'job-application',
    name: 'Job Application',
    summary: 'Accessible applications with voice answers',
    purpose:
      'An accessible job application that accepts spoken answers, and lets an applicant request interview accommodations privately.',
    audience: 'Completed by the job seeker',
    icon: Briefcase,
  },
  {
    id: 'employer',
    formId: 'frm_employer_accessibility',
    slug: 'employer-accessibility',
    name: 'Employer & Workplace Accessibility',
    summary: 'Organisation details and accommodations offered',
    purpose:
      'Let employers describe their organisation and the workplace accommodations they offer, so the career gateway can match roles without asking anyone for sensitive information.',
    audience: 'Completed by the employer',
    icon: Building2,
  },
];

export function getFormTypeBySlug(slug) {
  return FORM_TYPES.find((formType) => formType.slug === slug) ?? null;
}

export function getFormTypeById(id) {
  return FORM_TYPES.find((formType) => formType.id === id) ?? null;
}
