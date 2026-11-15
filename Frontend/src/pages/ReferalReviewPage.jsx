import React from 'react';
import { useParams } from 'react-router-dom';
import ReferralReviewCard from '../components/organisation/ReferralReviewCard.jsx';

// Mock database for frontend-only testing
const MOCK_REFERRALS = {
  "ref_123": {
    partnerOrganization: "AADP",
    candidateName: "Abebe Kebede",
    careerTrack: "Full-Stack Web Development",
    location: "Addis Ababa, Ethiopia",
    referralDate: "Nov 15, 2026",
    skills: ["JavaScript", "React", "Node.js", "SQLite"],
    notes: "Completed foundational software engineering track with strong problem-solving readiness.",
    status: "Pending Review"
  },
  "ref_456": {
    partnerOrganization: "EthioTech Partners",
    candidateName: "Selamawit Tadesse",
    careerTrack: "Data Analytics & Python",
    location: "Adama, Ethiopia",
    referralDate: "Nov 14, 2026",
    skills: ["Python", "SQL", "Data Visualization"],
    notes: "Recommended for entry-level data operations placement.",
    status: "Pending Review"
  }
};

export default function ReferralReviewPage() {
  const { token } = useParams();
  
  // Fallback to ref_123 if token is missing or not found in mock data
  const activeToken = token || "ref_123";
  const referralData = MOCK_REFERRALS[activeToken] || {
    partnerOrganization: "Partner Network",
    candidateName: "Hana Melese",
    careerTrack: "Software Engineering",
    location: "Addis Ababa, Ethiopia",
    referralDate: "Nov 15, 2026",
    skills: ["React", "Node.js", "REST APIs"],
    notes: "Candidate referred through ALX-Bridge accessible onboarding gateway.",
    status: "Pending Review"
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <ReferralReviewCard token={activeToken} referralData={referralData} />
    </main>
  );
}