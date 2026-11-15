// Speaking (server voice, browser voice as fallback) and listening (browser speech recognition).
let apiOrigin = '';
let audio = null;

export function configureVoice(options = {}) {
  apiOrigin = (options.apiOrigin ?? '').replace(/\/+$/, '');
}

export function stopSpeaking() {
  if (audio) {
    const current = audio;
    audio = null;
    current.pause();
  }
  window.speechSynthesis?.cancel();
}

function browserSpeak(text, lang) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'am' ? 'am-ET' : 'en-US';
    utterance.onend = utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function speak(text, lang = 'en') {
  stopSpeaking();
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!clean) return Promise.resolve();

  return new Promise((resolve) => {
    const a = new Audio(`${apiOrigin}/api/v1/tts?lang=${lang}&text=${encodeURIComponent(clean)}`);
    audio = a;
    const fallback = () => {
      if (audio !== a) return resolve(); // stopped on purpose
      audio = null;
      browserSpeak(clean, lang).then(resolve);
    };
    a.onended = () => {
      if (audio === a) audio = null;
      resolve();
    };
    a.onerror = fallback;
    a.play().catch(fallback);
  });
}

export function canListen() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function listen(lang = 'en') {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  return new Promise((resolve, reject) => {
    if (!Recognition) return reject(new Error('unsupported'));
    const recognition = new Recognition();
    recognition.lang = lang === 'am' ? 'am-ET' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let heard = false;
    recognition.onresult = (event) => {
      heard = true;
      resolve(event.results[0][0].transcript.trim());
    };
    recognition.onerror = (event) => reject(new Error(event.error));
    recognition.onend = () => {
      if (!heard) resolve('');
    };
    recognition.start();
  });
}
