import { useEffect, useId, useRef, useState } from 'react';
import { CONTRAST_LEVELS, TEXT_SIZES } from './learnerPreferences.js';

/* Every level meets WCAG 2.2 AA; levels 2-4 meet AAA for text. The ratios
   are the lowest of each level's text colours on its backgrounds - see
   `contrastLevels.test.js`, which checks them. */
const COPY = {
  en: {
    open: 'Settings',
    openDetail: ': contrast, text size, language and simple words',
    title: 'Display settings',
    intro: 'Change how this form looks. Your choices are kept for next time on this device.',
    contrast: 'Contrast',
    contrastHelp: 'Slide right for stronger contrast.',
    contrastKeys: 'With a keyboard, use the left and right arrow keys, or Home and End.',
    contrastLevels: {
      1: 'Standard. Meets WCAG AA (text at least 4.5 to 1).',
      2: 'Enhanced. Meets WCAG AAA (text at least 7 to 1).',
      3: 'Dark. Light text on a dark background, WCAG AAA.',
      4: 'Maximum. Yellow on black, the strongest contrast.',
    },
    contrastShort: { 1: 'Standard', 2: 'Enhanced', 3: 'Dark', 4: 'Maximum' },
    textSize: 'Text size',
    sizes: { small: 'Smaller text', normal: 'Normal text', large: 'Larger text' },
    language: 'Language',
    simpleWords: 'Simple words',
    simpleWordsHelp: 'Shorter, everyday words for each question. Each question is also read out when you move to it.',
    done: 'Done',
    changed: {
      contrast: (label) => `Contrast: ${label}`,
      textSize: (label) => `Text size: ${label}`,
      language: (label) => `Language: ${label}`,
      simpleWords: (on) => `Simple words ${on ? 'on' : 'off'}`,
    },
  },
  am: {
    open: 'ቅንብሮች',
    openDetail: '፦ ንፅፅር፣ የፊደል መጠን፣ ቋንቋ እና ቀላል ቃላት',
    title: 'የማሳያ ቅንብሮች',
    intro: 'ይህ ቅጽ የሚታይበትን መንገድ ይቀይሩ። ምርጫዎችዎ በዚህ መሣሪያ ላይ ለሚቀጥለው ጊዜ ይቀመጣሉ።',
    contrast: 'ንፅፅር',
    contrastHelp: 'ለጠንካራ ንፅፅር ወደ ቀኝ ያንሸራትቱ።',
    contrastKeys: 'በቁልፍ ሰሌዳ፣ የግራ እና የቀኝ ቀስት ቁልፎችን ወይም Home እና End ይጠቀሙ።',
    contrastLevels: {
      1: 'መደበኛ። የWCAG AA ደረጃን ያሟላል።',
      2: 'የተሻሻለ። የWCAG AAA ደረጃን ያሟላል።',
      3: 'ጨለማ። በጨለማ ዳራ ላይ ብሩህ ጽሑፍ፣ WCAG AAA።',
      4: 'ከፍተኛ። በጥቁር ላይ ቢጫ፣ በጣም ጠንካራው ንፅፅር።',
    },
    contrastShort: { 1: 'መደበኛ', 2: 'የተሻሻለ', 3: 'ጨለማ', 4: 'ከፍተኛ' },
    textSize: 'የፊደል መጠን',
    sizes: { small: 'ትንሽ ፊደል', normal: 'መደበኛ ፊደል', large: 'ትልቅ ፊደል' },
    language: 'ቋንቋ',
    simpleWords: 'ቀላል ቃላት',
    simpleWordsHelp: 'ለእያንዳንዱ ጥያቄ አጭርና የዕለት ተዕለት ቃላት። ወደ ጥያቄው ሲሄዱም ይነበባል።',
    done: 'ጨርሻለሁ',
    changed: {
      contrast: (label) => `ንፅፅር፦ ${label}`,
      textSize: (label) => `የፊደል መጠን፦ ${label}`,
      language: (label) => `ቋንቋ፦ ${label}`,
      simpleWords: (on) => `ቀላል ቃላት ${on ? 'በርቷል' : 'ጠፍቷል'}`,
    },
  },
};

const LANGUAGE_NAMES = { en: 'English', am: 'አማርኛ' };
const SIZE_GLYPHS = { small: 'A-', normal: 'A', large: 'A+' };

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/**
 * The learner's display settings.
 *
 * A gear button opens a small panel above the form. While it is open the
 * rest of the form is blurred and made `inert`, so neither the eye nor a
 * keyboard or screen reader wanders into it; Escape or Done closes the
 * panel and puts focus back on the gear.
 *
 * Every control is a native one - a range, buttons with aria-pressed,
 * radios, a switch - so NVDA and other screen readers announce each with
 * its role, name and state.
 */
