import React, { useState, useEffect } from 'react';
import { playReadAloud, stopAudio } from './ReadAloud';

export default function ReadAloudButton({
  text = '',
  audioKey = '',
  lang = 'en-US',
  label = 'Read aloud'
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => stopAudio();
  }, [text]);

  const handleClick = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
      return;
    }

    if (!text) return;

    setIsPlaying(true);
    playReadAloud({
      text,
      audioKey,
      lang,
      onEnd: () => setIsPlaying(false)
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isPlaying ? 'Stop reading aloud' : `Read aloud: ${text}`}
      style={{
        minHeight: 'var(--target-min-size, 48px)',
        minWidth: 'var(--target-min-size, 48px)',
        padding: '8px 16px',
        backgroundColor: isPlaying ? 'var(--color-primary-dark, #001A35)' : '#FFFFFF',
        color: isPlaying ? '#FFFFFF' : 'var(--color-primary, #002B56)',
        border: '2px solid var(--color-primary, #002B56)',
        borderRadius: 'var(--radius-sm, 4px)',
        fontWeight: 600,
        fontSize: '15px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer'
      }}
    >
      <span aria-hidden="true">{isPlaying ? '⏹️' : '🔊'}</span>
      <span>{isPlaying ? 'Stop' : label}</span>
    </button>
  );
}
