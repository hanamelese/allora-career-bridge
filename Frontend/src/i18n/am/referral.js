/* ተማሪዎች የሚላኩበት አጋር ድርጅት ከኤስኤምኤስ ሊንኩ የሚከፍተው ገጽ በአማርኛ። */
export default {
  loading: 'ሪፈራሉ በመጫን ላይ ነው።',
  expiredTitle: 'ይህ የሪፈራል ሊንክ ጊዜው አልፎበታል',
  invalidTitle: 'ይህ የሪፈራል ሊንክ ትክክል አይደለም',
  expiredDescription: 'የላከውን ድርጅት አዲስ ሊንክ እንዲልክልዎ ይጠይቁ።',
  invalidDescription: 'ከጽሑፍ መልእክቱ ውስጥ ያለው ሙሉ ሊንክ መከፈቱን ያረጋግጡ።',
  testBadge: 'የሙከራ ሪፈራል',
  title: (organisation) => `ከ${organisation} የተላከ ሪፈራል`,
  lead: (learner, organisation, partner) =>
    `${learner} የመታወቂያ ሰነድ የላቸውም፤ ለምዝገባ እርዳታ ወደ ${partner} እንዲልካቸው ${organisation}ን ጠይቀዋል።`,
  leadToYou: (learner, organisation) =>
    `${learner} የመታወቂያ ሰነድ የላቸውም፤ ለምዝገባ እርዳታ ወደ እርስዎ እንዲልካቸው ${organisation}ን ጠይቀዋል።`,
  leadNoName: (organisation, partner) =>
    `የመታወቂያ ሰነድ የሌለው አንድ ተማሪ ለምዝገባ እርዳታ ወደ ${partner} እንዲላክ ${organisation}ን ጠይቋል።`,
  leadToYouNoName: (organisation) =>
    `የመታወቂያ ሰነድ የሌለው አንድ ተማሪ ለምዝገባ እርዳታ ወደ እርስዎ እንዲላክ ${organisation}ን ጠይቋል።`,
  detailsInMessage: 'የተማሪው ስም እና ስልክ ቁጥር በደረስዎት የጽሑፍ መልእክት ውስጥ አሉ። ይህ ገጽ አያሳያቸውም፤ የትም አይቀመጡም።',
  acceptedNoName: (date) => `ይህን ሪፈራል በ${date} ተቀብለዋል። እባክዎ በጽሑፍ መልእክቱ ውስጥ ያሉትን ዝርዝሮች በመጠቀም ተማሪውን አግኝተው እንዲመዘገብ ይርዱት።`,
  acceptExplanationNoName: (organisation) => `መቀበልዎ ተማሪውን እንደሚያገኙት ለ${organisation} ያሳውቃል።`,
  name: 'ስም',
  phone: 'ስልክ',
  notGiven: 'አልተሰጠም',
  referredOn: 'የተላከበት ቀን',
  linkWorksUntil: 'ሊንኩ የሚሠራው እስከ',
  accepted: (date, learner) => `ይህን ሪፈራል በ${date} ተቀብለዋል። እንዲመዘገቡ ለመርዳት እባክዎ ${learner}ን ያነጋግሩ።`,
  acceptExplanation: (organisation, learner) => `መቀበልዎ ${learner}ን እንደሚያነጋግሩ ለ${organisation} ያሳውቃል።`,
  accepting: 'በመቀበል ላይ…',
  accept: 'ሪፈራሉን ይቀበሉ',
};
