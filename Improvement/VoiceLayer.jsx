import { useCallback, useRef, useState } from 'react';
import { canListen, listen, speak, stopSpeaking } from './voiceCore.js';

const TEXT = {
  en: {
    read: 'Read aloud', speak: 'Speak', stop: 'Stop', help: 'Voice help',
    listening: 'Listening…', heard: 'You said', notHeard: 'I did not hear anything. Please try again.',
    unsupported: 'Voice input is not supported in this browser.', noMatch: 'I could not find that.',
    cleared: 'Cleared.', commands: 'You can say: next, back, read, repeat, send, clear, stop, or choose followed by an option. Or just say your answer.',
    button: 'button', option: 'option', checkbox: 'check box', list: 'drop-down list', box: 'text box',
    selected: 'selected', notSelected: 'not selected', then: 'Say next to continue, or clear to try again.',
  },
  am: {
    read: 'አንብብልኝ', speak: 'ተናገር', stop: 'አቁም', help: 'የድምፅ እገዛ',
    listening: 'እየሰማሁ ነው…', heard: 'ያልከው', notHeard: 'ምንም አልሰማሁም። እባክዎ እንደገና ይሞክሩ።',
    unsupported: 'ይህ ብራውዘር የድምፅ ግብዓትን አይደግፍም።', noMatch: 'ያንን ማግኘት አልቻልኩም።',
    cleared: 'ጸድቷል።', commands: 'ቀጣይ፣ ተመለስ፣ አንብብ፣ ድገም፣ ላክ፣ አጽዳ፣ አቁም ወይም ምረጥ ማለት ይችላሉ። ወይም መልስዎን ብቻ ይናገሩ።',
    button: 'አዝራር', option: 'አማራጭ', checkbox: 'ምልክት ማድረጊያ', list: 'ዝርዝር', box: 'የጽሑፍ ሳጥን',
    selected: 'ተመርጧል', notSelected: 'አልተመረጠም', then: 'ለመቀጠል ቀጣይ ይበሉ፣ ወይም እንደገና ለመሞከር አጽዳ ይበሉ።',
  },
};

// Spoken commands. Check the Amharic words with a native speaker before you rely on them.
const COMMANDS = [
  ['next', /^(next|continue|go on|ቀጣይ|ቀጥል)$/],
  ['back', /^(back|previous|go back|ተመለስ|ወደ ኋላ)$/],
  ['read', /^(read|read this|read aloud|read the question|አንብብ)$/],
  ['repeat', /^(repeat|say again|ድገም)$/],
  ['send', /^(send|submit|send my answers|ላክ)$/],
  ['clear', /^(clear|erase|start again|አጽዳ)$/],
  ['stop', /^(stop|be quiet|silence|አቁም)$/],
  ['help', /^(help|what can i say|እገዛ)$/],
];
const BUTTON_WORDS = {
  next: /^(next|continue|ቀጣይ|ቀጥል)/i,
  back: /^(back|previous|ተመለስ|ወደ ኋላ)/i,
  send: /(send|submit|ላክ)/i,
};

const visible = (el) => el.getClientRects().length > 0;
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

function labelOf(el) {
  const root = el.getRootNode();
  const byId = (el.getAttribute('aria-labelledby') ?? '')
    .split(/\s+/)
    .map((id) => root.getElementById?.(id)?.textContent)
    .filter(Boolean)
    .join(' ');
  return clean(el.getAttribute('aria-label') || byId || el.labels?.[0]?.textContent || el.placeholder || el.textContent || el.name);
}

function questionOf(el) {
  const group = el.closest('fieldset,[role=radiogroup],[role=group]');
  return clean(group?.querySelector('legend,[data-question]')?.textContent);
}

function setNativeValue(el, value) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

const isTextField = (el) =>
  el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['radio', 'checkbox', 'file', 'button', 'submit'].includes(el.type)));

/**
 * Wrap a form with <VoiceLayer lang="en"> ... </VoiceLayer>.
 * It reads every field, option and button aloud when focused, reads the screen aloud,
 * listens for commands (next, back, send, choose …) and fills the focused field from speech.
 */
