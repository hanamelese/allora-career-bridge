// File Path: src/components/partner/PreviewPane.jsx

import React, { useState } from 'react';
import { Volume2, ArrowLeft, ArrowRight, Check, Mic, Sparkles } from 'lucide-react';

export function PreviewPane({ fields, formType }) {
  const [lang, setLang] = useState('en');
  const [currentStep, setCurrentStep] = useState(1);
  const activeFields = fields.filter((f) => f.enabled);
  const totalSteps = Math.max(activeFields.length, 1);

  // Dashboard Brand Palette
  const brandTeal = '#12544f';
  const brandTealLight = '#e6f4f2';

  const currentField = activeFields[currentStep - 1] || activeFields[0];

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-light text-dark border px-2 py-1 small">
              <Sparkles size={12} className="text-warning me-1" /> Interactive Studio Preview
            </span>
          </div>
          <h2 className="h5 fw-bold mb-0 text-dark capitalize">Live Form Preview ({formType || 'Wizard'} Layout)</h2>
        </div>
        <div className="btn-group shadow-sm" role="group">
          <button
            type="button"
            className={`btn btn-sm fw-bold px-3 ${lang === 'en' ? 'text-white' : 'btn-outline-dark bg-white'}`}
            style={lang === 'en' ? { background: brandTeal, borderColor: brandTeal } : {}}
            onClick={() => setLang('en')}
          >
            English (en)
          </button>
          <button
            type="button"
            className={`btn btn-sm fw-bold px-3 ${lang === 'am' ? 'text-white' : 'btn-outline-dark bg-white'}`}
            style={lang === 'am' ? { background: brandTeal, borderColor: brandTeal } : {}}
            onClick={() => setLang('am')}
          >
            Amharic (am)
          </button>
        </div>
      </div>

      {/* Simulated Wizard Preview Container */}
      <div className="p-4 bg-white rounded-4 border shadow-sm mx-auto" style={{ maxWidth: '720px' }}>
        {/* Wizard Progress Bar Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="badge fs-6 px-3 py-2 text-white rounded-pill" style={{ backgroundColor: brandTeal }}>
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-secondary fw-bold small">
              {Math.round((currentStep / totalSteps) * 100)}% Completed
            </span>
          </div>
          <div className="progress border rounded-pill overflow-hidden" style={{ height: '10px', borderColor: '#cbd5e1' }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated"
              style={{ width: `${(currentStep / totalSteps) * 100}%`, backgroundColor: brandTeal }}
            />
          </div>
        </div>

        {/* Current Field Form Card */}
        {currentField ? (
          <div className="card p-4 border-2 rounded-4 shadow-sm" style={{ borderColor: brandTeal, background: '#fafafa' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h4 fw-bold m-0" style={{ color: brandTeal }}>
                {currentField.label?.[lang] || currentField.key}
                {currentField.required && <span className="text-danger ms-1">*</span>}
              </h3>
              <button type="button" className="btn btn-outline-dark btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" title="Read aloud">
                <Volume2 size={16} />
              </button>
            </div>

            <p className="text-secondary small mb-4">
              {lang === 'am' ? 'እባክዎ መረጃዎን ያስገቡ' : `Please fill out your ${currentField.label?.[lang] || currentField.key}.`}
            </p>

            {/* Dynamic input rendering */}
            {currentField.type === 'textarea' ? (
              <textarea rows={4} className="form-control form-control-lg border-2 mb-3 shadow-none bg-white" placeholder="Type or use speech..." style={{ borderColor: '#cbd5e1' }} />
            ) : currentField.type === 'select' || currentField.type === 'radio' ? (
              <select className="form-select form-select-lg border-2 mb-3 shadow-none bg-white" style={{ borderColor: '#cbd5e1' }}>
                <option value="">Select option...</option>
                {currentField.options?.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <div className="input-group input-group-lg mb-3">
                <input
                  type={currentField.type || 'text'}
                  className="form-control border-2 bg-white shadow-none"
                  placeholder={lang === 'am' ? 'እዚህ ይጻፉ...' : `Enter ${currentField.key}...`}
                  style={{ borderColor: '#cbd5e1' }}
                />
                <button type="button" className="btn text-white fw-bold px-3 d-flex align-items-center gap-1" style={{ background: brandTeal }}>
                  <Mic size={18} /> Speak
                </button>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-4">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((s) => Math.max(s - 1, 1))}
                className="btn btn-outline-dark fw-bold px-4 rounded-pill"
              >
                <ArrowLeft size={18} className="me-1" /> Back
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep((s) => Math.min(s + 1, totalSteps))}
                className="btn fw-bold text-white px-5 py-2 shadow-sm rounded-pill d-flex align-items-center gap-1"
                style={{ backgroundColor: brandTeal }}
              >
                <span>{currentStep === totalSteps ? 'Save Profile' : 'Next'}</span>
                {currentStep === totalSteps ? <Check size={18} /> : <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted py-4">No enabled fields available to preview.</p>
        )}
      </div>
    </div>
  );
}