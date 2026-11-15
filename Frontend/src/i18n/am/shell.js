export default {
  product: 'Allora Accessibility Bridge',
  tagline: 'ተደራሽ ምዝገባ',
  home: 'መነሻ',
  signOut: 'ውጣ',
  sidebar: {
    label: 'ዳሽቦርድ',
    organisationHeading: 'ድርጅት',
    yourOrganisation: 'የእርስዎ ድርጅት',
    organisationSummary: 'ቅጾች የሚሄዱበት፣ ተማሪዎች የሚላኩባቸው አጋር ድርጅቶች እና ቅጾችዎን የሚያሳዩ ድረ-ገጾች',
    formsHeading: 'ቅጾች',
  },
  workflow: {
    label: 'የቅጽ የሥራ ሂደት',
    configure: { label: 'አዋቅር', description: 'ጥያቄዎችንና ቅንብሮችን ይምረጡ' },
    preview: { label: 'ቅድመ እይታ', description: 'ተማሪው የሚያየውን ይመልከቱ' },
    publish: { label: 'አትም', description: 'ስሪት ያስቀምጡና ያትሙ' },
    embed: { label: 'የማካተቻ ኮድ', description: 'በድረ-ገጽዎ ላይ ያስቀምጡት' },
  },
  announce: {
    view: (formName, view) => `${formName}፣ ${view}።`,
    organisation: 'የእርስዎ ድርጅት፦ አጋር ድርጅቶች እና ድረ-ገጾች።',
  },
};
