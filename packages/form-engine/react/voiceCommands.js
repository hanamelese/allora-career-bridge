/**
 * What a spoken phrase asks the form to do, for hands-free Voice control.
 *
 * `parseCommand(transcript)` returns one of:
 *   { type: 'next' | 'back' | 'repeat' | 'read' | 'options' | 'clear'
 *           | 'send' | 'help' | 'stop' | 'yes' | 'no' }
 *   { type: 'choose', number }        "option 2", "the second one", "ሁለተኛ"
 *   { type: 'choose', target }        "choose Addis Ababa", "Addis Ababa ምረጥ"
 *   { type: 'answer', text }          anything else, or "my answer is …"
 *
 * Commands are recognised in English and Amharic whatever the form's
 * language, because a learner may switch. A whole phrase must match, so an
 * answer that merely contains "next" is still an answer; to give a command
 * word as an answer, say "my answer is …" ("መልሴ … ነው").
 *
 * The Amharic phrases are a first draft and need checking by a native
 * speaker.
 */

const COMMANDS = [
  ['next', ['next', 'next question', 'next one', 'continue', 'go on', 'go next', 'go forward', 'forward', 'check my answers', 'review', 'review my answers', 'ቀጣይ', 'ቀጥል', 'ቀጣዩ', 'ቀጣዩ ጥያቄ', 'ወደ ፊት', 'ወደፊት', 'መልሶቼን አረጋግጥ']],
  ['back', ['back', 'go back', 'previous', 'previous question', 'last question', 'ተመለስ', 'ወደ ኋላ', 'ወደኋላ', 'ያለፈው', 'የቀድሞው', 'የቀድሞው ጥያቄ', 'ያለፈው ጥያቄ']],
  ['repeat', ['repeat', 'repeat that', 'say again', 'say that again', 'again', 'pardon', 'sorry', 'what did you say', 'ድገም', 'ደግመው', 'እንደገና', 'እንደገና በል', 'ይድገሙ']],
  ['read', ['read', 'read question', 'read the question', 'read it', 'read aloud', 'read this', 'what is the question', 'question', 'አንብብ', 'ጥያቄውን አንብብ', 'ጥያቄው ምንድነው', 'አንብብልኝ']],
  ['options', ['options', 'read options', 'read the options', 'what are the options', 'choices', 'read the choices', 'what can i choose', 'አማራጮች', 'አማራጮቹ', 'አማራጮቹን አንብብ', 'ምርጫዎች']],
  ['clear', ['clear', 'clear it', 'clear answer', 'clear my answer', 'erase', 'delete', 'delete it', 'remove my answer', 'አጽዳ', 'አጥፋ', 'ሰርዝ', 'መልሱን አጥፋ']],
  ['send', ['send', 'submit', 'send it', 'send my answers', 'submit my answers', 'submit answers', 'send the form', 'submit the form', 'finish', 'sign in', 'sign me in', 'log in', 'create account', 'create my account', 'sign up', 'ላክ', 'ላከው', 'መልሶቼን ላክ', 'አስገባ', 'ጨርስ', 'ግባ', 'መለያ ፍጠር']],
  ['help', ['help', 'what can i say', 'commands', 'voice commands', 'እገዛ', 'እርዳታ', 'ምን ማለት እችላለሁ']],
  ['stop', ['stop', 'stop listening', 'stop voice control', 'voice control off', 'turn off voice control', 'exit', 'quit', 'be quiet', 'silence', 'አቁም', 'ዝም በል', 'ውጣ', 'ማዳመጥ አቁም']],
  ['yes', ['yes', 'yeah', 'yep', 'yes please', 'sure', 'correct', 'right', 'confirm', 'ok', 'okay', 'i agree', 'agree', 'አዎ', 'አዎን', 'እሺ', 'ትክክል', 'እስማማለሁ']],
  ['no', ['no', 'nope', 'no thanks', 'cancel', 'not now', 'wait', 'wrong', 'አይ', 'አይደለም', 'ተው', 'ይቅር', 'አልስማማም']],
];

