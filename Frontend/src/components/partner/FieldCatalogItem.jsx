// File Path: src/components/partner/FieldCatalogItem.jsx

import React from 'react';
import { Trash2, Settings2 } from 'lucide-react';

export function FieldCatalogItem({ field, index, onUpdateField, onDeleteField }) {
  const handleTypeChange = (newType) => {
    onUpdateField(index, { ...field, type: newType });
  };

  const handleLabelChange = (lang, text) => {
    onUpdateField(index, {
      ...field,
      label: { ...field.label, [lang]: text }
    });
  };

  const handleToggleRequired = () => {
    onUpdateField(index, { ...field, required: !field.required });
  };

  const handleToggleEnabled = () => {
    onUpdateField(index, { ...field, enabled: !field.enabled });
  };

  return (
    <div className={`p-3 rounded-4 border mb-3 ${field.enabled ? 'bg-white shadow-sm' : 'bg-light text-muted opacity-75'}`}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-secondary font-monospace">#{index + 1}</span>
          <span className="fw-bold font-monospace text-dark">{field.key}</span>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id={`enable-${index}`}
              checked={field.enabled}
              onChange={handleToggleEnabled}
            />
            <label className="form-check-label small fw-bold" htmlFor={`enable-${index}`}>
              Enabled
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id={`req-${index}`}
              checked={field.required}
              onChange={handleToggleRequired}
            />
            <label className="form-check-label small fw-bold" htmlFor={`req-${index}`}>
              Required
            </label>
          </div>

          <button
  type="button"
  className="btn btn-link text-danger p-1 d-flex align-items-center justify-content-center text-decoration-none"
  onClick={() => onDeleteField(index)}
  title="Delete field"
  style={{ transition: 'opacity 0.2s' }}
>
  <Trash2 size={18} />
</button>
        </div>
      </div>

      {field.enabled && (
        <div className="row g-3 pt-2 border-top">
          <div className="col-md-4">
            <label className="form-label small text-muted fw-bold">Input Type</label>
            <select
              className="form-select form-select-sm"
              value={field.type || 'text'}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="text">Text Input</option>
              <option value="textarea">Paragraph (Textarea)</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
              <option value="tel">Phone Number</option>
              <option value="date">Date</option>
              <option value="select">Dropdown Choice</option>
              <option value="radio">Radio Options</option>
              <option value="yes_no">Yes / No Toggle</option>
              <option value="file">File Upload</option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label small text-muted fw-bold">English Label (en)</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={field.label?.en || ''}
              onChange={(e) => handleLabelChange('en', e.target.value)}
              placeholder="English label..."
            />
          </div>

          <div className="col-md-4">
            <label className="form-label small text-muted fw-bold">Amharic Label (am)</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={field.label?.am || ''}
              onChange={(e) => handleLabelChange('am', e.target.value)}
              placeholder="የአማርኛ መግለጫ..."
            />
          </div>
        </div>
      )}
    </div>
  );
}