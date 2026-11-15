/* The dashboard frame: header, sidebar and the workflow cards. */
export default {
  product: 'Allora Accessibility Bridge',
  tagline: 'Accessible Onboarding',
  home: 'Home',
  signOut: 'Sign out',
  sidebar: {
    label: 'Dashboard',
    organisationHeading: 'Organisation',
    yourOrganisation: 'Your organisation',
    organisationSummary: 'Where forms go, referral partners and the websites that show your forms',
    formsHeading: 'Forms',
  },
  workflow: {
    label: 'Form workflow',
    configure: { label: 'Configure', description: 'Choose fields and settings' },
    preview: { label: 'Preview', description: 'See the learner experience' },
    publish: { label: 'Publish', description: 'Save and publish a version' },
    embed: { label: 'Embed tag', description: 'Put it on your website' },
  },
  announce: {
    view: (formName, view) => `${formName}, ${view} view.`,
    organisation: 'Your organisation: referral partners and websites.',
  },
};
