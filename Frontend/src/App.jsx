import React, { useState } from 'react';
import { ProfilePage } from './pages/job-seeker/ProfilePage';
import { PartnerDashboardMain } from './pages/help-partners/PartnerDashboardMain';

// Inside your router setup in App.jsx:
// <Route path="/partner" element={<PartnerDashboardMain />} />
export default function App() {
  return (
    <div>
      <ProfilePage onBackToJobs={() => console.log('Back to jobs clicked')} />
      {/* <PartnerDashboardMain /> */}
    </div>
  );
}