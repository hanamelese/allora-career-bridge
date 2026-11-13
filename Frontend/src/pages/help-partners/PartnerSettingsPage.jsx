// File Path: src/pages/partner/PartnerSettingsPage.jsx

import React, { useState } from 'react';
import { Shield, Key } from 'lucide-react';

export function PartnerSettingsPage() {
  const [origins, setOrigins] = useState('https://habesha-trails.web.app\nhttps://alx-hub.et');

  return (
    <div>
      <h1 className="h3 fw-bold mb-1">Partner API & Security Settings</h1>
      <p className="text-secondary mb-4">Manage allowed embed domains, API keys, and event webhooks.</p>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h2 className="h5 fw-bold d-flex align-items-center gap-2 mb-3">
              <Shield size={20} className="text-success" /> Allowed Origins (CORS)
            </h2>
            <p className="text-muted small">List authorized URLs where your forms are permitted to be embedded.</p>
            <textarea
              className="form-control mb-3"
              rows={4}
              value={origins}
              onChange={(e) => setOrigins(e.target.value)}
            />
            <button className="btn btn-dark fw-bold w-100">Save Allowed Origins</button>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h2 className="h5 fw-bold d-flex align-items-center gap-2 mb-3">
              <Key size={20} className="text-warning" /> API Keys
            </h2>
            <div className="mb-3">
              <label className="form-label small fw-bold">Public Key</label>
              <input type="text" className="form-control bg-light" readOnly value="pk_live_9981274819203" />
            </div>
            <div>
              <label className="form-label small fw-bold">Secret Key</label>
              <input type="password" className="form-control bg-light" readOnly value="sk_live_secret_masked_••••••••••••" />
              <div className="form-text small text-muted">Secret keys are only displayed once upon creation.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}