/* The public page a referral partner opens from the link in a referral SMS. */
export default {
  loading: 'Loading the referral.',
  expiredTitle: 'This referral link has expired',
  invalidTitle: 'This referral link is not valid',
  expiredDescription: 'Ask the organisation that sent it to send a new one.',
  invalidDescription: 'Check that the whole link from the text message was opened.',
  testBadge: 'Test referral',
  title: (organisation) => `Referral from ${organisation}`,
  lead: (learner, organisation, partner) =>
    `${learner} has no identity document and asked ${organisation} to refer them to ${partner} for help with registering.`,
  leadToYou: (learner, organisation) =>
    `${learner} has no identity document and asked ${organisation} to refer them to you for help with registering.`,
  leadNoName: (organisation, partner) =>
    `A learner with no identity document asked ${organisation} to refer them to ${partner} for help with registering.`,
  leadToYouNoName: (organisation) =>
    `A learner with no identity document asked ${organisation} to refer them to you for help with registering.`,
  detailsInMessage:
    'Their name and phone number are in the text message you received. This page does not show them, and they are not kept.',
  acceptedNoName: (date) => `You accepted this referral on ${date}. Please contact the learner, using the details in the text message, to help them register.`,
  acceptExplanationNoName: (organisation) => `Accepting lets ${organisation} know you will contact the learner.`,
  name: 'Name',
  phone: 'Phone',
  notGiven: 'Not given',
  referredOn: 'Referred on',
  linkWorksUntil: 'Link works until',
  accepted: (date, learner) => `You accepted this referral on ${date}. Please contact ${learner} to help them register.`,
  acceptExplanation: (organisation, learner) => `Accepting lets ${organisation} know you will contact ${learner}.`,
  accepting: 'Accepting…',
  accept: 'Accept referral',
};
