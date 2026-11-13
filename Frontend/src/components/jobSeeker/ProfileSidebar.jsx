import React from 'react';
import { ChevronRight, UserCheck } from 'lucide-react';

export function ProfileSidebar({
  profile,
  initials,
  sections,
  activeSection,
  setActiveSection,
  setCurrentWizardStep,
  speak,
  darkMode,
  t, // Translation helper prop
}) {
  return (
    <aside className="col-lg-4 static-sidebar" aria-label="Profile overview and sections">
      {/* Profile Identity Card */}
      <section
        className="surface p-4 mb-4 rounded-4 shadow-sm position-relative overflow-hidden"
        style={{
          background: darkMode ? 'linear-gradient(135deg, #0f2c31 0%, #12544f 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1.5px solid',
          borderColor: darkMode ? '#2a835f' : '#cbd5e1',
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="profile-avatar shadow-sm"
            aria-label={`Profile initials ${initials}`}
            style={{
              background: darkMode ? '#12544f' : '#e6f4ed',
              color: darkMode ? '#8bbb92' : '#12544f',
              border: '2px solid #2a835f',
            }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="d-flex align-items-center gap-1 mb-1">
              <UserCheck size={16} style={{ color: '#2a835f' }} />
              <span className="small text-uppercase fw-bold tracking-wider" style={{ color: '#2a835f' }}>
                {t ? t('activeProfile') : 'Active Profile'}
              </span>
            </div>
            <h2 className="h3 fw-bold mb-0 text-break" style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>
              {profile.name || (t ? t('yourName') : 'Your name')}
            </h2>
          </div>
        </div>
      </section>

      {/* Navigation Sections */}
      <nav
        className="surface p-3 mb-4 rounded-4 shadow-sm"
        aria-label="Profile sections"
        style={{
          background: darkMode ? '#0f2c31' : '#ffffff',
          border: '1.5px solid',
          borderColor: darkMode ? '#2a835f' : '#cbd5e1',
        }}
      >
        <div className={`small text-uppercase fw-bold px-2 pt-2 pb-3 fs-6 ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>
          {t ? t('profileSections') : 'Profile sections'}
        </div>
        <div className="d-grid gap-2">
          {sections.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                className={`section-nav d-flex align-items-center gap-3 fs-4 transition-all ${
                  isActive ? 'active shadow-sm' : ''
                }`}
                style={{
                  borderRadius: '12px',
                  padding: '14px 18px',
                  border: '1.5px solid',
                  borderColor: isActive ? '#2a835f' : 'transparent',
                  background: isActive
                    ? darkMode
                      ? '#12544f'
                      : '#e6f4ed'
                    : 'transparent',
                  color: isActive
                    ? darkMode
                      ? '#ffffff'
                      : '#0f2c31'
                    : darkMode
                    ? '#cbd5e1'
                    : '#334155',
                  fontWeight: isActive ? '700' : '600',
                }}
                onClick={() => {
                  setActiveSection(id);
                  setCurrentWizardStep(0);
                  speak(`Opened section: ${label}`);
                }}
                aria-current={isActive ? 'step' : undefined}
              >
                <Icon
                  size={24}
                  style={{
                    color: isActive ? (darkMode ? '#8bbb92' : '#12544f') : 'inherit',
                  }}
                  aria-hidden="true"
                />
                <span className="flex-grow-1 text-start">{label}</span>
                <ChevronRight
                  size={20}
                  className="opacity-75"
                />
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

export default ProfileSidebar;