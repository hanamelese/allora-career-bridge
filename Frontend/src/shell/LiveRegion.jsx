import React from 'react';

/**
 * LiveRegion: Screen-reader announcer for step changes and status updates.
 */
export default function LiveRegion({ message, mode = 'polite' }) {
  return (
    <div
      role={mode === 'assertive' ? 'alert' : 'status'}
      aria-live={mode}
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      }}
    >
      {message}
    </div>
  );
}