const LOOKUP = new Map();
for (const [type, phrases] of COMMANDS) {
  for (const phrase of phrases) LOOKUP.set(phrase, type);
}

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10,
  አንድ: 1, ሁለት: 2, ሶስት: 3, ሦስት: 3, አራት: 4, አምስት: 5, ስድስት: 6, ሰባት: 7, ስምንት: 8, ዘጠኝ: 9, አስር: 10, አሥር: 10,
  አንደኛ: 1, የመጀመሪያው: 1, መጀመሪያ: 1, ሁለተኛ: 2, ሁለተኛው: 2, ሶስተኛ: 3, ሦስተኛ: 3, ሶስተኛው: 3, ሦስተኛው: 3,
  አራተኛ: 4, አራተኛው: 4, አምስተኛ: 5, አምስተኛው: 5, ስድስተኛ: 6, ስድስተኛው: 6, ሰባተኛ: 7, ሰባተኛው: 7,
  ስምንተኛ: 8, ስምንተኛው: 8, ዘጠነኛ: 9, ዘጠነኛው: 9, አስረኛ: 10, አሥረኛ: 10, አስረኛው: 10,
  '፩': 1, '፪': 2, '፫': 3, '፬': 4, '፭': 5, '፮': 6, '፯': 7, '፰': 8, '፱': 9, '፲': 10,
};

/** Lower case, single spaces, no surrounding punctuation (including ። and ፣). */
export function normalisePhrase(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[.,!?;:"“”'‘’()።፣፤፥፦]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Recognition often writes "option to" or "number for": read as numbers only after such a word. */
const HOMOPHONES = { to: 2, too: 2, for: 4, won: 1 };
const FILLER = new Set(['option', 'number', 'the', 'choose', 'select', 'pick', 'answer', 'አማራጭ', 'ቁጥር', 'ምረጥ', 'ይምረጡ']);

function toNumber(word, afterFiller) {
  if (/^\d{1,2}$/.test(word)) return Number(word);
  return NUMBER_WORDS[word] ?? (afterFiller ? HOMOPHONES[word] ?? null : null);
}

/* "option 2", "number two", "the second one", "choose the third", "ሁለተኛው", "አማራጭ ሁለት", "2". */
function parseNumber(phrase) {
  const all = phrase.split(' ');
  let words = all.filter((word) => !FILLER.has(word));
  if (words.length === 2 && words[1] === 'one') words = [words[0]];
  if (words.length !== 1) return null;
  const number = toNumber(words[0], words.length < all.length);
  return number && number >= 1 ? number : null;
}

export function parseCommand(transcript) {
  const phrase = normalisePhrase(transcript);
  if (!phrase) return { type: 'none' };

  const command = LOOKUP.get(phrase);
  if (command) return { type: command };

  // An answer said on purpose, even if it is a command word.
  const answerEn = phrase.match(/^(?:my answer is|the answer is|answer|type|write)\s+(.+)$/);
  if (answerEn) return { type: 'answer', text: originalTail(transcript, answerEn[1]) };
  const answerAm = phrase.match(/^መልሴ\s+(.+?)(?:\s+ነው)?$/);
  if (answerAm) return { type: 'answer', text: answerAm[1] };

  const number = parseNumber(phrase);
  if (number) return { type: 'choose', number };

  const chooseEn = phrase.match(/^(?:choose|select|pick|tick)\s+(.+)$/);
  if (chooseEn) return { type: 'choose', target: chooseEn[1] };
  const chooseAm = phrase.match(/^(?:ምረጥ|ይምረጡ)\s+(.+)$/) ?? phrase.match(/^(.+?)\s+(?:ን\s+)?(?:ምረጥ|ይምረጡ)$/);
  if (chooseAm) return { type: 'choose', target: chooseAm[1] };

  return { type: 'answer', text: String(transcript).trim() };
}

/* Keeps the learner's own capitals in an answer given as "my answer is …". */
function originalTail(transcript, lowerTail) {
  const original = String(transcript).trim();
  const index = original.toLowerCase().lastIndexOf(lowerTail.split(' ')[0]);
  return index >= 0 ? original.slice(index).replace(/[.!?።]+$/, '').trim() : lowerTail;
}

/**
 * Tidies dictated text for the kind of question: an email address said
 * as "selam at example dot org" becomes "selam@example.org"; a phone
 * number loses its spaces.
 */
export function tidyDictation(text, type) {
  const value = String(text ?? '').trim().replace(/[.。]+$/, '');
  if (type === 'email') {
    return value
      .toLowerCase()
      .replace(/\s+at\s+/g, '@')
      .replace(/\s+dot\s+/g, '.')
      .replace(/\s+/g, '');
  }
  if (type === 'phone') return value.replace(/[^\d+]/g, '');
  return value;
}
