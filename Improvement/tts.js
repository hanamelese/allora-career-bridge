// Text-to-speech route: Edge voices first, Google TTS as the fallback.
// Mount it with:  app.use('/api/v1/tts', ttsRouter);
import { Router } from 'express';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import googleTTS from 'google-tts-api';

const VOICES = { en: 'en-US-AriaNeural', am: 'am-ET-MekdesNeural' };
const MAX_CHARS = 500;
const MAX_CACHE = 200;
const MAX_PER_MINUTE = 60;

const cache = new Map(); // "lang|text" -> Buffer
const hits = new Map(); // ip -> [timestamps]

function tooMany(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_MINUTE;
}

async function withEdge(text, lang) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICES[lang] ?? VOICES.en, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const chunks = [];
  for await (const chunk of audioStream) chunks.push(chunk);
  const audio = Buffer.concat(chunks);
  if (!audio.length) throw new Error('empty audio');
  return audio;
}

async function withGoogle(text, lang) {
  const parts = await googleTTS.getAllAudioBase64(text, {
    lang: lang === 'am' ? 'am' : 'en',
    slow: false,
    timeout: 10_000,
  });
  return Buffer.concat(parts.map((part) => Buffer.from(part.base64, 'base64')));
}

const router = Router();

router.get('/', async (req, res) => {
  const lang = req.query.lang === 'am' ? 'am' : 'en';
  const text = String(req.query.text ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
  if (!text) return res.status(400).json({ error: 'text_required' });
  if (tooMany(req.ip)) return res.status(429).json({ error: 'too_many_requests' });

  const key = `${lang}|${text}`;
  let audio = cache.get(key);

  if (!audio) {
    try {
      audio = await withEdge(text, lang);
    } catch (edgeError) {
      try {
        audio = await withGoogle(text, lang);
      } catch (googleError) {
        console.warn('tts failed', edgeError.message, googleError.message);
        return res.status(502).json({ error: 'tts_unavailable' });
      }
    }
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(key, audio);
  }

  res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' });
  res.send(audio);
});

export default router;
