// File Path: src/components/partner/CustomFieldEditor.jsx

import React, { useState } from 'react';
import { PlusCircle, Sparkles } from 'lucide-react';

export function CustomFieldEditor({ onAddCustomField }) {
  const [labelEn, setLabelEn] = useState('');
  const [labelAm, setLabelAm] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [optionsStr, setOptionsStr] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!labelEn.trim()) return;

    const keySlug = labelEn.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);

    const newField = {
      key: keySlug,
      enabled: true,
      required: false,
      type: fieldType,
      label: {
        en: labelEn,
        am: labelAm || labelEn
      },
      ...(fieldType === 'select' || fieldType === 'radio'
        ? { options: optionsStr.split(',').map((o) => o.trim()).filter(Boolean) }
        : {})
    };

    onAddCustomField(newField);
    setLabelEn('');
    setLabelAm('');
    setFieldType('text');
    setOptionsStr('');
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-gradient position-relative overflow-hidden" style={{ background: '#ffffff', borderLeft: '4px solid #12544f' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="h6 fw-bold mb-0 d-flex align-items-center gap-2 text-dark">
          <div className="p-2 rounded-3 text-white d-flex align-items-center justify-content-center shadow-sm" style={{ background: '#12544f' }}>
            <PlusCircle size={18} />
          </div>
          <span>Add Custom Field</span>
        </h2>
        {/* <span className="badge bg-light text-muted border px-2 py-1 small fw-semibold d-flex align-items-center gap-1">
          <Sparkles size={12} className="text-warning" /> Schema Builder
        </span> */}
      </div>

      <form onSubmit={handleCreate} className="d-grid gap-3">
        <div>
          <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Input Type</label>
          <select 
            className="form-select form-select-sm border-2 rounded-3 py-2 shadow-none focus-ring" 
            value={fieldType} 
            onChange={(e) => setFieldType(e.target.value)}
            style={{ borderColor: '#e2e8f0' }}
          >
            <option value="text">📝 Text Input</option>
            <option value="textarea">📄 Paragraph / Long Text</option>
            <option value="number">🔢 Number</option>
            <option value="email">✉️ Email Address</option>
            <option value="tel">📞 Phone Number</option>
            <option value="date">📅 Date Picker</option>
            <option value="select">▼ Dropdown Select</option>
            <option value="radio">🔘 Radio Buttons</option>
            <option value="yes_no">🔀 Yes / No Switch</option>
            <option value="file">📎 File / Document Upload</option>
          </select>
        </div>

        <div>
          <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">English Label</label>
          <input
            type="text"
            className="form-control form-control-sm border-2 rounded-3 py-2 shadow-none"
            placeholder="e.g. Years of Experience"
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            style={{ borderColor: '#e2e8f0' }}
            required
          />
        </div>

        <div>
          <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Amharic Label ( አማርኛ )</label>
          <input
            type="text"
            className="form-control form-control-sm border-2 rounded-3 py-2 shadow-none"
            placeholder="e.g. የሥራ ልምድ በዓመታት"
            value={labelAm}
            onChange={(e) => setLabelAm(e.target.value)}
            style={{ borderColor: '#e2e8f0' }}
          />
        </div>

        {(fieldType === 'select' || fieldType === 'radio') && (
          <div className="p-3 bg-light rounded-3 border">
            <label className="form-label small fw-bold text-dark mb-1">Options (Comma separated)</label>
            <p className="text-muted small mb-2" style={{ fontSize: '0.75rem' }}>Separate each choice with a comma.</p>
            <input
              type="text"
              className="form-control form-control-sm border-2 rounded-3 bg-white shadow-none"
              placeholder="Beginner, Intermediate, Advanced"
              value={optionsStr}
              onChange={(e) => setOptionsStr(e.target.value)}
              style={{ borderColor: '#cbd5e1' }}
              required
            />
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-sm text-white fw-bold py-2 rounded-3 shadow-sm mt-2 transition-all"
          style={{ background: '#12544f', border: 'none' }}
        >
          + Add Field to Schema
        </button>
      </form>
    </div>
  );
}