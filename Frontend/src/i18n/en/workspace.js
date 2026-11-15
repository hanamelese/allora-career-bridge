/* One form's workspace: the save/publish bar, Preview, Publish and Embed tag. */
export default {
  unknownForm: {
    title: 'That form does not exist',
    description: 'Choose a form from the Forms list to continue.',
  },
  loadingLabel: (formName) => `Loading ${formName}`,
  loadingText: (formName) => `Loading ${formName}.`,
  loadError: {
    title: 'This form could not be loaded',
    notFound:
      'No saved configuration was found for this form. Reloading will start it from the standard settings.',
    generic: 'The dashboard could not read this form. Check your connection and try again.',
  },
  draftHint: 'Learners only ever see published versions. Changes stay in the draft until you publish.',

  actions: {
    draftSaved: 'Draft saved.',
    versionPublished: (version) => `Version ${version} published.`,
    notSavedYet: 'Not saved yet',
    savedAt: (when) => `Saved ${when}`,
    publishedVersion: (version) => `Published · version ${version}`,
    draft: 'Draft',
    unsavedChanges: 'Unsaved changes',
    saving: 'Saving…',
    saveDraft: 'Save draft',
    publish: 'Publish',
    blocked:
      'Some settings need attention before this form can be saved or published. The Configure view explains what.',
  },

  publishDialog: {
    title: (version) => `Publish version ${version}?`,
    fixed: (version) =>
      `Version ${version} will be fixed as it is now and can never be changed. Learners will see it as soon as it is published.`,
    savesFirst: (version) =>
      `Your unsaved changes will be saved first, so version ${version} matches what you are looking at.`,
    previousStays: (version) =>
      `Version ${version} stays available, so any website pinned to it keeps working.`,
    cancel: 'Cancel',
    publishing: 'Publishing…',
    confirm: (version) => `Publish version ${version}`,
  },

  preview: {
    title: 'Live preview',
    descriptionAccount: (formName) =>
      `This is ${formName} exactly as people on your site will meet it: the social sign-in choices first, then one question per screen, every option reachable by keyboard and named for screen readers. It updates as you change the settings.`,
    description: (formName) =>
      `This is ${formName} exactly as a learner meets it: one question per screen, with a chance to check every answer before sending. It updates as you change the settings.`,
    fullView: 'Full view',
    fullViewLabel: (formName) => `Full view: ${formName} preview`,
    closeFullView: 'Close full view',
    startAgain: 'Start again',
    partnersError: 'Your referral partners could not be loaded, so the referral step shows none.',
    partnersNote:
      'Send link in this preview really sends a text message to the referral partners you choose, marked as a test.',
    settingsNote:
      'Learners change contrast, text size, language and simple words from the Settings button at the top of the form.',
    socialSignIn: (provider, url) => `On your site, “${provider}” opens ${url}. The preview stays here.`,
    accountSubmit: (details) => `On your site, these details go to your own sign-in system: ${details}.`,
    passwordHidden: 'password (hidden)',
    listSeparator: ', ',
    answersSent: (count) =>
      `On your site, ${count} ${count === 1 ? 'answer goes' : 'answers go'} to your page in the onboarding-submit event.`,
    filesPassed: (files) => `Files passed with them: ${files}.`,
    nothingSent: 'Nothing was sent from this preview.',
  },

  publish: {
    notYet: 'Not yet',
    stateTitle: 'Current state',
    stateDescription:
      'Only published versions are served to learners. A published version can never change - publishing again creates a new one.',
    published: 'Published',
    draft: 'Draft',
    formId: 'Form ID',
    liveVersion: 'Live version',
    version: (version) => `Version ${version}`,
    nonePublished: 'None published',
    draftLastSaved: 'Draft last saved',
    lastPublished: 'Last published',
    nextPublished: (version) => `Next: put version ${version} on your website with its embed tag.`,
    nextUnpublished: 'Once you publish, the embed tag puts this form on your website.',
    getEmbedTag: 'Get your embed tag',
    historyTitle: 'Version history',
    historyDescription:
      'Every published version is kept and can never be changed, so a website pinned to an older version keeps working.',
    emptyTitle: 'Nothing published yet',
    emptyDescription:
      'When you publish this form it will appear here with its version number and publish date.',
    live: 'Live',
    publishedAt: (when) => `Published ${when}`,
  },

  embed: {
    title: 'Embed tag',
    description:
      'Copy this tag into your website where the form should appear. It always shows the latest published version, never your draft.',
    noTagTitle: 'There is no tag yet.',
    noTagBefore:
      ' A tag always points at a published version, and this form has not been published. Use ',
    noTagPublish: 'Publish',
    noTagAfter: ' above to publish version 1; its tag then appears here.',
    versionInTag: 'Version in this tag',
    version: (version) => `Version ${version}`,
    latestPublished: 'Latest published',
    published: 'Published',
    formId: 'Form ID',
    publicKey: 'Public key',
    widgetVersion: 'Widget version',
    draftDiffers: (version) =>
      `Your draft has changes that are not live yet. This tag shows version ${version}, as published. Publish a new version to put your changes on your site.`,
    codeLabel: (version) => `Embed tag for version ${version}`,
    copied: 'Copied',
    copyTag: 'Copy the tag',
    copiedStatus: (version) => `Embed tag for version ${version} copied to your clipboard.`,
    selectedStatus:
      'Your browser did not allow copying. The tag is selected: press Ctrl+C (or Cmd+C) to copy it.',
    whereTitle: 'Where it goes',
    whereText: 'Paste it into your page’s HTML where the form should appear. The script loads from',
    whereEnd: '.',
    allowedTitle: 'Allowed websites',
    allowedBefore: 'Add your site’s address under',
    allowedLink: 'Your organisation → Websites',
    allowedAfter: ', or the form will not load there.',
    publicKeyText: 'Safe to put in a web page. Your secret key stays on the server and is never included here.',
    answersTitle: 'Getting the answers',
    answersText:
      'When someone sends the form, your page receives every answer as JSON in the onboarding-submit event, with any files as File objects. Process them as you need, for example by saving them on your own server:',
    answersCodeLabel: 'Example code for collecting the answers',
    answersNote:
      'Allora Accessibility Bridge never receives or keeps the answers. To have them posted straight to your own server as well, add its address under Your organisation → Where submitted forms go.',
    pinnedTitle: 'Pinned versions',
    pinnedText: (version) =>
      `Your site keeps showing version ${version} until you paste a newer tag, even after you publish again.`,
  },
};