export function FormSettings({
  open,
  onOpenChange,
  preferences,
  onChange,
  language,
  languages = ['en'],
  onLanguageChange,
  /* Another control for the top bar, before the gear (Voice control). */
  barStart = null,
}) {
  const copy = COPY[language] ?? COPY.en;
  const id = useId();
  const panelId = `${id}-panel`;
  const titleId = `${id}-title`;
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const contrastRef = useRef(null);
  const wasOpenRef = useRef(open);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    /* Straight to the first setting - the contrast slider - so a
       keyboard user can change it at once. The panel is a labelled
       region, so a screen reader still announces "Display settings" on
       the way in. */
    if (open && !wasOpenRef.current) {
      (contrastRef.current ?? panelRef.current)?.focus();
    }

    if (!open && wasOpenRef.current) {
      buttonRef.current?.focus();
    }

    wasOpenRef.current = open;
  }, [open]);

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      /* Closes only this panel - not a dialog the form may sit in. */
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
    }
  }

  function set(changes, message) {
    onChange(changes);
    setAnnouncement(message);
  }

  return (
    <div className="fe-settings">
      <div className="fe-settings__bar">
        {barStart}
        <button
          type="button"
          ref={buttonRef}
          className={`fe-settings__toggle${open ? ' fe-settings__toggle--open' : ''}`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onOpenChange(!open)}
        >
          <GearIcon />
          <span>{copy.open}</span>
          <span className="fe-visually-hidden">{copy.openDetail}</span>
        </button>
      </div>

      <section
        id={panelId}
        ref={panelRef}
        className="fe-settings__panel"
        aria-labelledby={titleId}
        hidden={!open}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h2 className="fe-settings__title" id={titleId}>
          {copy.title}
        </h2>
        <p className="fe-settings__intro">{copy.intro}</p>

        {/* ---- Contrast: a numbered slider ---- */}
        <div className="fe-settings__group">
          <label className="fe-settings__label" htmlFor={`${id}-contrast`}>
            {copy.contrast}
          </label>
          <input
            type="range"
            id={`${id}-contrast`}
            ref={contrastRef}
            className="fe-settings__range"
            min={CONTRAST_LEVELS[0]}
            max={CONTRAST_LEVELS[CONTRAST_LEVELS.length - 1]}
            step={1}
            value={preferences.contrast}
            list={`${id}-contrast-ticks`}
            aria-valuetext={`${preferences.contrast}: ${copy.contrastLevels[preferences.contrast]}`}
            aria-describedby={`${id}-contrast-help ${id}-contrast-keys ${id}-contrast-now`}
            style={{ '--fe-range-value': preferences.contrast }}
            onChange={(event) => {
              const level = Number(event.target.value);
              set({ contrast: level }, copy.changed.contrast(copy.contrastShort[level]));
            }}
          />
          <datalist id={`${id}-contrast-ticks`}>
            {CONTRAST_LEVELS.map((level) => (
              <option key={level} value={level} label={String(level)} />
            ))}
          </datalist>
          <ol className="fe-settings__ticks" aria-hidden="true">
            {CONTRAST_LEVELS.map((level) => (
              <li
                key={level}
                className={level === preferences.contrast ? 'fe-settings__tick--current' : undefined}
              >
                <span className="fe-settings__tick-number">{level}</span>
                <span className="fe-settings__tick-name">{copy.contrastShort[level]}</span>
              </li>
            ))}
          </ol>
          <p className="fe-settings__help" id={`${id}-contrast-help`}>
            {copy.contrastHelp}
          </p>
          <p className="fe-settings__help" id={`${id}-contrast-keys`}>
            {copy.contrastKeys}
          </p>
          <p className="fe-settings__now" id={`${id}-contrast-now`}>
            {copy.contrastLevels[preferences.contrast]}
          </p>
        </div>

        {/* ---- Text size ---- */}
        <div className="fe-settings__group" role="group" aria-labelledby={`${id}-size`}>
          <p className="fe-settings__label" id={`${id}-size`}>
            {copy.textSize}
          </p>
          <div className="fe-settings__segmented">
            {TEXT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                className={`fe-settings__size fe-settings__size--${size}`}
                aria-pressed={preferences.textSize === size}
                aria-label={copy.sizes[size]}
                onClick={() => set({ textSize: size }, copy.changed.textSize(copy.sizes[size]))}
              >
                <span aria-hidden="true">{SIZE_GLYPHS[size]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ---- Language ---- */}
        {languages.length > 1 ? (
          <fieldset className="fe-settings__group fe-settings__fieldset">
            <legend className="fe-settings__label">{copy.language}</legend>
            <div className="fe-settings__segmented">
              {languages.map((code) => (
                <label key={code} className="fe-settings__choice" lang={code}>
                  <input
                    type="radio"
                    name={`${id}-language`}
                    value={code}
                    checked={language === code}
                    onChange={() => {
                      onLanguageChange(code);
                      setAnnouncement((COPY[code] ?? COPY.en).changed.language(LANGUAGE_NAMES[code]));
                    }}
                  />
                  <span>{LANGUAGE_NAMES[code] ?? code}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {/* ---- Simple words ---- */}
        <div className="fe-settings__group fe-settings__switch-row">
          <div>
            <p className="fe-settings__label" id={`${id}-simple`}>
              {copy.simpleWords}
            </p>
            <p className="fe-settings__help" id={`${id}-simple-help`}>
              {copy.simpleWordsHelp}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            className="fe-settings__switch"
            aria-checked={preferences.lowLiteracy}
            aria-labelledby={`${id}-simple`}
            aria-describedby={`${id}-simple-help`}
            onClick={() =>
              set(
                { lowLiteracy: !preferences.lowLiteracy },
                copy.changed.simpleWords(!preferences.lowLiteracy),
              )
            }
          >
            <span className="fe-settings__switch-thumb" aria-hidden="true" />
          </button>
        </div>

        <div className="fe-settings__footer">
          <button type="button" className="fe-button fe-button--primary" onClick={() => onOpenChange(false)}>
            {copy.done}
          </button>
        </div>
      </section>

      <p className="fe-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
