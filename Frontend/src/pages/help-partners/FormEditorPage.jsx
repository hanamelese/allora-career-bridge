// File Path: src/pages/partner/FormEditorPage.jsx

import React, { useState } from 'react';
import { FieldCatalogItem } from '../../components/partner/FieldCatalogItem';
import { CustomFieldEditor } from '../../components/partner/CustomFieldEditor';
import { PreviewPane } from '../../components/partner/PreviewPane';
import { VersionControl } from '../../components/partner/VersionControl';
import { EmbedTagBox } from '../../components/partner/EmbedTagBox';
import { Code, Copy, Check, FileCode, Layers } from 'lucide-react';

export function FormEditorPage({ form, onUpdateFields, onPublish }) {
  const [activeTab, setActiveTab] = useState('fields');
  const [jsonCopied, setJsonCopied] = useState(false);

  const handleUpdateField = (index, updatedField) => {
    const updated = [...form.fields];
    updated[index] = updatedField;
    onUpdateFields(updated);
  };

  const handleDeleteField = (index) => {
    const updated = form.fields.filter((_, idx) => idx !== index);
    onUpdateFields(updated);
  };

  const handleAddCustomField = (newField) => {
    onUpdateFields([...form.fields, newField]);
  };

  const currentJsonSchema = JSON.stringify(form, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(currentJsonSchema);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  return (
    <div className="pb-4">
      {/* Header Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-teal text-white px-2 py-1 small rounded-2 font-monospace" style={{ background: '#12544f' }}>
              {form.formId}
            </span>
            {/* <span className="text-muted small">| Active Studio Schema</span> */}
          </div>
          <h1 className="h3 fw-bold mb-0 text-capitalize text-dark">{form.type.replace('_', ' ')} Form Setup</h1>
        </div>
        <VersionControl version={form.version} onPublish={onPublish} />
      </div>

      {/* Navigation Pills Tabs */}
      <ul className="nav nav-pills mb-4 gap-2 bg-white p-2 rounded-4 shadow-sm border d-inline-flex">
        <li className="nav-item">
          <button
            className={`nav-link fw-bold px-4 py-2 rounded-pill transition-all d-flex align-items-center gap-2 ${
              activeTab === 'fields' ? 'text-white shadow-sm' : 'text-secondary bg-transparent'
            }`}
            style={activeTab === 'fields' ? { background: '#12544f' } : {}}
            onClick={() => setActiveTab('fields')}
          >
            <Layers size={16} /> Fields & Schema
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-bold px-4 py-2 rounded-pill transition-all d-flex align-items-center gap-2 ${
              activeTab === 'preview' ? 'text-white shadow-sm' : 'text-secondary bg-transparent'
            }`}
            style={activeTab === 'preview' ? { background: '#12544f' } : {}}
            onClick={() => setActiveTab('preview')}
          >
            Live Preview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-bold px-4 py-2 rounded-pill transition-all d-flex align-items-center gap-2 ${
              activeTab === 'schema' ? 'text-white shadow-sm' : 'text-secondary bg-transparent'
            }`}
            style={activeTab === 'schema' ? { background: '#12544f' } : {}}
            onClick={() => setActiveTab('schema')}
          >
            <Code size={16} /> JSON Output
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-bold px-4 py-2 rounded-pill transition-all d-flex align-items-center gap-2 ${
              activeTab === 'embed' ? 'text-white shadow-sm' : 'text-secondary bg-transparent'
            }`}
            style={activeTab === 'embed' ? { background: '#12544f' } : {}}
            onClick={() => setActiveTab('embed')}
          >
            Embed Tag
          </button>
        </li>
      </ul>

      {/* Tab Content: Fields & Schema Builder */}
      {activeTab === 'fields' && (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <h2 className="h6 fw-bold mb-0 text-dark">Configured Form Panels & Inputs</h2>
                <span className="badge bg-light text-dark border px-2 py-1 small">
                  {form.fields.length} active fields
                </span>
              </div>
              {form.fields.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FileCode size={40} className="mb-2 opacity-50" />
                  <p className="mb-0">No fields in this form. Add a custom field or enable defaults.</p>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {form.fields.map((field, idx) => (
                    <FieldCatalogItem
                      key={field.key || idx}
                      field={field}
                      index={idx}
                      onUpdateField={handleUpdateField}
                      onDeleteField={handleDeleteField}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4">
            <CustomFieldEditor onAddCustomField={handleAddCustomField} />
          </div>
        </div>
      )}

      {/* Tab Content: Live Preview */}
      {activeTab === 'preview' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <PreviewPane fields={form.fields} formType={form.type} />
        </div>
      )}

      {/* Tab Content: JSON Schema Output */}
      {activeTab === 'schema' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div>
              <h2 className="h6 fw-bold mb-1 text-dark">Live JSON Schema Output</h2>
              <p className="text-muted small mb-0">Structural config consumed by your public form engine.</p>
            </div>
            <button 
              className={`btn btn-sm fw-bold px-3 py-2 rounded-3 shadow-sm d-flex align-items-center gap-1 ${
                jsonCopied ? 'btn-success' : 'btn-dark'
              }`} 
              onClick={handleCopyJson}
            >
              {jsonCopied ? <><Check size={16} /> Copied JSON!</> : <><Copy size={16} /> Copy JSON Schema</>}
            </button>
          </div>
          <pre className="bg-dark text-light p-4 rounded-4 font-monospace small shadow-inset overflow-auto mb-0" style={{ maxHeight: '450px' }}>
            {currentJsonSchema}
          </pre>
        </div>
      )}

      {/* Tab Content: Embed Tag Generator */}
      {activeTab === 'embed' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <EmbedTagBox formId={form.formId} version={form.version} publicKey="pk_live_88392109" />
        </div>
      )}
    </div>
  );
}