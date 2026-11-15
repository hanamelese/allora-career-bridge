// // import { eq } from 'drizzle-orm';
// // import { partners } from '../db/schema.js';
// // import { createDatabase } from '../db/client.js';
// // import { config } from '../config.js';

// // const { db } = createDatabase(config.databaseUrl);

// // /**
// //  * Sends a referral SMS using AfroMessage with dynamic partner branding.
// //  */
// // export async function sendReferralSms({
// //   to,
// //   phone,
// //   token,
// //   link,
// //   partnerId,
// //   partnerOrgId,
// //   learnerName,
// //   candidateName,
// // }) {
// //   const provider = process.env.SMS_PROVIDER;
// //   const apiKey = process.env.AFROMESSAGE_API_KEY;
// //   const identifierKey = process.env.IDENTIFIER_KEY;
// //   const publicAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:8080';
// //   const defaultSender = process.env.AFROMESSAGE_SENDER_NAME || 'ALX-Bridge';

// //   const recipient = to || phone;
// //   const targetPartnerId = partnerId || partnerOrgId;
// //   const applicant = learnerName || candidateName || 'a candidate';
// //   const referralLink = link || `${publicAppUrl}/referrals/${token}`;

// //   if (!provider || provider.toLowerCase() !== 'afromessage') {
// //     console.warn('[SMS] Provider not configured. Skipping SMS send.');
// //     return { success: false, reason: 'sms_not_configured' };
// //   }

// //   if (!apiKey) {
// //     console.error('[SMS] AFROMESSAGE_API_KEY is missing.');
// //     return { success: false, reason: 'api_key_missing' };
// //   }

// //   if (!recipient) {
// //     console.error('[SMS] Recipient phone number is missing.');
// //     return { success: false, reason: 'recipient_missing' };
// //   }

// //   // Lookup partner name from the `partners` table
// //   let partnerBrand = defaultSender;
// //   if (targetPartnerId) {
// //     try {
// //       const rows = db
// //         .select({ name: partners.name })
// //         .from(partners)
// //         .where(eq(partners.id, targetPartnerId))
// //         .limit(1)
// //         .all();

// //       if (rows.length > 0 && rows[0].name) {
// //         partnerBrand = rows[0].name;
// //       }
// //     } catch (err) {
// //       console.error('[SMS] Failed to fetch partner name from DB:', err);
// //     }
// //   }

// //   // const message = `[${partnerBrand}] Hello, you have a new referral request from ${applicant}. Review and accept here: ${referralLink}`;
// //   const message = `[${partnerBrand}] New Referral Notice\n\nCandidate: ${applicant}\nA review and acceptance request has been initiated for your organization.\n\nSecure Link: ${referralLink}`;
// //   const payload = {
// //     to: recipient,
// //     message,
// //     ...(identifierKey ? { from: identifierKey } : {}),
// //   };

// //   console.log(`[SMS] Attempting AfroMessage dispatch to ${recipient} for "${partnerBrand}"...`);

// //   try {
// //     const response = await fetch('https://api.afromessage.com/api/send', {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //         'Authorization': `Bearer ${apiKey}`,
// //       },
// //       body: JSON.stringify(payload),
// //     });

// //     const data = await response.json();

// //     if (!response.ok || data.acknowledge === 'error' || data.status === 'error') {
// //       console.error('[SMS] AfroMessage rejected request:', JSON.stringify(data));
// //       return { success: false, reason: data };
// //     }

// //     console.log('[SMS] Successfully dispatched referral SMS via AfroMessage:', data);
// //     return { success: true, providerResponse: data };
// //   } catch (error) {
// //     console.error('[SMS] Network error while dispatching SMS:', error);
// //     return { success: false, reason: error.message };
// //   }
// // }

// // /**
// //  * Factory export expected by server.js and route handlers
// //  */
// // export function createSmsSender() {
// //   const provider = process.env.SMS_PROVIDER;
// //   if (!provider || provider.toLowerCase() !== 'afromessage') {
// //     return null;
// //   }
// //   return {
// //     name: provider,
// //     send: sendReferralSms,
// //     sendReferral: sendReferralSms,
// //     sendReferralSms,
// //   };
// // }


// import { eq } from 'drizzle-orm';
// import { partners } from '../db/schema.js';
// import { createDatabase } from '../db/client.js';
// import { config } from '../config.js';

// const { db } = createDatabase(config.databaseUrl);

// /**
//  * Sends a referral SMS using AfroMessage with dynamic partner branding.
//  */
// export async function sendReferralSms({
//   to,
//   phone,
//   token,
//   link,
//   partnerId,
//   partnerOrgId,
//   learnerName,
//   candidateName,
// }) {
//   const provider = process.env.SMS_PROVIDER;
//   const apiKey = process.env.AFROMESSAGE_API_KEY;
//   const identifierKey = process.env.IDENTIFIER_KEY;
//   const publicAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:8080';
//   const defaultSender = process.env.AFROMESSAGE_SENDER_NAME || 'ALX-Bridge';

//   const recipient = to || phone;
//   const targetPartnerId = partnerId || partnerOrgId;
//   const applicant = learnerName || candidateName || 'a candidate';

//   // Safety check: Fallback to a default test token if token is missing to prevent "undefined"
//   const activeToken = token || 'ref_123';
//   const referralLink = link || `${publicAppUrl}/referrals/${activeToken}`;

//   if (!provider || provider.toLowerCase() !== 'afromessage') {
//     console.warn('[SMS] Provider not configured. Skipping SMS send.');
//     return { success: false, reason: 'sms_not_configured' };
//   }

//   if (!apiKey) {
//     console.error('[SMS] AFROMESSAGE_API_KEY is missing.');
//     return { success: false, reason: 'api_key_missing' };
//   }

