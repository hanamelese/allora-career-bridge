export default {
  unknownForm: {
    title: 'እንዲህ ያለ ቅጽ የለም',
    description: 'ለመቀጠል ከቅጾች ዝርዝር ውስጥ አንድ ቅጽ ይምረጡ።',
  },
  loadingLabel: (formName) => `${formName} በመጫን ላይ`,
  loadingText: (formName) => `${formName} በመጫን ላይ።`,
  loadError: {
    title: 'ይህ ቅጽ ሊጫን አልቻለም',
    notFound: 'ለዚህ ቅጽ የተቀመጠ ውቅር አልተገኘም። እንደገና ሲጫን በመደበኛ ቅንብሮች ይጀምራል።',
    generic: 'ዳሽቦርዱ ይህን ቅጽ ማንበብ አልቻለም። ግንኙነትዎን አረጋግጠው እንደገና ይሞክሩ።',
  },
  draftHint: 'ተማሪዎች የሚያዩት የታተሙ ስሪቶችን ብቻ ነው። እስኪያትሙ ድረስ ለውጦች በረቂቁ ውስጥ ይቆያሉ።',

  actions: {
    draftSaved: 'ረቂቁ ተቀምጧል።',
    versionPublished: (version) => `ስሪት ${version} ታትሟል።`,
    notSavedYet: 'ገና አልተቀመጠም',
    savedAt: (when) => `የተቀመጠው ${when}`,
    publishedVersion: (version) => `የታተመ · ስሪት ${version}`,
    draft: 'ረቂቅ',
    unsavedChanges: 'ያልተቀመጡ ለውጦች',
    saving: 'በማስቀመጥ ላይ…',
    saveDraft: 'ረቂቁን አስቀምጥ',
    publish: 'አትም',
    blocked: 'ይህ ቅጽ ከመቀመጡ ወይም ከመታተሙ በፊት አንዳንድ ቅንብሮች መስተካከል አለባቸው። ምን እንደሆኑ በአዋቅር ገጹ ላይ ተገልጿል።',
  },

  publishDialog: {
    title: (version) => `ስሪት ${version} ይታተም?`,
    fixed: (version) =>
      `ስሪት ${version} አሁን ባለበት ሁኔታ ይጸናል፤ ከዚያ በኋላ ፈጽሞ ሊለወጥ አይችልም። እንደታተመ ወዲያውኑ ተማሪዎች ያዩታል።`,
    savesFirst: (version) =>
      `ስሪት ${version} አሁን ከሚያዩት ጋር እንዲመሳሰል፣ ያልተቀመጡ ለውጦችዎ መጀመሪያ ይቀመጣሉ።`,
    previousStays: (version) =>
      `ስሪት ${version} እንዳለ ይቆያል፤ ስለዚህ በእሱ ላይ የተቆለፈ ማንኛውም ድረ-ገጽ መሥራቱን ይቀጥላል።`,
    cancel: 'ይቅር',
    publishing: 'በማተም ላይ…',
    confirm: (version) => `ስሪት ${version} አትም`,
  },

  preview: {
    title: 'የቀጥታ ቅድመ እይታ',
    descriptionAccount: (formName) =>
      `ይህ ${formName} በድረ-ገጽዎ ላይ ያሉ ሰዎች በትክክል የሚያገኙት ነው፦ መጀመሪያ በማኅበራዊ መለያ የመግቢያ አማራጮች፣ ከዚያ በእያንዳንዱ ገጽ አንድ ጥያቄ፤ እያንዳንዱ አማራጭ በቁልፍ ሰሌዳ የሚደረስበትና ለስክሪን አንባቢዎች የተሰየመ ነው። ቅንብሮቹን ሲቀይሩ ይታደሳል።`,
    description: (formName) =>
      `ይህ ${formName} ተማሪ በትክክል የሚያገኘው ነው፦ በእያንዳንዱ ገጽ አንድ ጥያቄ፣ ከመላኩ በፊት እያንዳንዱን መልስ የመፈተሽ ዕድል ያለው። ቅንብሮቹን ሲቀይሩ ይታደሳል።`,
    fullView: 'ሙሉ እይታ',
    fullViewLabel: (formName) => `ሙሉ እይታ፦ የ${formName} ቅድመ እይታ`,
    closeFullView: 'ሙሉ እይታን ዝጋ',
    startAgain: 'እንደገና ጀምር',
    partnersError: 'ተማሪዎች የሚላኩባቸው አጋር ድርጅቶችዎ ሊጫኑ አልቻሉም፤ ስለዚህ የማስተላለፊያው ደረጃ ምንም አያሳይም።',
    partnersNote:
      'በዚህ ቅድመ እይታ ውስጥ «ማስፈንጠሪያ ላክ» ለሚመርጧቸው አጋር ድርጅቶች በእርግጥ የጽሑፍ መልእክት ይልካል፤ መልእክቱ ሙከራ እንደሆነ ምልክት ይደረግበታል።',
    settingsNote:
      'ተማሪዎች ንፅፅርን፣ የጽሑፍ መጠንን፣ ቋንቋን እና ቀላል ቃላትን ከቅጹ አናት ላይ ካለው የቅንብሮች አዝራር ይቀይራሉ።',
    socialSignIn: (provider, url) => `በድረ-ገጽዎ ላይ «${provider}» ${url}ን ይከፍታል። ቅድመ እይታው እዚሁ ይቆያል።`,
    accountSubmit: (details) => `በድረ-ገጽዎ ላይ እነዚህ ዝርዝሮች ወደ ራስዎ የመግቢያ ሥርዓት ይሄዳሉ፦ ${details}።`,
    passwordHidden: 'የይለፍ ቃል (የተደበቀ)',
    listSeparator: '፣ ',
    answersSent: (count) =>
      `በድረ-ገጽዎ ላይ ${count} ${count === 1 ? 'መልስ' : 'መልሶች'} በonboarding-submit ክስተት ወደ ገጽዎ ይሄዳሉ።`,
    filesPassed: (files) => `አብረው የሚተላለፉ ፋይሎች፦ ${files}።`,
    nothingSent: 'ከዚህ ቅድመ እይታ ምንም አልተላከም።',
  },

  publish: {
    notYet: 'ገና የለም',
    stateTitle: 'አሁን ያለበት ሁኔታ',
    stateDescription:
      'ለተማሪዎች የሚቀርቡት የታተሙ ስሪቶች ብቻ ናቸው። የታተመ ስሪት ፈጽሞ አይለወጥም - እንደገና ማተም አዲስ ስሪት ይፈጥራል።',
    published: 'የታተመ',
    draft: 'ረቂቅ',
    formId: 'የቅጽ መለያ (Form ID)',
    liveVersion: 'በሥራ ላይ ያለ ስሪት',
    version: (version) => `ስሪት ${version}`,
    nonePublished: 'ምንም አልታተመም',
    draftLastSaved: 'ረቂቁ ለመጨረሻ ጊዜ የተቀመጠው',
    lastPublished: 'ለመጨረሻ ጊዜ የታተመው',
    nextPublished: (version) => `ቀጣይ፦ ስሪት ${version}ን በማካተቻ ኮዱ በድረ-ገጽዎ ላይ ያስቀምጡ።`,
    nextUnpublished: 'ካተሙ በኋላ የማካተቻ ኮዱ ይህን ቅጽ በድረ-ገጽዎ ላይ ያስቀምጠዋል።',
    getEmbedTag: 'የማካተቻ ኮድዎን ያግኙ',
    historyTitle: 'የስሪት ታሪክ',
    historyDescription:
      'እያንዳንዱ የታተመ ስሪት ይቀመጣል፤ ፈጽሞም አይለወጥም። ስለዚህ በቀድሞ ስሪት ላይ የተቆለፈ ድረ-ገጽ መሥራቱን ይቀጥላል።',
    emptyTitle: 'ገና ምንም አልታተመም',
    emptyDescription: 'ይህን ቅጽ ሲያትሙ ከስሪት ቁጥሩና ከታተመበት ቀን ጋር እዚህ ይታያል።',
    live: 'በሥራ ላይ',
    publishedAt: (when) => `የታተመው ${when}`,
  },

  embed: {
    title: 'የማካተቻ ኮድ',
    description:
      'ቅጹ እንዲታይ በሚፈልጉበት ቦታ ይህን ኮድ ወደ ድረ-ገጽዎ ይቅዱ። ሁልጊዜ የቅርብ ጊዜውን የታተመ ስሪት ያሳያል፤ ረቂቅዎን ፈጽሞ አያሳይም።',
    noTagTitle: 'ገና የማካተቻ ኮድ የለም።',
    noTagBefore: ' የማካተቻ ኮድ ሁልጊዜ የታተመ ስሪትን ያመለክታል፤ ይህ ቅጽ ደግሞ ገና አልታተመም። ስሪት 1ን ለማተም ከላይ ያለውን ',
    noTagPublish: 'አትም',
    noTagAfter: ' ይጠቀሙ፤ ከዚያ ኮዱ እዚህ ይታያል።',
    versionInTag: 'በዚህ ኮድ ውስጥ ያለው ስሪት',
    version: (version) => `ስሪት ${version}`,
    latestPublished: 'የቅርብ ጊዜው የታተመ',
    published: 'የታተመው',
    formId: 'የቅጽ መለያ (Form ID)',
    publicKey: 'ይፋዊ ቁልፍ',
    widgetVersion: 'የዊጀት ስሪት',
    draftDiffers: (version) =>
      `ረቂቅዎ ገና በሥራ ላይ ያልዋሉ ለውጦች አሉት። ይህ ኮድ እንደታተመው ስሪት ${version}ን ያሳያል። ለውጦችዎን በድረ-ገጽዎ ላይ ለማድረግ አዲስ ስሪት ያትሙ።`,
    codeLabel: (version) => `ለስሪት ${version} የማካተቻ ኮድ`,
    copied: 'ተቀድቷል',
    copyTag: 'ኮዱን ቅዳ',
    copiedStatus: (version) => `ለስሪት ${version} የማካተቻ ኮድ ወደ ቅንጥብ ሰሌዳዎ ተቀድቷል።`,
    selectedStatus: 'አሳሽዎ መቅዳት አልፈቀደም። ኮዱ ተመርጧል፦ ለመቅዳት Ctrl+C (ወይም Cmd+C) ይጫኑ።',
    whereTitle: 'የት እንደሚቀመጥ',
    whereText: 'ቅጹ እንዲታይ በሚፈልጉበት ቦታ በገጽዎ HTML ውስጥ ይለጥፉት። ስክሪፕቱ የሚጫነው ከዚህ ነው፦',
    whereEnd: '።',
    allowedTitle: 'የተፈቀዱ ድረ-ገጾች',
    allowedBefore: 'የድረ-ገጽዎን አድራሻ በዚህ ስር ያክሉ፦',
    allowedLink: 'የእርስዎ ድርጅት → ድረ-ገጾች',
    allowedAfter: '፤ አለበለዚያ ቅጹ እዚያ አይጫንም።',
    publicKeyText: 'በድረ-ገጽ ውስጥ ማስቀመጥ ደኅንነቱ የተጠበቀ ነው። ሚስጥራዊ ቁልፍዎ በአገልጋዩ ላይ ይቆያል፤ እዚህ ፈጽሞ አይካተትም።',
    answersTitle: 'መልሶቹን ማግኘት',
    answersText:
      'አንድ ሰው ቅጹን ሲልክ፣ ገጽዎ እያንዳንዱን መልስ በ onboarding-submit ክስተት ውስጥ እንደ JSON ይቀበላል፤ ፋይሎች ካሉ እንደ File ዕቃዎች ይመጣሉ። እንደሚፈልጉት ያስኬዷቸው፤ ለምሳሌ በራስዎ አገልጋይ ላይ በማስቀመጥ፦',
    answersCodeLabel: 'መልሶቹን ለመሰብሰብ የሚያገለግል ምሳሌ ኮድ',
    answersNote:
      'Allora Accessibility Bridge መልሶቹን አይቀበልም፤ አያስቀምጥምም። በተጨማሪ በቀጥታ ወደ ራስዎ አገልጋይ እንዲላኩ ከፈለጉ፣ አድራሻውን በ«የእርስዎ ድርጅት → የተላኩ ቅጾች የሚሄዱበት» ስር ያስገቡ።',
    pinnedTitle: 'የተቆለፉ ስሪቶች',
    pinnedText: (version) =>
      `እንደገና ቢያትሙም እንኳ፣ አዲስ ኮድ እስኪለጥፉ ድረስ ድረ-ገጽዎ ስሪት ${version}ን ማሳየቱን ይቀጥላል።`,
  },
};
