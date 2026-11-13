// File Path: src/pages/partner/PartnerDashboardMain.jsx

import React, { useState } from 'react';
import { PartnerDashboardLayout } from '../../layouts/PartnerDashboardLayout';
import { FormEditorPage } from './FormEditorPage';
import { SubmissionsPage } from './SubmissionsPage';
import { PartnerSettingsPage } from './PartnerSettingsPage';
import { INITIAL_FORMS } from '../../services/partnerMockData';

export function PartnerDashboardMain() {
  const [activeView, setActiveView] = useState('editor'); // 'editor' | 'submissions' | 'settings'
  const [selectedFormKey, setSelectedFormKey] = useState('learner');
  const [formsData, setFormsData] = useState(INITIAL_FORMS);

  const currentForm = formsData[selectedFormKey];

  const handleUpdateFormConfig = (updatedFields) => {
    setFormsData((prev) => ({
      ...prev,
      [selectedFormKey]: {
        ...prev[selectedFormKey],
        fields: updatedFields
      }
    }));
  };

  const handlePublishVersion = () => {
    setFormsData((prev) => ({
      ...prev,
      [selectedFormKey]: {
        ...prev[selectedFormKey],
        version: prev[selectedFormKey].version + 1
      }
    }));
    alert(`Published new version v${currentForm.version + 1} successfully!`);
  };

  return (
    <PartnerDashboardLayout
      activeView={activeView}
      setActiveView={setActiveView}
      selectedFormKey={selectedFormKey}
      setSelectedFormKey={setSelectedFormKey}
      formKeys={Object.keys(formsData)}
    >
      {activeView === 'editor' && (
        <FormEditorPage
          form={currentForm}
          onUpdateFields={handleUpdateFormConfig}
          onPublish={handlePublishVersion}
        />
      )}
      {activeView === 'submissions' && <SubmissionsPage formId={currentForm.formId} />}
      {/* {activeView === 'settings' && <PartnerSettingsPage />} */}
    </PartnerDashboardLayout>
  );
}

export default PartnerDashboardMain;