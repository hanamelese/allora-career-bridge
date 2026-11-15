import React, { useState } from 'react';

export default function ReferralReviewCard({ token, referralData }) {
  const [status, setStatus] = useState(referralData?.status || 'Pending Review');
  const [remarks, setRemarks] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAction = (decision) => {
    const accepted = decision === 'accepted';
    setStatus(accepted ? 'Accepted' : 'Declined');
    setIsSubmitted(true);
  };

  return (
    <div className="w-full max-w-xl bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top Brand Bar */}
      <div className="bg-teal-700 text-white px-6 py-3 flex justify-between items-center text-sm font-semibold">
        <span>ALX-Bridge Partner Portal</span>
        <span className="bg-white/15 px-2 py-0.5 rounded font-mono text-xs">REF: {token}</span>
      </div>

      {/* Status Alert Banner if action taken */}
      {isSubmitted && (
        <div
          role="status"
          aria-live="polite"
          className={`mx-6 mt-4 p-3 rounded-lg text-sm font-medium ${
            status === 'Accepted'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          Referral for {referralData.candidateName} has been marked as <strong>{status}</strong>.
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Candidate Referral Review</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Target Organization: <strong className="text-gray-900">{referralData.partnerOrganization}</strong>
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            status === 'Accepted'
              ? 'bg-green-100 text-green-800'
              : status === 'Declined'
              ? 'bg-red-100 text-red-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {status}
        </span>
      </div>

      {/* Candidate Details Grid */}
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Candidate Name</span>
            <span className="text-base font-medium text-gray-900">{referralData.candidateName}</span>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Career Track</span>
            <span className="text-base font-medium text-gray-900">{referralData.careerTrack}</span>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Location</span>
            <span className="text-base font-medium text-gray-900">{referralData.location}</span>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Referral Date</span>
            <span className="text-base font-medium text-gray-900">{referralData.referralDate}</span>
          </div>
        </div>

        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Verified Skills</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {referralData.skills.map((skill, index) => (
              <span key={index} className="bg-teal-50 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-md">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Referral Summary</span>
          <p className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
            {referralData.notes}
          </p>
        </div>

        {/* Partner Remarks Input */}
        <div>
          <label htmlFor="remarks" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Reviewer Notes (Optional)
          </label>
          <textarea
            id="remarks"
            disabled={isSubmitted}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any internal notes or feedback..."
            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-gray-50"
            rows="2"
          ></textarea>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
        <button
          type="button"
          disabled={isSubmitted}
          onClick={() => handleAction('declined')}
          className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50"
        >
          Decline Referral
        </button>
        <button
          type="button"
          disabled={isSubmitted}
          onClick={() => handleAction('accepted')}
          className="px-4 py-2.5 bg-teal-700 text-white font-semibold rounded-lg text-sm hover:bg-teal-800 transition disabled:opacity-50"
        >
          Accept &amp; Confirm
        </button>
      </div>
    </div>
  );
}