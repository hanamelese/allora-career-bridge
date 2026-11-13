// File Path: src/pages/partner/SubmissionsPage.jsx

import React from 'react';
import { Eye } from 'lucide-react';

export function SubmissionsPage({ formId }) {
  const MOCK_SUBMISSIONS = [
    { id: 'sub_99a', date: '2026-11-13 10:24', version: 3, respondent: 'Abebe Kebede', status: 'Completed' },
    { id: 'sub_98b', date: '2026-11-12 16:45', version: 3, respondent: 'Tigist Bekele', status: 'Completed' },
  ];

  return (
    <div>
      <h1 className="h3 fw-bold mb-1">Form Submissions</h1>
      <p className="text-secondary mb-4">Incoming responses for Form ID: <code>{formId}</code></p>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="py-3 px-4">Submission ID</th>
              <th className="py-3">Respondent</th>
              <th className="py-3">Form Version</th>
              <th className="py-3">Timestamp</th>
              <th className="py-3 text-end px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SUBMISSIONS.map((sub) => (
              <tr key={sub.id}>
                <td className="fw-bold px-4"><code>{sub.id}</code></td>
                <td>{sub.respondent}</td>
                <td><span className="badge bg-secondary">v{sub.version}</span></td>
                <td className="text-muted">{sub.date}</td>
                <td className="text-end px-4">
                  <button className="btn btn-sm btn-outline-dark px-3 fw-bold" onClick={() => alert(`Viewing payload for ${sub.id}`)}>
                    <Eye size={16} className="me-1" /> View Payload
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}