//   if (!recipient) {
//     console.error('[SMS] Recipient phone number is missing.');
//     return { success: false, reason: 'recipient_missing' };
//   }

//   // Lookup partner name from the `partners` table
//   let partnerBrand = defaultSender;
//   if (targetPartnerId) {
//     try {
//       const rows = db
//         .select({ name: partners.name })
//         .from(partners)
//         .where(eq(partners.id, targetPartnerId))
//         .limit(1)
//         .all();

//       if (rows.length > 0 && rows[0].name) {
//         partnerBrand = rows[0].name;
//       }
//     } catch (err) {
//       console.error('[SMS] Failed to fetch partner name from DB:', err);
//     }
//   }

//   const message = `[${partnerBrand}] New Referral Notice\n\nCandidate: ${applicant}\nA review and acceptance request has been initiated for your organization.\n\nSecure Link: ${referralLink}`;
//   const payload = {
//     to: recipient,
//     message,
//     ...(identifierKey ? { from: identifierKey } : {}),
//   };

//   console.log(`[SMS] Attempting AfroMessage dispatch to ${recipient} for "${partnerBrand}"...`);

//   try {
//     const response = await fetch('https://api.afromessage.com/api/send', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${apiKey}`,
//       },
//       body: JSON.stringify(payload),
//     });

//     const data = await response.json();

//     if (!response.ok || data.acknowledge === 'error' || data.status === 'error') {
//       console.error('[SMS] AfroMessage rejected request:', JSON.stringify(data));
//       return { success: false, reason: data };
//     }

//     console.log('[SMS] Successfully dispatched referral SMS via AfroMessage:', data);
//     return { success: true, providerResponse: data };
//   } catch (error) {
//     console.error('[SMS] Network error while dispatching SMS:', error);
//     return { success: false, reason: error.message };
//   }
// }

// /**
//  * Factory export expected by server.js and route handlers
//  */
// export function createSmsSender() {
//   const provider = process.env.SMS_PROVIDER;
//   if (!provider || provider.toLowerCase() !== 'afromessage') {
//     return null;
//   }
//   return {
//     name: provider,
//     send: sendReferralSms,
//     sendReferral: sendReferralSms,
//     sendReferralSms,
//   };
// }



import { eq } from 'drizzle-orm';
import { partners } from '../db/schema.js';
import { createDatabase } from '../db/client.js';
import { config } from '../config.js';

const { db } = createDatabase(config.databaseUrl);

/**
 * Sends a referral SMS using AfroMessage with dynamic partner branding.
 */
export async function sendReferralSms({
  to,
  phone,
  token,
  link,
  partnerId,
  partnerOrgId,
  learnerName,
  candidateName,
}) {
  const provider = process.env.SMS_PROVIDER;
  const apiKey = process.env.AFROMESSAGE_API_KEY;
  const identifierKey = process.env.IDENTIFIER_KEY;
  const publicAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:8080';
  const defaultSender = process.env.AFROMESSAGE_SENDER_NAME || 'ALX-Bridge';

  const recipient = to || phone;
  const targetPartnerId = partnerId || partnerOrgId;
  const applicant = learnerName || candidateName || 'a candidate';
  const candidateContact = recipient || 'No contact provided';

  // Safety check: Fallback to a default test token if token is missing to prevent "undefined"
  const activeToken = token || 'ref_123';
  const referralLink = link || `${publicAppUrl}/referrals/${activeToken}`;

  if (!provider || provider.toLowerCase() !== 'afromessage') {
    console.warn('[SMS] Provider not configured. Skipping SMS send.');
    return { success: false, reason: 'sms_not_configured' };
  }

  if (!apiKey) {
    console.error('[SMS] AFROMESSAGE_API_KEY is missing.');
    return { success: false, reason: 'api_key_missing' };
  }

  if (!recipient) {
    console.error('[SMS] Recipient phone number is missing.');
    return { success: false, reason: 'recipient_missing' };
  }

  // Lookup partner name from the `partners` table
  let partnerBrand = defaultSender;
  if (targetPartnerId) {
    try {
      const rows = db
        .select({ name: partners.name })
        .from(partners)
        .where(eq(partners.id, targetPartnerId))
        .limit(1)
        .all();

      if (rows.length > 0 && rows[0].name) {
        partnerBrand = rows[0].name;
      }
    } catch (err) {
      console.error('[SMS] Failed to fetch partner name from DB:', err);
    }
  }

  const message = `[${partnerBrand}] New Referral Notice\n\nCandidate: ${applicant}\nContact: ${candidateContact}\n\nA review and acceptance request has been initiated for your organization.\n\nSecure Link: ${referralLink}`;

  const payload = {
    to: recipient,
    message,
    ...(identifierKey ? { from: identifierKey } : {}),
  };

  console.log(`[SMS] Attempting AfroMessage dispatch to ${recipient} for "${partnerBrand}"...`);

  try {
    const response = await fetch('https://api.afromessage.com/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.acknowledge === 'error' || data.status === 'error') {
      console.error('[SMS] AfroMessage rejected request:', JSON.stringify(data));
      return { success: false, reason: data };
    }

    console.log('[SMS] Successfully dispatched referral SMS via AfroMessage:', data);
    return { success: true, providerResponse: data };
  } catch (error) {
    console.error('[SMS] Network error while dispatching SMS:', error);
    return { success: false, reason: error.message };
  }
}

/**
 * Factory export expected by server.js and route handlers
 */
export function createSmsSender() {
  const provider = process.env.SMS_PROVIDER;
  if (!provider || provider.toLowerCase() !== 'afromessage') {
    return null;
  }
  return {
    name: provider,
    send: sendReferralSms,
    sendReferral: sendReferralSms,
    sendReferralSms,
  };
}