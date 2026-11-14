import { ClipboardList, Briefcase, Building2, LogIn } from 'lucide-react';

/**
 * The form types, as partner staff see them.
 *
 * `id` is the value stored in the form config and validated by
 * `formTypeSchema` in @onboarding/contracts. Those identifiers predate the
 * clearer names below and are deliberately left alone - renaming them
 * would be a breaking schema change for a cosmetic gain. The dashboard
 * never shows an id; it shows `name`.
 *
 * `slug` is what appears in the URL, so a partner can bookmark or share a
 * link to one form without the legacy identifier leaking into it. The
 * form's own id is issued by the server and looked up by `id` (the type).

 */
export const FORM_TYPES = [
  {
    /* Listed first: the door into everything else. */
    id: 'account',
    slug: 'sign-up-sign-in',
    name: 'Sign up / Sign in',
    summary: 'An accessible sign-in for your own site',
    purpose: '',
    audience: 'Completed by anyone signing up or in',
    icon: LogIn,
  },
  {
    /* One learner form. It replaced the separate Learner Registration and
       Learner Profile & Support forms; the old profile link still works. */
    id: 'signup',
    slug: 'learner-registration',
    aliases: ['learner-profile'],
    name: 'Learner Registration & Profile',
    summary: 'Registration, profile and private support requests',
    purpose:
      '',
    audience: 'Completed by the learner',
    icon: ClipboardList,
  },
  {
    id: 'jobApplication',
    slug: 'job-application',
    name: 'Job Application',
    summary: 'Accessible applications with voice answers',
    purpose:
      '',
    audience: 'Completed by the job seeker',
    icon: Briefcase,
  },
  {
    id: 'employer',
    slug: 'employer-accessibility',
    name: 'Employer & Workplace Accessibility',
    summary: 'Organisation details and accommodations offered',
    purpose:
      '',
    audience: 'Completed by the employer',
    icon: Building2,
  },
];

export function getFormTypeBySlug(slug) {
  return FORM_TYPES.find((formType) => formType.slug === slug) ?? null;
}

/** A form type whose old slug this is, so a bookmarked link can redirect. */
export function getFormTypeByAlias(slug) {
  return FORM_TYPES.find((formType) => formType.aliases?.includes(slug)) ?? null;
}

export function getFormTypeById(id) {
  return FORM_TYPES.find((formType) => formType.id === id) ?? null;
}
