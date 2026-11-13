// File Path: src/layouts/PartnerDashboardLayout.jsx

import React from 'react';
import { FileText, Inbox, LayoutTemplate } from 'lucide-react';

export function PartnerDashboardLayout({
  activeView,
  setActiveView,
  selectedFormKey,
  setSelectedFormKey,
  formKeys,
  children
}) {
  return (
    <div className="container-fluid vh-100 overflow-hidden bg-light p-0 d-flex flex-column">
      <a href="#main-content" className="visually-hidden-focusable p-3 bg-dark text-white fw-bold">
        Skip to main content
      </a>

      {/* Top Navbar */}
      <header className="navbar navbar-dark px-4 shadow-sm flex-shrink-0" style={{ background: '#12544f', height: '65px' }}>
        <div className="navbar-brand fw-bold d-flex align-items-center gap-2 text-white">
          <LayoutTemplate size={24} />
          <span>Partner Embed Studio</span>
        </div>
        <div className="text-white small">Organization: ALX Ethiopia Partner</div>
      </header>

      <div className="row g-0 flex-grow-1 overflow-hidden">
        {/* Static, Non-Scrollable Sidebar */}
        <nav
          aria-label="Dashboard Sidebar"
          className="col-md-3 col-lg-2 bg-white border-end p-3 d-flex flex-column flex-shrink-0"
          style={{ height: 'calc(100vh - 65px)', position: 'sticky', top: '65px', overflowY: 'hidden' }}
        >
          <div className="mb-4">
            <div className="text-uppercase small fw-bold text-muted mb-2 px-2">Forms Sidebar</div>
            <div className="list-group list-group-flush">
              {formKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`list-group-item list-group-item-action rounded-3 mb-1 fw-semibold text-capitalize ${
                    selectedFormKey === key ? 'active text-white' : ''
                  }`}
                  style={selectedFormKey === key ? { background: '#12544f', borderColor: '#12544f' } : {}}
                  onClick={() => setSelectedFormKey(key)}
                >
                  <FileText size={18} className="me-2" />
                  {key} Form
                </button>
              ))}
            </div>
          </div>

          <hr className="text-muted my-2" />

          <div className="flex-grow-1">
            <div className="text-uppercase small fw-bold text-muted mb-2 px-2">Views</div>
            <div className="d-grid gap-1">
              <button
                type="button"
                className={`btn text-start btn-light fw-bold ${activeView === 'editor' ? 'btn-outline-dark shadow-sm' : ''}`}
                onClick={() => setActiveView('editor')}
              >
                <FileText size={18} className="me-2" /> Form Editor
              </button>
              <button
                type="button"
                className={`btn text-start btn-light fw-bold ${activeView === 'submissions' ? 'btn-outline-dark shadow-sm' : ''}`}
                onClick={() => setActiveView('submissions')}
              >
                <Inbox size={18} className="me-2" /> Submissions
              </button>
              {/* <button
                type="button"
                className={`btn text-start btn-light fw-bold ${activeView === 'settings' ? 'btn-outline-dark shadow-sm' : ''}`}
                onClick={() => setActiveView('settings')}
              >
                <Settings size={18} className="me-2" /> Settings
              </button> */}
            </div>
          </div>
        </nav>

        {/* Main Content View Area (Scrollable independently) */}
        <main id="main-content" className="col-md-9 col-lg-10 p-4 p-md-5 overflow-y-auto" style={{ height: 'calc(100vh - 65px)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}