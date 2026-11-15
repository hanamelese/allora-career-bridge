/* The public front page. */
export default {
  nav: {
    label: 'Main',
    howItWorks: 'How it works',
    features: 'Features',
    integrate: 'Integrate',
  },
  goToDashboard: 'Go to your dashboard',
  signIn: 'Sign in',
  createAccount: 'Create account',
  createPartnerAccount: 'Create a partner account',
  hero: {
    eyebrow: 'For training providers, employers and NGOs',
    titleBefore: 'Forms that ',
    titleHighlight: 'everyone',
    titleAfter: ' can fill in.',
    lead:
      'Build sign-up, registration and job application forms that work by voice, by keyboard and with a screen reader, in Amharic or English. Accessibility is built in, so it is never a setting someone forgets to switch on.',
    assurances: {
      wcag: 'WCAG 2.2 AA in every form',
      noTimeLimits: 'No time limits',
      dataApart: 'Your data kept apart',
    },
    imageAlt:
      'A woman in a wheelchair uses a tablet beside screens showing accessibility symbols: an eye for low vision, a wheelchair, and a speaker for sound.',
    badgeVoice: '“I have a passport”',
    badgeContrast: (level, total) => `Contrast level ${level} of ${total}`,
  },
  stats: {
    label: 'At a glance',
    forms: 'Ready-made forms',
    languages: 'Languages',
    contrastLevels: 'Contrast levels',
    switches: 'Accessibility switches to forget',
  },
  how: {
    eyebrow: 'How it works',
    heading: 'From sign-up to a published form in four steps',
  },
  steps: {
    account: {
      title: 'Create your partner account',
      text: 'Sign up with your organisation’s name. You get your own copy of every form and your own keys, kept apart from every other partner.',
    },
    configure: {
      title: 'Configure your forms',
      text: 'Choose which questions to ask, reword them, add your own, and list the referral partners learners can be sent to.',
    },
    preview: {
      title: 'Preview exactly what people see',
      text: 'Try the real form with voice, keyboard, contrast levels, larger text and Amharic before anyone else does.',
    },
    publish: {
      title: 'Publish and embed',
      text: 'Publish a version and place it on your site with your public key. Published versions never change under you.',
    },
  },
  featuresSection: {
    eyebrow: 'What people filling in your forms get',
    heading: 'Built for disabled learners, better for everyone',
  },
  features: {
    voice: {
      title: 'Answer by speaking',
      text: 'Spoken answers are typed into the field or matched to a choice. A guess is always confirmed first.',
    },
    readAloud: {
      title: 'Read aloud',
      text: 'Every question, and every answer given, can be heard, in English or Amharic.',
    },
    contrast: {
      title: 'Contrast and text size',
      text: 'Four contrast levels from WCAG AA to yellow on black, and three text sizes, chosen by the learner.',
    },
    keyboard: {
      title: 'Keyboard and screen readers',
      text: 'Every control is reachable by Tab, named for NVDA and other screen readers, with a focus ring you can always see.',
    },
    language: {
      title: 'Amharic and English',
      text: 'Learners switch language at any point, and simple words make every question easier to follow.',
    },
    noId: {
      title: 'A way through without ID',
      text: 'A learner with no document can ask one of your referral partners for help, by text message, at the end of the form.',
    },
  },
  formsSection: {
    eyebrow: 'Included',
    heading: 'Four forms, ready to configure',
  },
  forms: {
    account: 'An accessible sign-in for your own site, with Google, LinkedIn and more.',
    signup: 'Who the learner is, their background, and private support requests.',
    jobApplication: 'Applications with voice answers and private interview accommodations.',
    employer: 'Organisation details and the accommodations a workplace offers.',
  },
  integrate: {
    eyebrow: 'Integrate',
    heading: 'One public key, one published version',
    versions:
      'Each published form has a fixed version number, so a site pinned to it keeps getting exactly what was published. Your public key only reads your own published forms; your secret key never leaves the server.',
    embed:
      'Each form’s Embed tag page gives you a two-line tag to paste into your site; the form then hands each submission, with any files, to your page’s own code. The published configuration is also available directly from the public API:',
    codeLabel: 'Example request for a published form',
  },
  closing: {
    heading: 'Ready to make your forms work for everyone?',
    text: 'It takes a minute to create an account, and your forms are ready to configure straight away.',
  },
  footer: {
    haveAccount: 'Already have an account?',
  },
  modal: {
    signInTo: (product) => `Sign in to ${product}`,
  },
};
