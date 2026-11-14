// packages/contracts/src/referrals.js
//
// Referral partners and the referral message.
//
// A referral partner is an organisation a partner works with - a kebele
// office, an NGO, a community group - that can help a learner who has no
// identity document. Partners register them in the dashboard; a learner
// who has no document can then ask for a link to be sent to one or more
// of them by SMS.

import { z } from 'zod';

/* International form, because the number is handed to an SMS provider and
   a local number ("0911…") is ambiguous to one. */
export const REFERRAL_PHONE_PATTERN = /^\+[0-9][0-9 ]{6,18}$/;

export const referralPartnerSchema = z.object({
  name: z.string().trim().min(1, 'Enter the organisation’s name.').max(150),
  email: z.string().trim().email('Enter an email address, like name@example.org.').max(200),
  phone: z
    .string()
    .trim()
    .regex(
      REFERRAL_PHONE_PATTERN,
      'Enter a mobile number starting with the country code, like +251 911 234 567.',
    ),
}).strict();

/** At most this many partners can be sent one learner's referral at once. */
export const MAX_REFERRAL_RECIPIENTS = 5;

export const referralRequestSchema = z.object({
  partnerIds: z
    .array(z.string().min(1).max(64))
    .min(1, 'Choose at least one partner.')
    .max(MAX_REFERRAL_RECIPIENTS)
    .refine((ids) => new Set(ids).size === ids.length, 'Each partner can only be chosen once.'),
  learner: z.object({
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(30).optional(),
  }).strict(),
  language: z.enum(['en', 'am']).default('en'),
}).strict();

/* Shown in the learner's preview in place of the link, which only exists
   once the server creates the referral. */
export const REFERRAL_LINK_PLACEHOLDER = {
  en: '[a private link for this organisation]',
  am: '[ለዚህ ድርጅት የተዘጋጀ የግል ማስፈንጠሪያ]',
};

/**
 * The SMS sent to a referral partner.
 *
 * One function, used for the preview the learner reads before agreeing to
 * send and for the message the server actually sends - so what the learner
 * approved is exactly what goes out. Only the learner's name and, if they
 * gave one, their phone number are included; nothing private.
 */
export function buildReferralMessage({
  organisationName,
  learnerName,
  learnerPhone,
  link,
  language = 'en',
  isTest = false,
}) {
  const phone = learnerPhone?.trim();

  if (language === 'am') {
    return [
      isTest ? '[ሙከራ]' : null,
      `${organisationName}፦ ${learnerName} የመታወቂያ ሰነድ የላቸውም፤ ለመመዝገብ የእርስዎን እርዳታ ጠይቀዋል።`,
      phone ? `ስልክ፦ ${phone}።` : null,
      `ለመቀጠል፦ ${link}`,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return [
    isTest ? '[TEST]' : null,
    `${organisationName}: ${learnerName} has no identity document and has asked for your help to register.`,
    phone ? `Phone: ${phone}.` : null,
    `Continue the referral: ${link}`,
  ]
    .filter(Boolean)
    .join(' ');
}
