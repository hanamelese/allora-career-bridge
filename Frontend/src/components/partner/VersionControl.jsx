// File Path: src/components/partner/VersionControl.jsx

import React from 'react';
import { Save, UploadCloud } from 'lucide-react';

export function VersionControl({ version, onPublish }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <span className="badge bg-info text-dark px-3 py-2 fw-bold">
        Active Version: v{version}
      </span>
      <button className="btn btn-outline-dark btn-sm fw-bold px-3" onClick={() => alert('Draft saved successfully!')}>
        <Save size={16} className="me-1" /> Save Draft
      </button>
      <button className="btn btn-dark btn-sm fw-bold px-3" onClick={onPublish}>
        <UploadCloud size={16} className="me-1" /> Publish v{version + 1}
      </button>
    </div>
  );
}