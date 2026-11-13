// File Path: src/services/partnerMockData.js

export const INITIAL_FORMS = {
    learner: {
        formId: 'frm_learner_01',
        type: 'learner',
        version: 3,
        languages: ['en', 'am'],
        defaultLanguage: 'en',
        fields: [
            { key: 'name', label: { en: 'Full Name', am: 'ሙሉ ስም' }, type: 'text', enabled: true, required: true },
            { key: 'documentId', label: { en: 'Document ID', am: 'መለያ ሰነድ' }, type: 'text', enabled: true, required: true },
            { key: 'location', label: { en: 'City / Location', am: 'ከተማ / አካባቢ' }, type: 'text', enabled: true, required: false },
            {
                key: 'learningSupport',
                label: { en: 'Required Learning Accommodations', am: 'የሚያስፈልጉ የመማሪያ ድጋፎች' },
                type: 'select',
                enabled: true,
                required: false,
                options: [
                    'Screen Reader Compatibility / Text-to-Speech',
                    'Written & Visual Step-by-Step Instructions',
                    'Flexible Pacing & Extended Time',
                    'Sign Language Interpretation Support'
                ]
            }
        ]
    },
    signup: {
        formId: 'frm_signup_02',
        type: 'signup',
        version: 1,
        languages: ['en', 'am'],
        defaultLanguage: 'en',
        fields: [
            { key: 'name', label: { en: 'Full Name', am: 'ሙሉ ስም' }, type: 'text', enabled: true, required: true },
            { key: 'contact', label: { en: 'Email or Phone', am: 'ኢሜይል ወይም ስልክ' }, type: 'text', enabled: true, required: true }
        ]
    },
    jobseeker: {
        formId: 'frm_jobseeker_03',
        type: 'job_seeker',
        version: 2,
        languages: ['en', 'am'],
        defaultLanguage: 'en',
        fields: [
            { key: 'name', label: { en: 'Full Name', am: 'ሙሉ ስም' }, type: 'text', enabled: true, required: true },
            { key: 'skills', label: { en: 'Skills & Tools', am: 'ክህሎቶች እና መሣሪያዎች' }, type: 'textarea', enabled: true, required: true },
            {
                key: 'workplaceSupports',
                label: { en: 'Workplace Support Preferences', am: 'የሥራ ቦታ ድጋፍ ምርጫዎች' },
                type: 'select',
                enabled: true,
                required: false,
                options: [
                    'Screen Reader Compatibility',
                    'Written & Visual Instructions',
                    'Step-Free Access / Remote Work',
                    'Flexible Working Hours'
                ]
            }
        ]
    },
    employer: {
        formId: 'frm_employer_04',
        type: 'employer',
        version: 1,
        languages: ['en', 'am'],
        defaultLanguage: 'en',
        fields: [
            { key: 'companyName', label: { en: 'Company Name', am: 'የድርጅቱ ስም' }, type: 'text', enabled: true, required: true },
            { key: 'location', label: { en: 'Office Location', am: 'የቢሮ ቦታ' }, type: 'text', enabled: true, required: true },
            {
                key: 'offeredAccommodations',
                label: { en: 'Accessible Workplace Accommodations Offered', am: 'የሚሰጡ ተደራሽ የሥራ ቦታ ድጋፎች' },
                type: 'select',
                enabled: true,
                required: false,
                options: [
                    'Fully Remote / Work from Home Enabled',
                    'Step-Free Wheelchair Accessible Office',
                    'Flexible Shift Hours',
                    'Assistive Tech & Screen Reader Ready Workstations'
                ]
            }
        ]
    }
};