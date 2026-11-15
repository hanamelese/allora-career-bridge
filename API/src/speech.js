import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import googleTTS from 'google-tts-api';

/**
 * Speech for the forms' read-aloud: turns a form's own text into MP3.
 *
 * Most computers have no Amharic voice in the browser, so the form asks
 * this service first and uses the browser's voice only if it fails.
 *
 *   1. Microsoft Edge's neural voices (msedge-tts), including Amharic
 *      (am-ET-MekdesNeural);
 *   2. Google Translate's voice (google-tts-api) if Edge fails.
 *
 * Both libraries call free, unofficial endpoints. They need no key, but
 * they are undocumented and can stop working or change without notice;
 * the form then falls back to the browser's voice.
 *
 * The form sends its own text here (questions, options, help, errors and
 * messages), which is cached, and - for "Read my answer" and reading back
 * what was heard - a learner's answer, marked private: that is passed to
 * the voice provider to be spoken and then forgotten, never cached or
 * logged here. A password is never sent.
 */

export const SPEECH_VOICES = { en: 'en-US-AriaNeural', am: 'am-ET-MekdesNeural' };
export const MAX_SPEECH_CHARS = 500;
const MAX_CACHE = 200;

/* The Edge service reads SSML, so markup characters in the text must be
   escaped or the request fails. */
function escapeSsml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function withEdge(text, language) {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(SPEECH_VOICES[language], OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(escapeSsml(text));
    const chunks = [];
    for await (const chunk of audioStream) chunks.push(chunk);
    const audio = Buffer.concat(chunks);
    if (!audio.length) throw new Error('empty audio');
    return audio;
  } finally {
    try {
      tts.close();
    } catch {
      /* Already closed. */
    }
  }
}

async function withGoogle(text, language) {
  const parts = await googleTTS.getAllAudioBase64(text, { lang: language, slow: false, timeout: 10_000 });
  const audio = Buffer.concat(parts.map((part) => Buffer.from(part.base64, 'base64')));
  if (!audio.length) throw new Error('empty audio');
  return audio;
}

/** Tidies text for speaking: one line, trimmed, at most MAX_SPEECH_CHARS. */
export function cleanSpeechText(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SPEECH_CHARS);
}

/**
 * A speech service: `speak(text, language)` resolves to MP3 bytes, or
 * rejects when no provider could make them. Results are cached in memory
 * (the same questions are read again and again).
 */
export function createSpeech({ providers = [withEdge, withGoogle], log = console } = {}) {
  const cache = new Map();

  /* `cache: false` is for a learner's own answer: it is turned into audio
     and forgotten - never kept here, and never logged. */
  return async function speak(text, language, { cache: useCache = true } = {}) {
    const lang = language === 'am' ? 'am' : 'en';
    const clean = cleanSpeechText(text);
    const key = `${lang}|${clean}`;

    const cached = useCache ? cache.get(key) : null;
    if (cached) return cached;

    const failures = [];
    for (const provider of providers) {
      try {
        const audio = await provider(clean, lang);
        if (useCache) {
          if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
          cache.set(key, audio);
        }
        return audio;
      } catch (error) {
        failures.push(error.message);
      }
    }

    log.warn?.(`[api] speech unavailable: ${failures.join(' / ')}`);
    throw new Error('speech_unavailable');
  };
}
