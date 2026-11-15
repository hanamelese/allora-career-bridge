import { useEffect, useId, useRef, useState } from 'react';
import { AArrowDown, AArrowUp, CirclePause, Contrast, Languages, SlidersHorizontal } from 'lucide-react';
import { useDisplay } from '../../display/displayContext.js';
import { TEXT_SCALES, effectiveMotion } from '../../display/displaySettings.js';
import { useT } from '../../i18n/index.js';
import './AccessibilityBar.css';

const LANGUAGE_NAMES = [
  { code: 'en', name: 'English' },
  { code: 'am', name: 'አማርኛ' },
];

/**
 * Four display controls for the dashboard: text size, contrast, motion and
 * language. They change the dashboard itself (see displaySettings.js) and
 * are remembered in this browser.
 *
 * On a wide screen they sit in a row of their own in the header, each with
 * a visible label. On a narrow one they fold behind a "Display" button, so
 * the header keeps room for the name, Home and Sign out.
 *
 * Toggles are buttons with `aria-pressed`, so a screen reader says "High
 * contrast, toggle button, pressed". The size steps say the new size
 * through a polite live region.
 */
export function AccessibilityBar({ className = '' }) {
  const { settings, update } = useDisplay();
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const toggleRef = useRef(null);
  const panelId = useId();
  const labelId = useId();

  const scaleIndex = TEXT_SCALES.indexOf(settings.textScale);
  const atSmallest = scaleIndex <= 0;
  const atLargest = scaleIndex >= TEXT_SCALES.length - 1;
  const motionStopped = effectiveMotion(settings) === 'reduce';
  const percent = Math.round(settings.textScale);

  /* The folded panel closes on Escape (focus back to its button) or on a
     click anywhere else. */
  useEffect(() => {
    if (!isOpen) return undefined;

    function onKey(event) {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      toggleRef.current?.focus();
    }

    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    }

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [isOpen]);

  function step(direction) {
    const next = TEXT_SCALES[scaleIndex + direction];
    if (next !== undefined) update({ textScale: next });
  }

  return (
    <div className={`a11y-bar${isOpen ? ' a11y-bar--open' : ''} ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        ref={toggleRef}
        className="a11y-bar__toggle"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <SlidersHorizontal aria-hidden="true" />
        <span>{t('display.toggle')}</span>
        <span className="visually-hidden">: {t('display.toggleHint')}</span>
      </button>

      <div className="a11y-bar__panel" id={panelId} role="group" aria-labelledby={labelId}>
        <span className="a11y-bar__title" id={labelId}>
          {t('display.group')}
        </span>

        <div className="a11y-bar__group" role="group" aria-label={t('display.textSize')}>
          <span className="a11y-bar__caption" aria-hidden="true">
            {t('display.textSize')}
          </span>
          <button
            type="button"
            className="a11y-bar__button a11y-bar__button--icon"
            aria-label={t('display.smaller')}
            title={t('display.smaller')}
            aria-disabled={atSmallest || undefined}
            onClick={() => step(-1)}
          >
            <AArrowDown aria-hidden="true" />
          </button>
          <output className="a11y-bar__value" aria-live="polite" aria-label={t('display.scaleNow', percent)}>
            {percent}%
          </output>
          <button
            type="button"
            className="a11y-bar__button a11y-bar__button--icon"
            aria-label={t('display.larger')}
            title={t('display.larger')}
            aria-disabled={atLargest || undefined}
            onClick={() => step(1)}
          >
            <AArrowUp aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className="a11y-bar__button"
          aria-pressed={settings.contrast === 'high'}
          onClick={() => update({ contrast: settings.contrast === 'high' ? 'standard' : 'high' })}
        >
          <Contrast aria-hidden="true" />
          <span>{t('display.contrast')}</span>
        </button>

        <button
          type="button"
          className="a11y-bar__button"
          aria-pressed={motionStopped}
          onClick={() => update({ motion: motionStopped ? 'full' : 'reduce' })}
        >
          <CirclePause aria-hidden="true" />
          <span>{t('display.motion')}</span>
        </button>

        <div className="a11y-bar__group" role="group" aria-label={t('display.language')}>
          <Languages className="a11y-bar__group-icon" aria-hidden="true" />
          <div className="a11y-bar__segmented">
            {LANGUAGE_NAMES.map(({ code, name }) => (
              <button
                key={code}
                type="button"
                lang={code}
                className="a11y-bar__segment"
                aria-pressed={settings.language === code}
                onClick={() => update({ language: code })}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
