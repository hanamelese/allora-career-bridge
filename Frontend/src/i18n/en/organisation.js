/* Your organisation: referral partners and allowed websites. */
export default {
  title: 'Your organisation',
  partnersTitle: 'Referral partners',
  partnersDescription:
    'Organisations that can help someone who has no identity document. On the learner and job application forms, a person who chooses “I have no document, refer me” can ask for a link to be sent to one or more of them by SMS. They see only the names.',
  websitesTitle: 'Websites',
  websitesDescription:
    'The websites allowed to show your embedded forms. A browser on any other site is refused, so your embed tag only works where you put it.',

  deliveryTitle: 'Where submitted forms go',
  deliveryDescription:
    'Allora Accessibility Bridge never receives or keeps what people send. Every answer goes to your website: the embedded form hands them to your page as JSON (see a form’s Embed tag page). If you also want them posted straight to your own server, add its address here.',

  delivery: {
    statusOff: 'No server address: answers go to your website’s page only.',
    statusOn: 'Answers also go to',
    label: 'Server address (optional)',
    help: 'Your own server’s address, starting with https://. Use http:// only for localhost while testing.',
    invalid: 'Enter a full https:// address, like https://forms.example.org/receive. http:// is allowed only for localhost while testing.',
    save: 'Save address',
    saved: (url) => `Answers now also go to ${url}.`,
    stop: 'Remove address',
    stopped: 'Address removed. Answers now go to your website’s page only.',
    secretTitle: 'Signing secret',
    secretHelp:
      'Each delivery carries a token signed with this secret. Your server uses it to check that a submission came through one of your published forms. Keep it on your server; never put it in a web page.',
    showSecret: 'Show secret',
    copySecret: 'Copy secret',
    secretCopied: 'The signing secret was copied.',
    copyFailed: 'It could not be copied automatically, so it is shown for you to copy.',
    renewSecret: 'Make a new secret',
    secretRenewed: 'A new signing secret was made. Update your server: deliveries signed with the old one will fail its check.',
    howTitle: 'What your server needs to do',
    how1: 'Accept a POST request with a JSON body at this address, from the websites that show your forms (answer the browser’s CORS check for them, allowing the Content-Type header).',
    how2: 'Check the token in the body: its signature (HMAC-SHA256 with your signing secret), that it has not expired, and that its form matches the form in the body.',
    how3: 'Keep the answers as your organisation needs, under your own data policy.',
    how4: 'Reply with a 2xx status, optionally with a JSON receiptId. Any other reply tells the person their answers were not sent, and they can try again.',
    howNote:
      'Private support answers, ID numbers and files are never sent to this address; they go only to your page. The repository’s tools/delivery-receiver is a small example receiver for testing.',
  },

  origins: {
    invalid: 'Enter the address your form will be on, starting with https://, like https://www.example.org.',
    added: (origin) => `${origin} can now show your forms.`,
    removed: (origin) => `${origin} was removed. Forms embedded there will stop loading.`,
    remove: 'Remove',
    empty: 'No websites yet. Until you add one, your embedded forms only load on this dashboard’s own address.',
    label: 'Website address',
    help: 'Only the start of the address counts (https://www.example.org), so every page on that site can show your forms. Use https; http is only accepted for localhost, for testing.',
    add: 'Add website',
  },

  partners: {
    added: (name) => `${name} was added.`,
    updated: (name) => `${name} was updated.`,
    removed: (name) => `${name} was removed.`,
    loading: 'Loading referral partners.',
    loadError: 'Referral partners could not be loaded',
    emptyTitle: 'No referral partners yet',
    emptyDescription:
      'Add the organisations you work with. Learners with no identity document can then ask for one of them to help.',
    save: (name) => `Save ${name}`,
    email: 'Email: ',
    phone: 'Phone: ',
    confirmLabel: (name) => `Remove ${name}?`,
    confirmText: (name) => `Remove ${name}? Learners will no longer be able to choose it.`,
    remove: 'Remove',
    keep: 'Keep',
    edit: 'Edit',
    editLabel: (name) => `Edit ${name}`,
    removeLabel: (name) => `Remove ${name}`,
    addHeading: 'Add a referral partner',
    addSubmit: 'Add partner',
  },

  partnerForm: {
    allRequired: 'All three details are required.',
    name: 'Organisation name *',
    email: 'Email address *',
    phone: 'Mobile number for SMS *',
    phoneHelp: 'Start with the country code, for example +251 911 234 567. Referral links are sent here by SMS.',
    saving: 'Saving…',
    cancel: 'Cancel',
  },
};