export function VoiceLayer({ lang = 'en', children }) {
  const t = TEXT[lang] ?? TEXT.en;
  const box = useRef(null);
  const lastSpoken = useRef('');
  const reading = useRef(0);
  const [helpOn, setHelpOn] = useState(true);
  const [status, setStatus] = useState('');

  const say = useCallback((text) => {
    lastSpoken.current = text;
    return speak(text, lang);
  }, [lang]);

  const sayLong = useCallback(async (text) => {
    const token = ++reading.current;
    const parts = clean(text).match(/[^.!?።]+[.!?።]?/g) ?? [];
    let chunk = '';
    const chunks = [];
    for (const part of parts) {
      if ((chunk + part).length > 400) { chunks.push(chunk); chunk = ''; }
      chunk += part;
    }
    if (chunk) chunks.push(chunk);
    lastSpoken.current = text;
    for (const piece of chunks) {
      if (token !== reading.current) return;
      await speak(piece, lang);
    }
  }, [lang]);

  const stopAll = useCallback(() => {
    reading.current += 1;
    stopSpeaking();
    setStatus('');
  }, []);

  const describe = useCallback((el) => {
    const label = labelOf(el);
    const question = questionOf(el);
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') return `${label}, ${t.button}`;
    if (el.type === 'radio' || el.type === 'checkbox') {
      const kind = el.type === 'radio' ? t.option : t.checkbox;
      return `${question ? question + '. ' : ''}${label}, ${kind}, ${el.checked ? t.selected : t.notSelected}`;
    }
    const kind = el.tagName === 'SELECT' ? t.list : t.box;
    return `${question ? question + '. ' : ''}${label}, ${kind}`;
  }, [t]);

  const onFocus = (event) => {
    const el = event.target;
    if (!helpOn || el.closest('[data-voice-toolbar]')) return;
    if (!el.matches('input,select,textarea,button,[role=button]')) return;
    stopAll();
    say(describe(el));
  };

  const findButton = (kind) => {
    const all = [...box.current.querySelectorAll('button,[role=button]')]
      .filter((b) => visible(b) && !b.disabled && !b.closest('[data-voice-toolbar]'));
    return all.find((b) => b.dataset.voice === kind) ?? all.find((b) => BUTTON_WORDS[kind].test(labelOf(b)));
  };

  const choose = (wanted) => {
    const target = clean(wanted).toLowerCase();
    const items = [...box.current.querySelectorAll('input[type=radio],input[type=checkbox],option,[role=option],[role=radio]')];
    const hit = items.find((el) => labelOf(el).toLowerCase().includes(target));
    if (!hit) return say(t.noMatch);
    if (hit.tagName === 'OPTION') {
      const select = hit.closest('select');
      select.value = hit.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      hit.click();
    }
    return say(`${labelOf(hit)}, ${t.selected}`);
  };

  const readScreen = () => sayLong(box.current.innerText);

  const run = async (spoken) => {
    const text = clean(spoken).toLowerCase().replace(/[.!?።]+$/, '');
    const root = box.current.getRootNode();
    const active = root.activeElement;
    const found = COMMANDS.find(([, pattern]) => pattern.test(text));
    const command = found?.[0];

    if (command === 'next' || command === 'back' || command === 'send') {
      const button = findButton(command);
      return button ? button.click() : say(t.noMatch);
    }
    if (command === 'read') return readScreen();
    if (command === 'repeat') return say(lastSpoken.current);
    if (command === 'stop') return stopAll();
    if (command === 'help') return say(t.commands);
    if (command === 'clear') {
      if (isTextField(active)) setNativeValue(active, '');
      return say(t.cleared);
    }

    const pick = text.match(/^(choose|select|pick|ምረጥ)\s+(.+)$/);
    if (pick) return choose(pick[2]);

    if (isTextField(active)) {
      setNativeValue(active, clean(spoken));
      return say(`${t.heard}: ${clean(spoken)}. ${t.then}`);
    }
    return say(t.noMatch);
  };

  const hear = async () => {
    if (!canListen()) return say(t.unsupported);
    stopAll();
    setStatus(t.listening);
    try {
      const spoken = await listen(lang);
      setStatus('');
      return spoken ? run(spoken) : say(t.notHeard);
    } catch {
      setStatus('');
      return say(t.notHeard);
    }
  };

  const onKeyDown = (event) => {
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      hear();
    }
  };

  const bar = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '8px 0' };
  const btn = { padding: '8px 14px', border: '2px solid #002b56', borderRadius: 8, background: '#fff', color: '#002b56', font: 'inherit', cursor: 'pointer' };

  return (
    <div ref={box} onFocus={onFocus} onKeyDown={onKeyDown}>
      <div data-voice-toolbar role="toolbar" aria-label="Voice tools" style={bar}>
        <button type="button" style={btn} onClick={readScreen}>{t.read}</button>
        <button type="button" style={btn} onClick={hear}>{t.speak}</button>
        <button type="button" style={btn} onClick={stopAll}>{t.stop}</button>
        <button type="button" style={btn} aria-pressed={helpOn} onClick={() => setHelpOn(!helpOn)}>
          {t.help}: {helpOn ? 'on' : 'off'}
        </button>
        <span role="status" aria-live="polite">{status}</span>
      </div>
      {children}
    </div>
  );
}
