import React from 'react';
import { ZoomIn, ZoomOut, Type, Sparkles, Sun, Moon } from 'lucide-react';

export function TopBar({
  zoomLevel,
  setZoomLevel,
  wideSpacing,
  setWideSpacing,
  simpleLanguage,
  setSimpleLanguage,
  speechLang,
  setSpeechLang,
  darkMode,
  setDarkMode,
  speak,
  t, // Translation helper prop passed from ProfilePage
}) {
  // Dynamic button style based on dark mode
  const dynamicBtnStyle = {
    background: darkMode ? '#12544f' : '#ffffff',
    color: darkMode ? '#f8fafc' : '#0f172a',
    borderColor: darkMode ? '#2a835f' : '#cbd5e1',
  };

  return (
    <header
      className="topbar sticky-top shadow-sm px-4 transition-all"
      style={{
        background: darkMode ? '#092328' : '#ffffff',
        borderBottom: `2px solid ${darkMode ? '#12544f' : '#cbd5e1'}`,
        zIndex: 1030,
      }}
    >
      <div className="container-fluid py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="brand-mark shadow-sm"
            style={{
              width: '52px',
              height: '52px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: '14px',
              color: '#ffffff',
              background: darkMode ? '#2a835f' : '#12544f',
            }}
          >
            <span className="fw-bold fs-3">A</span>
          </div>
          <div>
            <span className="fw-bold fs-3 lh-1" style={{ color: darkMode ? '#8bbb92' : '#12544f' }}>
              Allora
            </span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2" role="group" aria-label="Accessibility display settings">
          
          {/* Zoom controls */}
          <div className="btn-group shadow-sm" role="group" aria-label="Text size">
            <button
              type="button"
              className="btn fw-bold fs-5 px-3"
              style={dynamicBtnStyle}
              onClick={() => {
                const next = Math.max(100, zoomLevel - 15);
                setZoomLevel(next);
                speak(`Text size ${next} percent`);
              }}
              disabled={zoomLevel <= 100}
              aria-label="Decrease text size"
            >
              <ZoomOut size={20} />
            </button>
            <span
              className="btn disabled fw-bold px-3 fs-5 d-flex align-items-center"
              style={dynamicBtnStyle}
              aria-live="polite"
            >
              {zoomLevel}%
            </span>
            <button
              type="button"
              className="btn fw-bold fs-5 px-3"
              style={dynamicBtnStyle}
              onClick={() => {
                const next = Math.min(175, zoomLevel + 15);
                setZoomLevel(next);
                speak(`Text size ${next} percent`);
              }}
              disabled={zoomLevel >= 175}
              aria-label="Increase text size"
            >
              <ZoomIn size={20} />
            </button>
          </div>

          {/* Spacing Button */}
          <button
            type="button"
            className="btn fw-bold fs-5 px-3 shadow-sm"
            style={wideSpacing ? { background: '#2a835f', color: '#ffffff', borderColor: '#2a835f' } : dynamicBtnStyle}
            onClick={() => {
              setWideSpacing((v) => !v);
              speak(!wideSpacing ? 'Wide letter spacing turned on' : 'Wide letter spacing turned off');
            }}
            aria-pressed={wideSpacing}
          >
            <Type size={19} className="me-1" /> {t ? t('spacing') : 'Spacing'}
          </button>

          {/* Simple Language Button */}
          <button
            type="button"
            className="btn fw-bold fs-5 px-3 shadow-sm"
            style={simpleLanguage ? { background: '#2a835f', color: '#ffffff', borderColor: '#2a835f' } : dynamicBtnStyle}
            onClick={() => {
              setSimpleLanguage((v) => !v);
              speak(!simpleLanguage ? 'Simple words turned on' : 'Standard words turned on');
            }}
            aria-pressed={simpleLanguage}
          >
            <Sparkles size={19} className="me-1" /> {simpleLanguage ? (t ? t('simpleOn') : 'Simple: ON') : (t ? t('simpleWords') : 'Simple words')}
          </button>

          {/* Speech Language Dropdown */}
          <select
            id="speech-lang"
            className="form-select form-select-lg fw-bold shadow-sm"
            style={{
              width: 'auto',
              minHeight: 52,
              borderRadius: 14,
              background: darkMode ? '#12544f' : '#ffffff',
              color: darkMode ? '#f8fafc' : '#0f172a',
              borderColor: darkMode ? '#2a835f' : '#cbd5e1',
            }}
            value={speechLang}
            onChange={(e) => setSpeechLang(e.target.value)}
            aria-label="Voice typing language"
          >
            <option value="en-GB">English (UK)</option>
            <option value="en-US">English (US)</option>
            <option value="en-KE">English (Kenya)</option>
            <option value="am-ET">አማርኛ (Amharic)</option>
          </select>

          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            className="btn fw-bold fs-5 px-4 d-flex align-items-center gap-2 shadow-sm transition-all"
            style={{
              background: darkMode ? '#f59e0b' : '#0f172a',
              color: darkMode ? '#0f172a' : '#ffffff',
              borderColor: darkMode ? '#f59e0b' : '#0f172a',
            }}
            onClick={() => {
              setDarkMode((v) => !v);
              speak(!darkMode ? 'Dark mode enabled' : 'Light mode enabled');
            }}
            aria-pressed={darkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{darkMode ? (t ? t('lightMode') : 'Light Mode') : (t ? t('darkMode') : 'Dark Mode')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}