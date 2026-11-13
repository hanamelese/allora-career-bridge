// File Path: src/components/partner/EmbedTagBox.jsx

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function EmbedTagBox({ formId, version, publicKey }) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<div id="allora-embed-root" data-form-id="${formId}" data-public-key="${publicKey}" data-form-version="${version}"></div>\n<script src="https://cdn.allora.et/embed.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      <h2 className="h5 fw-bold mb-1">Generated Embed Tag</h2>
      <p className="text-muted small mb-3">Paste this snippet directly into your host system website or application.</p>

      <div className="position-relative bg-dark text-white p-3 rounded-4 font-monospace small mb-3 overflow-auto">
        <pre className="mb-0">{embedCode}</pre>
      </div>

      <button className={`btn fw-bold px-4 py-2 ${copied ? 'btn-success' : 'btn-dark'}`} onClick={handleCopy}>
        {copied ? (
          <>
            <Check size={18} className="me-2" /> Copied to Clipboard!
          </>
        ) : (
          <>
            <Copy size={18} className="me-2" /> Copy Embed Snippet
          </>
        )}
      </button>
    </div>
  );
}