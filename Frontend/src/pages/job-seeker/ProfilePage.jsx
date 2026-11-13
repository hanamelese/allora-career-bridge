


// // import React, { useEffect, useMemo, useRef, useState } from 'react';
// // import {
// //   UserRound,
// //   Volume2,
// //   ZoomIn,
// //   ZoomOut,
// //   ArrowLeft,
// //   ArrowRight,
// //   Mic,
// //   Square,
// //   Check,
// //   ShieldCheck,
// //   Type,
// //   Sparkles,
// //   Pencil,
// //   Save,
// //   X,
// //   BriefcaseBusiness,
// //   Sun,
// //   Moon,
// //   Accessibility,
// //   RotateCcw,
// //   Info,
// //   CircleCheck,
// //   ChevronRight,
// //   Delete,
// // } from 'lucide-react';

// // const PROFILE_STORAGE_KEY = 'savanna_saved_job_profile';
// // const SUPPORTS_STORAGE_KEY = 'savanna_device_supports';

// // const ACCOMMODATION_OPTIONS = [
// //   {
// //     id: 'screen_reader',
// //     label: 'Screen-reader compatibility',
// //     simpleLabel: 'Works with screen readers',
// //     description: 'Accessible websites, documents and applications.',
// //   },
// //   {
// //     id: 'written_instructions',
// //     label: 'Written and visual instructions',
// //     simpleLabel: 'Clear written steps and pictures',
// //     description: 'Clear written steps, diagrams or demonstrations.',
// //   },
// //   {
// //     id: 'step_free',
// //     label: 'Step-free access or remote work',
// //     simpleLabel: 'No stairs or work from home',
// //     description: 'An accessible workplace or the option to work remotely.',
// //   },
// //   {
// //     id: 'flexible_hours',
// //     label: 'Flexible working hours',
// //     simpleLabel: 'Flexible schedule and breaks',
// //     description: 'A flexible schedule or additional breaks when needed.',
// //   },
// // ];

// // const EMPTY_PROFILE = {
// //   name: '',
// //   contact: '',
// //   location: '',
// //   headline: '',
// //   skills: '',
// //   experience: '',
// //   education: '',
// // };

// // function readStoredProfile() {
// //   if (typeof window === 'undefined') return EMPTY_PROFILE;
// //   try {
// //     const saved = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
// //     return { ...EMPTY_PROFILE, ...saved };
// //   } catch {
// //     return EMPTY_PROFILE;
// //   }
// // }

// // function readStoredSupports() {
// //   if (typeof window === 'undefined') return [];
// //   try {
// //     const saved = JSON.parse(window.localStorage.getItem(SUPPORTS_STORAGE_KEY) || '[]');
// //     return Array.isArray(saved) ? saved : [];
// //   } catch {
// //     return [];
// //   }
// // }

// // const currentValCheck = (val) => Boolean(val && String(val).length > 0);

// // /**
// //  * Auto-growing textarea. Resizes whenever the value changes
// //  * (typing, voice input, clearing) without stealing focus.
// //  */
// // function AutoGrowTextarea({ value, onChange, inputRef, ...props }) {
// //   const internalRef = useRef(null);
// //   const resolvedRef = inputRef || internalRef;

// //   useEffect(() => {
// //     const el = resolvedRef.current;
// //     if (!el) return;
// //     el.style.height = 'auto';
// //     el.style.height = `${Math.max(el.scrollHeight, 140)}px`;
// //   }, [value, resolvedRef]);

// //   return (
// //     <textarea
// //       ref={resolvedRef}
// //       value={value}
// //       onChange={onChange}
// //       style={{
// //         resize: 'none',
// //         minHeight: '140px',
// //         overflowY: 'hidden',
// //       }}
// //       {...props}
// //     />
// //   );
// // }

// // export function ProfilePage({ onBackToJobs }) {
// //   const [profile, setProfile] = useState(readStoredProfile);
// //   const [supports, setSupports] = useState(readStoredSupports);
// //   const [isEditing, setIsEditing] = useState(() => !Boolean(readStoredProfile().name));

// //   // Wizard state for one-input-at-the-time editing & focus overlay
// //   const [currentWizardStep, setCurrentWizardStep] = useState(0);

// //   const [zoomLevel, setZoomLevel] = useState(115);
// //   const [wideSpacing, setWideSpacing] = useState(false);
// //   const [simpleLanguage, setSimpleLanguage] = useState(false);
// //   const [darkMode, setDarkMode] = useState(false);
// //   const [speechLang, setSpeechLang] = useState('en-GB');

// //   const [recordingField, setRecordingField] = useState(null);
// //   const [announcement, setAnnouncement] = useState('');
// //   const [saveMessage, setSaveMessage] = useState('');
// //   const [errorMessage, setErrorMessage] = useState('');
// //   const [activeSection, setActiveSection] = useState('personal');

// //   const nameRef = useRef(null);
// //   const sectionHeadingRef = useRef(null);
// //   const recognitionRef = useRef(null);
// //   const baseTextRef = useRef('');
// //   const finalTranscriptRef = useRef('');

// //   // Define wizard fields mapping
// //   const wizardFields = useMemo(() => {
// //     if (activeSection === 'personal') {
// //       return [
// //         {
// //           label: simpleLanguage ? 'My full name' : 'Full name',
// //           field: 'name',
// //           placeholder: 'Enter or speak your full name',
// //           required: true,
// //           inputRef: nameRef,
// //           help: 'This is the name shown on your job profile.',
// //         },
// //         {
// //           label: 'Phone number or email',
// //           field: 'contact',
// //           placeholder: 'e.g. +251 9XX XXX XXX or name@email.com',
// //           required: true,
// //           help: 'Employers can use this to contact you.',
// //         },
// //         {
// //           label: simpleLanguage ? 'City or town (optional)' : 'City or location (optional)',
// //           field: 'location',
// //           placeholder: 'e.g. Addis Ababa',
// //         },
// //         {
// //           label: simpleLanguage ? 'Job title or goal (optional)' : 'Professional headline (optional)',
// //           field: 'headline',
// //           placeholder: 'e.g. Customer support | Data entry',
// //           help: 'A short line about the kind of work you do or want.',
// //         },
// //       ];
// //     } else if (activeSection === 'skills') {
// //       return [
// //         {
// //           label: simpleLanguage ? 'What I am good at' : 'Skills and tools',
// //           field: 'skills',
// //           multiline: true,
// //           placeholder: 'Speak or list skills you can do...',
// //           help: 'Write as much as you like. The box grows as you type.',
// //         },
// //         {
// //           label: simpleLanguage ? 'Past work or training' : 'Work experience, volunteering or training',
// //           field: 'experience',
// //           multiline: true,
// //           placeholder: 'Describe previous jobs, volunteer work, projects or training...',
// //         },
// //         {
// //           label: simpleLanguage ? 'School or certificates (optional)' : 'Education and certificates (optional)',
// //           field: 'education',
// //           multiline: true,
// //           placeholder: 'Add your school, qualification, courses or certificates...',
// //         },
// //       ];
// //     }
// //     return [];
// //   }, [activeSection, simpleLanguage]);

// //   const completion = useMemo(() => {
// //     const fields = [
// //       profile.name,
// //       profile.contact,
// //       profile.location,
// //       profile.headline,
// //       profile.skills,
// //       profile.experience,
// //       profile.education,
// //     ];
// //     return Math.round((fields.filter((value) => String(value || '').trim()).length / fields.length) * 100);
// //   }, [profile]);

// //   useEffect(() => {
// //     if (isEditing && activeSection === 'personal' && currentWizardStep === 0) {
// //       nameRef.current?.focus();
// //     } else {
// //       sectionHeadingRef.current?.focus();
// //     }
// //   }, [isEditing, activeSection, currentWizardStep]);

// //   useEffect(
// //     () => () => {
// //       try {
// //         recognitionRef.current?.abort?.();
// //       } catch {
// //         // ignore
// //       }
// //       if (typeof window !== 'undefined' && window.speechSynthesis) {
// //         window.speechSynthesis.cancel();
// //       }
// //     },
// //     []
// //   );

// //   const speak = (text) => {
// //     setAnnouncement('');
// //     setTimeout(() => setAnnouncement(text), 50);
// //     if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
// //       window.speechSynthesis.cancel();
// //       const utterance = new window.SpeechSynthesisUtterance(text);
// //       utterance.rate = 0.95;
// //       window.speechSynthesis.speak(utterance);
// //     }
// //   };

// //   const updateField = (field, value) => {
// //     setProfile((current) => ({ ...current, [field]: value }));
// //     setSaveMessage('');
// //   };

// //   const startVoiceInput = (field, label) => {
// //     if (typeof window === 'undefined') return;
// //     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// //     if (!SpeechRecognition) {
// //       const msg = 'Voice typing is not supported in this browser. Please type, or use Chrome.';
// //       setErrorMessage(msg);
// //       speak(msg);
// //       return;
// //     }

// //     if ('speechSynthesis' in window) window.speechSynthesis.cancel();
// //     try {
// //       recognitionRef.current?.abort();
// //     } catch {
// //       // ignore
// //     }

// //     setErrorMessage('');
// //     baseTextRef.current = String(profile[field] || '').trim();
// //     finalTranscriptRef.current = '';

// //     try {
// //       const recognition = new SpeechRecognition();
// //       recognition.lang = speechLang;
// //       recognition.continuous = true;
// //       recognition.interimResults = true;
// //       recognition.maxAlternatives = 1;
// //       recognitionRef.current = recognition;

// //       recognition.onstart = () => {
// //         setRecordingField(field);
// //         setAnnouncement('');
// //         setTimeout(() => setAnnouncement(`Microphone is active for ${label}.`), 50);
// //       };

// //       recognition.onresult = (event) => {
// //         let interim = '';
// //         for (let i = event.resultIndex; i < event.results.length; i++) {
// //           const piece = event.results[i][0].transcript;
// //           if (event.results[i].isFinal) {
// //             finalTranscriptRef.current += piece.trim() + ' ';
// //           } else {
// //             interim += piece;
// //           }
// //         }
// //         const spoken = (finalTranscriptRef.current + interim).trim();
// //         const full = baseTextRef.current ? `${baseTextRef.current} ${spoken}` : spoken;
// //         updateField(field, full);
// //       };

// //       recognition.onerror = (event) => {
// //         setRecordingField(null);
// //         let msg = '';
// //         if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
// //           msg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
// //         } else if (event.error === 'no-speech') {
// //           msg = 'No speech was detected. Please check your microphone or type your answer.';
// //         } else if (event.error !== 'aborted') {
// //           msg = 'Voice recognition error. Please type your answer in the box.';
// //         }
// //         if (msg) {
// //           setErrorMessage(msg);
// //           speak(msg);
// //         }
// //       };

// //       recognition.onend = () => setRecordingField(null);
// //       recognition.start();
// //     } catch {
// //       setRecordingField(null);
// //       setErrorMessage('Voice typing could not start. Please type your answer.');
// //     }
// //   };

// //   const stopVoiceInput = () => {
// //     try {
// //       recognitionRef.current?.stop?.();
// //     } catch {
// //       // ignore
// //     }
// //     setRecordingField(null);
// //     setTimeout(() => speak('Voice recording stopped.'), 400);
// //   };

// //   const handleBackspaceField = (field, label) => {
// //     const currentVal = String(profile[field] || '');
// //     if (!currentVal) {
// //       speak(`${label} is already empty.`);
// //       return;
// //     }
// //     const updated = currentVal.slice(0, -1);
// //     updateField(field, updated);
// //     speak(`Deleted last character. ${label} is now: ${updated || 'empty'}.`);
// //   };

// //   const handleClearField = (field, label) => {
// //     updateField(field, '');
// //     speak(`${label} cleared.`);
// //   };

// //   const toggleSupport = (id, label) => {
// //     const exists = supports.includes(id);
// //     setSupports(exists ? supports.filter((item) => item !== id) : [...supports, id]);
// //     speak(exists ? `Unchecked ${label}` : `Checked ${label}`);
// //     setSaveMessage('');
// //   };

// //   const handleSave = (event) => {
// //     event?.preventDefault?.();
// //     setErrorMessage('');
// //     if (!profile.name.trim() || !profile.contact.trim()) {
// //       const msg = 'Please enter your full name and a phone number or email address before saving.';
// //       setErrorMessage(msg);
// //       speak(msg);
// //       return;
// //     }
// //     try {
// //       window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
// //       window.localStorage.setItem(SUPPORTS_STORAGE_KEY, JSON.stringify(supports));
// //       setIsEditing(false);
// //       setCurrentWizardStep(0);
// //       const msg = 'Your profile has been saved on this device.';
// //       setSaveMessage(msg);
// //       speak(msg);
// //     } catch {
// //       setErrorMessage('Your profile could not be saved. Check your browser storage settings.');
// //     }
// //   };

// //   const handleCancel = () => {
// //     setProfile(readStoredProfile());
// //     setSupports(readStoredSupports());
// //     setErrorMessage('');
// //     setIsEditing(false);
// //     setCurrentWizardStep(0);
// //     speak('Changes cancelled.');
// //   };

// //   const handleClear = () => {
// //     if (!window.confirm('Clear all profile information saved on this device?')) return;
// //     window.localStorage.removeItem(PROFILE_STORAGE_KEY);
// //     window.localStorage.removeItem(SUPPORTS_STORAGE_KEY);
// //     setProfile(EMPTY_PROFILE);
// //     setSupports([]);
// //     setIsEditing(true);
// //     setCurrentWizardStep(0);
// //     setSaveMessage('');
// //     speak('Profile information cleared.');
// //   };

// //   const initials =
// //     profile.name
// //       .trim()
// //       .split(/\s+/)
// //       .filter(Boolean)
// //       .slice(0, 2)
// //       .map((part) => part[0]?.toUpperCase())
// //       .join('') || 'U';

// //   const pageBackground = darkMode ? '#092328' : '#f1f5f9';
// //   const pageText = darkMode ? '#f8fafc' : '#0f172a';
// //   const outlineBtnClass = darkMode ? 'btn-outline-light' : 'btn-outline-dark';

// //   // Render a single wizard step field or regular field
// //   const renderField = ({
// //     label,
// //     field,
// //     type = 'text',
// //     placeholder,
// //     help,
// //     required = false,
// //     multiline = false,
// //     inputRef,
// //   }) => {
// //     const isThisFieldRecording = recordingField === field;
// //     const currentValue = profile[field] || '';

// //     return (
// //       <div
// //         key={field}
// //         className="mb-4 p-4 rounded-4 border shadow-sm field-box"
// //         style={{
// //           background: darkMode ? '#12544f' : '#f8fafc',
// //           borderColor: isThisFieldRecording ? '#dc2626' : darkMode ? '#2a835f' : '#cbd5e1',
// //         }}
// //       >
// //         <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
// //           <label htmlFor={`profile-${field}`} className="form-label fw-bold mb-0 fs-4 text-break">
// //             {label}
// //             {required && (
// //               <span className="text-danger ms-1" aria-label="required">
// //                 *
// //               </span>
// //             )}
// //           </label>

// //           <button
// //             type="button"
// //             className={`btn fw-bold px-4 py-3 d-flex align-items-center gap-2 fs-5 ${
// //               isThisFieldRecording ? 'btn-danger' : 'btn-primary'
// //             }`}
// //             onClick={() => (isThisFieldRecording ? stopVoiceInput() : startVoiceInput(field, label))}
// //             aria-pressed={isThisFieldRecording}
// //             aria-label={
// //               isThisFieldRecording
// //                 ? `Stop voice recording for ${label}`
// //                 : `Activate voice dictation for ${label}. Click or press Enter to start speaking.`
// //             }
// //           >
// //             {isThisFieldRecording ? (
// //               <>
// //                 <Square size={24} aria-hidden="true" />
// //                 <span>Stop Speaking</span>
// //               </>
// //             ) : (
// //               <>
// //                 <Mic size={24} aria-hidden="true" />
// //                 <span>Speak {label}</span>
// //               </>
// //             )}
// //           </button>
// //         </div>

// //         {isThisFieldRecording && (
// //           <div
// //             className="alert alert-warning py-3 px-3 mb-3 fw-bold fs-5 d-flex align-items-center gap-3 border-2 border-warning"
// //             role="status"
// //           >
// //             <span
// //               className="spinner-grow spinner-grow-sm text-danger"
// //               aria-hidden="true"
// //               style={{ width: '1.5rem', height: '1.5rem' }}
// //             />
// //             <span>Microphone active: Speak your {label} now, then click "Stop Speaking".</span>
// //           </div>
// //         )}

// //         {multiline ? (
// //           <AutoGrowTextarea
// //             inputRef={inputRef}
// //             id={`profile-${field}`}
// //             className="form-control form-control-lg profile-input fs-4 py-3"
// //             value={currentValue}
// //             onChange={(e) => updateField(field, e.target.value)}
// //             placeholder={placeholder}
// //             aria-describedby={help ? `help-${field}` : undefined}
// //           />
// //         ) : (
// //           <input
// //             ref={inputRef}
// //             id={`profile-${field}`}
// //             type={type}
// //             className="form-control form-control-lg profile-input fs-4 py-3"
// //             value={currentValue}
// //             onChange={(e) => updateField(field, e.target.value)}
// //             placeholder={placeholder}
// //             required={required}
// //             aria-describedby={help ? `help-${field}` : undefined}
// //           />
// //         )}

// //         <div
// //           className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-2 border-top"
// //           style={{ borderColor: darkMode ? '#2a835f' : '#e2e8f0' }}
// //           role="group"
// //           aria-label={`Audio review and edit controls for ${label}`}
// //         >
// //           <button
// //             type="button"
// //             className={`btn ${outlineBtnClass} fw-bold fs-5 px-3 py-2 d-flex align-items-center gap-1`}
// //             onClick={() =>
// //               speak(
// //                 currentValue
// //                   ? `${label} currently contains: ${currentValue}`
// //                   : `${label} is currently empty.`
// //               )
// //             }
// //             aria-label={`Read aloud current value of ${label}`}
// //           >
// //             <Volume2 size={22} aria-hidden="true" />
// //             <span>Read Back</span>
// //           </button>

// //           <button
// //             type="button"
// //             className={`btn ${darkMode ? 'btn-outline-warning' : 'btn-outline-secondary'} fw-bold fs-5 px-3 py-2 d-flex align-items-center gap-1`}
// //             onClick={() => handleBackspaceField(field, label)}
// //             disabled={!currentValCheck(currentValue)}
// //             aria-label={`Remove last character from ${label}`}
// //           >
// //             <Delete size={22} aria-hidden="true" />
// //             <span>Backspace</span>
// //           </button>

// //           <button
// //             type="button"
// //             className="btn btn-outline-danger fw-bold fs-5 px-3 py-2 d-flex align-items-center gap-1"
// //             onClick={() => handleClearField(field, label)}
// //             disabled={!currentValCheck(currentValue)}
// //             aria-label={`Clear all text in ${label}`}
// //           >
// //             <RotateCcw size={22} aria-hidden="true" />
// //             <span>Clear Box</span>
// //           </button>
// //         </div>

// //         {help && (
// //           <div
// //             id={`help-${field}`}
// //             className={`form-text mt-2 fs-5 fw-semibold ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}
// //           >
// //             {help}
// //           </div>
// //         )}
// //       </div>
// //     );
// //   };

// //   const sections = [
// //     { id: 'personal', label: simpleLanguage ? 'About me' : 'Personal details', icon: UserRound },
// //     { id: 'skills', label: simpleLanguage ? 'My work & skills' : 'Skills & experience', icon: BriefcaseBusiness },
// //     { id: 'support', label: simpleLanguage ? 'Work support' : 'Workplace preferences', icon: Accessibility },
// //   ];

// //   return (
// //     <div
// //       className={`profile-page ${darkMode ? 'dark-mode' : ''}`}
// //       style={{
// //         fontSize: `${zoomLevel}%`,
// //         letterSpacing: wideSpacing ? '0.04em' : 'normal',
// //         lineHeight: wideSpacing ? 1.85 : 1.6,
// //         background: pageBackground,
// //         color: pageText,
// //         minHeight: '100vh',
// //         width: '100%',
// //       }}
// //     >
// //       <style>{`
// //         .profile-page {
// //           --palette-dark: #092328;
// //           --palette-teal: #12544f;
// //           --palette-green: #2a835f;
// //           --palette-sage: #8bbb92;
// //           font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
// //         }
// //         .profile-page * { box-sizing: border-box; }

// //         .profile-page ::-webkit-scrollbar {
// //           width: 6px;
// //           height: 6px;
// //         }
// //         .profile-page ::-webkit-scrollbar-track {
// //           background: ${darkMode ? '#092328' : '#e2e8f0'};
// //         }
// //         .profile-page ::-webkit-scrollbar-thumb {
// //           background: ${darkMode ? '#2a835f' : '#94a3b8'};
// //           border-radius: 3px;
// //         }
// //         .profile-page ::-webkit-scrollbar-thumb:hover {
// //           background: #8bbb92;
// //         }

// //         .profile-page .topbar {
// //           background: #ffffff;
// //           border-bottom: 2px solid #cbd5e1;
// //           z-index: 1030;
// //         }
// //         .profile-page.dark-mode .topbar {
// //           background: #092328;
// //           border-bottom: 2px solid #12544f;
// //         }
// //         .profile-page .brand-mark {
// //           width: 52px;
// //           height: 52px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 14px;
// //           color: #ffffff;
// //           background: #12544f;
// //         }
// //         .profile-page.dark-mode .brand-mark {
// //           background: #2a835f;
// //         }
// //         .profile-page .hero {
// //           background: linear-gradient(135deg, #092328 0%, #12544f 100%);
// //           color: #ffffff;
// //           border-radius: 24px;
// //           box-shadow: 0 12px 32px rgba(9, 35, 40, 0.25);
// //           border: 1.5px solid #2a835f;
// //         }
// //         .profile-page .surface {
// //           background: #ffffff;
// //           border: 1.5px solid #cbd5e1;
// //           border-radius: 20px;
// //           box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
// //         }
// //         .profile-page.dark-mode .surface {
// //           background: #0f2c31;
// //           border: 1.5px solid #12544f;
// //           color: #f8fafc;
// //           box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
// //         }
// //         @media (min-width: 992px) {
// //           .profile-page .static-sidebar {
// //             position: -webkit-sticky;
// //             position: sticky;
// //             top: 96px;
// //             align-self: flex-start;
// //             max-height: calc(100vh - 112px);
// //             overflow-y: auto;
// //           }
// //         }
// //         .profile-page .profile-avatar {
// //           width: 90px;
// //           height: 90px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 24px;
// //           background: #dbeafe;
// //           color: #12544f;
// //           font-size: 2rem;
// //           font-weight: 800;
// //           flex: 0 0 auto;
// //           border: 2px solid #8bbb92;
// //         }
// //         .profile-page.dark-mode .profile-avatar {
// //           background: #12544f;
// //           color: #8bbb92;
// //           border-color: #2a835f;
// //         }
// //         .profile-page .profile-input {
// //           border: 2.5px solid #64748b;
// //           border-radius: 14px;
// //           min-height: 64px;
// //           padding: 1rem;
// //           color: #0f172a;
// //           background: #ffffff;
// //           font-weight: 500;
// //         }
// //         .profile-page.dark-mode .profile-input {
// //           border-color: #2a835f;
// //           background: #092328;
// //           color: #f8fafc;
// //         }
// //         .profile-page.dark-mode .profile-input::placeholder {
// //           color: #8bbb92;
// //           opacity: 0.7;
// //         }
// //         .profile-page .profile-input:focus {
// //           border-color: #2a835f;
// //           box-shadow: 0 0 0 0.3rem rgba(42, 131, 95, 0.25);
// //         }
// //         .profile-page .section-nav {
// //           width: 100%;
// //           text-align: left;
// //           border: 2px solid transparent;
// //           border-radius: 14px;
// //           padding: 16px 18px;
// //           background: transparent;
// //           color: #1e293b;
// //           font-weight: 700;
// //           margin-bottom: 8px;
// //         }
// //         .profile-page.dark-mode .section-nav {
// //           color: #cbd5e1;
// //         }
// //         .profile-page .section-nav.active {
// //           background: #12544f;
// //           border-color: #2a835f;
// //           color: #ffffff;
// //         }
// //         .profile-page .support-option {
// //           border: 2.5px solid #cbd5e1;
// //           border-radius: 16px;
// //           padding: 20px;
// //           cursor: pointer;
// //           transition: border-color 0.15s, background 0.15s;
// //           background: #ffffff;
// //         }
// //         .profile-page.dark-mode .support-option {
// //           border-color: #12544f;
// //           background: #12544f;
// //           color: #f8fafc;
// //         }
// //         .profile-page .support-option:has(input:checked) {
// //           border-color: #2a835f;
// //           background: #e6f4ed;
// //         }
// //         .profile-page.dark-mode .support-option:has(input:checked) {
// //           border-color: #8bbb92;
// //           background: #092328;
// //         }
// //         .profile-page .support-option input {
// //           width: 28px;
// //           height: 28px;
// //           flex: 0 0 auto;
// //         }
// //         .profile-page .saved-card {
// //           background: #f8fafc;
// //           border-color: #cbd5e1;
// //         }
// //         .profile-page.dark-mode .saved-card {
// //           background: #12544f;
// //           border-color: #2a835f;
// //         }
// //         .profile-page .btn {
// //           min-height: 52px;
// //           border-radius: 14px;
// //           font-weight: 700;
// //         }
// //         .profile-page .btn-primary {
// //           background: #12544f;
// //           border-color: #12544f;
// //         }
// //         .profile-page .btn-primary:hover {
// //           background: #092328;
// //           border-color: #092328;
// //         }
// //         .profile-page.dark-mode .btn-primary {
// //           background: #2a835f;
// //           border-color: #2a835f;
// //         }
// //         .profile-page.dark-mode .btn-primary:hover {
// //           background: #12544f;
// //           border-color: #12544f;
// //         }
// //         .profile-page button:focus-visible,
// //         .profile-page a:focus-visible,
// //         .profile-page input:focus-visible,
// //         .profile-page select:focus-visible,
// //         .profile-page textarea:focus-visible {
// //           outline: 4px solid #8bbb92 !important;
// //           outline-offset: 4px !important;
// //         }
// //         .profile-page .progress {
// //           height: 14px;
// //           background: rgba(255, 255, 255, 0.25);
// //           border-radius: 999px;
// //         }
// //         .profile-page .progress-bar {
// //           background: #8bbb92;
// //         }
// //       `}</style>

// //       {/* Assertive live region for blind and screen reader users */}
// //       <div className="visually-hidden" aria-live="assertive" aria-atomic="true">
// //         {announcement}
// //       </div>

// //       <a
// //         href="#profile-main"
// //         className="visually-hidden-focusable position-absolute top-0 start-0 bg-white text-dark p-3 fw-bold fs-4"
// //       >
// //         Skip to profile content
// //       </a>

// //       {/* FULL-WIDTH STICKY TOP BAR */}
// //       <header className="topbar sticky-top shadow-sm px-4">
// //         <div className="container-fluid py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
// //           <div className="d-flex align-items-center gap-3">
// //             <div className="brand-mark">
// //               <UserRound size={30} aria-hidden="true" />
// //             </div>
// //             <div>
// //               <div className="fw-bold fs-3 lh-1" style={{ color: darkMode ? '#8bbb92' : '#12544f' }}>
// //                 Allora
// //               </div>
// //             </div>
// //           </div>

// //           <div className="d-flex flex-wrap align-items-center gap-2" role="group" aria-label="Accessibility display settings">
// //             <div className="btn-group" role="group" aria-label="Text size">
// //               <button
// //                 type="button"
// //                 className={`btn ${outlineBtnClass} fw-bold fs-5 px-3`}
// //                 onClick={() => {
// //                   const next = Math.max(100, zoomLevel - 15);
// //                   setZoomLevel(next);
// //                   speak(`Text size ${next} percent`);
// //                 }}
// //                 disabled={zoomLevel <= 100}
// //                 aria-label="Decrease text size"
// //               >
// //                 <ZoomOut size={22} />
// //               </button>
// //               <span className={`btn ${outlineBtnClass} disabled fw-bold px-3 fs-5`} aria-live="polite">
// //                 {zoomLevel}%
// //               </span>
// //               <button
// //                 type="button"
// //                 className={`btn ${outlineBtnClass} fw-bold fs-5 px-3`}
// //                 onClick={() => {
// //                   const next = Math.min(175, zoomLevel + 15);
// //                   setZoomLevel(next);
// //                   speak(`Text size ${next} percent`);
// //                 }}
// //                 disabled={zoomLevel >= 175}
// //                 aria-label="Increase text size"
// //               >
// //                 <ZoomIn size={22} />
// //               </button>
// //             </div>

// //             <button
// //               type="button"
// //               className={`btn fw-bold fs-5 px-3 ${wideSpacing ? 'btn-primary' : outlineBtnClass}`}
// //               onClick={() => {
// //                 setWideSpacing((v) => !v);
// //                 speak(!wideSpacing ? 'Wide letter spacing turned on' : 'Wide letter spacing turned off');
// //               }}
// //               aria-pressed={wideSpacing}
// //             >
// //               <Type size={21} className="me-1" /> Spacing
// //             </button>

// //             <button
// //               type="button"
// //               className={`btn fw-bold fs-5 px-3 ${simpleLanguage ? 'btn-primary' : outlineBtnClass}`}
// //               onClick={() => {
// //                 setSimpleLanguage((v) => !v);
// //                 speak(!simpleLanguage ? 'Simple words turned on' : 'Standard words turned on');
// //               }}
// //               aria-pressed={simpleLanguage}
// //             >
// //               <Sparkles size={21} className="me-1" /> {simpleLanguage ? 'Simple: ON' : 'Simple words'}
// //             </button>

// //             {/* Voice typing language */}
// //             <label className="visually-hidden" htmlFor="speech-lang">
// //               Voice typing language
// //             </label>
// //             <select
// //               id="speech-lang"
// //               className="form-select form-select-lg fw-bold"
// //               style={{ width: 'auto', minHeight: 52, borderRadius: 14 }}
// //               value={speechLang}
// //               onChange={(e) => setSpeechLang(e.target.value)}
// //             >
// //               <option value="en-GB">English (UK)</option>
// //               <option value="en-US">English (US)</option>
// //               <option value="en-KE">English (Kenya)</option>
// //               <option value="am-ET">አማርኛ (Amharic)</option>
// //             </select>

// //             {/* Dark / Light Mode Changer Button */}
// //             <button
// //               type="button"
// //               className={`btn fw-bold fs-5 px-3 d-flex align-items-center gap-2 ${
// //                 darkMode ? 'btn-warning text-dark' : 'btn-dark text-white'
// //               }`}
// //               onClick={() => {
// //                 setDarkMode((v) => !v);
// //                 speak(!darkMode ? 'Dark mode enabled' : 'Light mode enabled');
// //               }}
// //               aria-pressed={darkMode}
// //               aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
// //             >
// //               {darkMode ? <Sun size={21} /> : <Moon size={21} />}
// //               <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
// //             </button>
// //           </div>
// //         </div>
// //       </header>

// //       {/* FULL-SCREEN CONTAINER */}
// //       <main id="profile-main" className="container-fluid px-4 py-4 py-lg-5">
// //         <button
// //           type="button"
// //           onClick={onBackToJobs}
// //           className={`btn ${outlineBtnClass} fw-bold fs-4 mb-4 px-4 py-3 d-inline-flex align-items-center gap-2 shadow-sm`}
// //           aria-label="Return to job list page"
// //         >
// //           <ArrowLeft size={24} />
// //           <span>Back to jobs</span>
// //         </button>

// //         {/* FULL-WIDTH HERO BANNER */}
// //         <section className="hero p-4 p-md-5 mb-4" aria-labelledby="page-title">
// //           <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
// //             <div>
// //               <div className="small text-white-50 fw-bold text-uppercase tracking-wider mb-2 fs-5" style={{ color: '#8bbb92' }}>
// //                 Your career space
// //               </div>
// //               <h1 id="page-title" className="display-4 fw-bold mb-3">
// //                 {simpleLanguage ? 'Your work profile' : 'Build your professional profile'}
// //               </h1>
// //               <p className="mb-0 text-white-75 fs-4" style={{ maxWidth: 780 }}>
// //                 {simpleLanguage
// //                   ? 'Speak or type your skills and work details. Choose what support helps you.'
// //                   : 'Use your voice or keyboard to share your skills, experience, and preferred workplace support.'}
// //               </p>
// //             </div>

// //             <div className="p-4 rounded-4" style={{ minWidth: 260, background: 'rgba(9, 35, 40, 0.45)', border: '1px solid #2a835f' }}>
// //               <div className="d-flex justify-content-between mb-2 fw-bold fs-5">
// //                 <span>Completeness</span>
// //                 <span style={{ color: '#8bbb92' }}>{completion}%</span>
// //               </div>
// //               <div
// //                 className="progress"
// //                 role="progressbar"
// //                 aria-label="Profile completeness"
// //                 aria-valuenow={completion}
// //                 aria-valuemin="0"
// //                 aria-valuemax="100"
// //               >
// //                 <div className="progress-bar" style={{ width: `${completion}%` }} />
// //               </div>
// //               <div className="small text-white-75 mt-2 fs-6 fw-semibold">Saved locally on your device</div>
// //             </div>
// //           </div>
// //         </section>

// //         {saveMessage && (
// //           <div
// //             className="alert alert-success border-3 rounded-4 fs-4 fw-bold d-flex align-items-center gap-3 mb-4 p-4 shadow-sm"
// //             style={{ background: darkMode ? '#0a3632' : '#d1e7dd', color: darkMode ? '#2970b7' : '#0f5132', borderColor: '#2a5443' }}
// //             role="status"
// //           >
// //             <CircleCheck size={32} />
// //             <span>{saveMessage}</span>
// //           </div>
// //         )}

// //         {errorMessage && (
// //           <div className="alert alert-danger border-3 border-danger rounded-4 fs-4 fw-bold mb-4 p-4 shadow-sm" role="alert">
// //             {errorMessage}
// //           </div>
// //         )}

// //         <div className="row g-4 align-items-start">
// //           {/* STATIC SIDEBAR */}
// //           <aside className="col-lg-4 static-sidebar" aria-label="Profile overview and sections">
// //             <section className="surface p-4 mb-4">
// //               <div className="d-flex align-items-center gap-3">
// //                 <div className="profile-avatar" aria-label={`Profile initials ${initials}`}>
// //                   {initials}
// //                 </div>
// //                 <div className="min-w-0">
// //                   <h2 className="h3 fw-bold mb-1 text-break">{profile.name || 'Your name'}</h2>
// //                 </div>
// //               </div>
// //               <hr className="my-4" style={{ borderColor: darkMode ? '#2a835f' : '#cbd5e1' }} />
// //               <div className="d-flex align-items-center justify-content-between mb-2">
// //                 <span className="fw-bold fs-5">Profile status</span>
// //               </div>
// //               <p className={`fs-5 mb-0 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                 Your details stay private in this browser until you choose to apply for a job.
// //               </p>
// //             </section>

// //             <nav className="surface p-3 mb-4" aria-label="Profile sections">
// //               <div className={`small text-uppercase fw-bold px-2 pt-2 pb-2 fs-6 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                 Profile sections
// //               </div>
// //               {sections.map(({ id, label, icon: Icon }) => (
// //                 <button
// //                   key={id}
// //                   type="button"
// //                   className={`section-nav d-flex align-items-center gap-3 fs-4 ${
// //                     activeSection === id ? 'active' : ''
// //                   }`}
// //                   onClick={() => {
// //                     setActiveSection(id);
// //                     setCurrentWizardStep(0);
// //                     speak(`Opened section: ${label}`);
// //                   }}
// //                   aria-current={activeSection === id ? 'step' : undefined}
// //                 >
// //                   <Icon size={26} aria-hidden="true" />
// //                   <span className="flex-grow-1">{label}</span>
// //                   <ChevronRight size={22} />
// //                 </button>
// //               ))}
// //             </nav>

// //             <section className="surface p-4">
// //               <div className="d-flex align-items-start gap-3">
// //                 <ShieldCheck size={30} className="flex-shrink-0 mt-1" style={{ color: '#8bbb92' }} />
// //                 <div>
// //                   <h2 className="h5 fw-bold">Your information, your choice</h2>
// //                   <p className={`fs-5 mb-0 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                     Workplace support preferences are optional. No medical proof or diagnosis is ever required.
// //                   </p>
// //                 </div>
// //               </div>
// //             </section>
// //           </aside>

// //           {/* MAIN FORM PANEL */}
// //           <section className="col-lg-8" aria-label="Profile details">
// //             <div className="surface p-4 p-md-5">
// //               <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
// //                 <div>
// //                   <div className="small text-uppercase fw-bold mb-1 fs-5" style={{ color: darkMode ? '#8bbb92' : '#1b6c65' }}>
// //                     {sections.find((item) => item.id === activeSection)?.label}
// //                   </div>
// //                   <h2 ref={sectionHeadingRef} tabIndex={-1} className="display-6 fw-bold mb-2">
// //                     {isEditing ? 'Edit your information' : 'Saved profile details'}
// //                   </h2>
// //                   <p className={`mb-0 fs-4 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                     {isEditing
// //                       ? 'Tap Speak on any box to dictate with your voice, or write as much as you want without interruption.'
// //                       : 'Review your saved details below or tap Edit to add more.'}
// //                   </p>
// //                 </div>

// //                 {!isEditing && (
// //                   <button
// //                     type="button"
// //                     className="btn btn-primary btn-lg fw-bold fs-4 px-5 py-3 shadow-sm"
// //                     onClick={() => {
// //                       setIsEditing(true);
// //                       setCurrentWizardStep(0);
// //                       speak('Editing enabled. One question at a time.');
// //                     }}
// //                   >
// //                     <Pencil size={24} className="me-2" />
// //                     Edit profile
// //                   </button>
// //                 )}
// //               </div>

// //               {/* FULL-SCREEN BLURRED BACKGROUND OVERLAY WIZARD WHEN EDITING */}
// //               {isEditing && (
// //                 <div
// //                   style={{
// //                     position: 'fixed',
// //                     top: 0,
// //                     left: 0,
// //                     width: '100vw',
// //                     height: '100vh',
// //                     backdropFilter: 'blur(8px)',
// //                     backgroundColor: darkMode ? 'rgba(9, 35, 40, 0.85)' : 'rgba(15, 23, 42, 0.75)',
// //                     zIndex: 9999,
// //                     display: 'flex',
// //                     alignItems: 'center',
// //                     justifyContent: 'center',
// //                     padding: '1rem',
// //                     overflowY: 'auto',
// //                   }}
// //                 >
// //                   <div
// //                     className="surface p-4 p-md-5 shadow-lg border-2 w-100 rounded-4 position-relative"
// //                     style={{
// //                       maxWidth: '750px',
// //                       background: darkMode ? '#0f2c31' : '#ffffff',
// //                       borderColor: '#2a835f',
// //                     }}
// //                   >
// //                     <button
// //                       type="button"
// //                       className="btn-close position-absolute top-0 end-0 m-4"
// //                       aria-label="Close wizard"
// //                       onClick={handleCancel}
// //                       style={{ filter: darkMode ? 'invert(1)' : 'none' }}
// //                     />

// //                     {activeSection === 'support' ? (
// //                       /* Workplace preferences step-by-step or standard checkboxes */
// //                       <form
// //                         onSubmit={(e) => {
// //                           e.preventDefault();
// //                           handleSave(e);
// //                         }}
// //                         noValidate
// //                       >
// //                         <h3 className="fw-bold fs-3 mb-3">Workplace preferences & support</h3>
// //                         <p className={`mb-4 fs-4 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                           Select any options that would help you do your best work.
// //                         </p>
// //                         <div className="d-grid gap-4 mb-4" role="group" aria-label="Optional workplace support preferences">
// //                           {ACCOMMODATION_OPTIONS.map((item) => {
// //                             const displayLabel = simpleLanguage ? item.simpleLabel : item.label;
// //                             const isChecked = supports.includes(item.id);
// //                             return (
// //                               <div
// //                                 key={item.id}
// //                                 className="support-option d-flex align-items-center justify-content-between gap-3"
// //                               >
// //                                 <label
// //                                   className="d-flex align-items-start gap-3 flex-grow-1 mb-0"
// //                                   style={{ cursor: 'pointer' }}
// //                                 >
// //                                   <input
// //                                     className="form-check-input mt-1"
// //                                     type="checkbox"
// //                                     checked={isChecked}
// //                                     onChange={() => toggleSupport(item.id, displayLabel)}
// //                                   />
// //                                   <span>
// //                                     <span className="d-block fw-bold fs-4">{displayLabel}</span>
// //                                     <span className={`d-block fs-5 mt-1 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                                       {item.description}
// //                                     </span>
// //                                   </span>
// //                                 </label>
// //                                 <button
// //                                   type="button"
// //                                   className={`btn ${outlineBtnClass} fs-5 px-3 py-2 flex-shrink-0`}
// //                                   onClick={() => speak(`${displayLabel}. ${item.description}`)}
// //                                   aria-label={`Read aloud: ${displayLabel}`}
// //                                 >
// //                                   <Volume2 size={24} />
// //                                 </button>
// //                               </div>
// //                             );
// //                           })}
// //                         </div>
// //                         <div className="d-flex justify-content-between align-items-center pt-4 border-top">
// //                           <button
// //                             type="button"
// //                             className={`btn ${outlineBtnClass} btn-lg fw-bold fs-4 px-4 py-3`}
// //                             onClick={handleCancel}
// //                           >
// //                             <X size={22} className="me-2" />
// //                             Cancel
// //                           </button>
// //                           <button type="submit" className="btn btn-primary btn-lg fw-bold fs-4 px-5 py-3 shadow-sm">
// //                             <Save size={22} className="me-2" />
// //                             Save Preferences
// //                           </button>
// //                         </div>
// //                       </form>
// //                     ) : (
// //                       /* Wizard View for Personal or Skills Section */
// //                       (() => {
// //                         const totalSteps = wizardFields.length;
// //                         const currentFieldObj = wizardFields[currentWizardStep];

// //                         return (
// //                           <div>
// //                             {/* Wizard Progress Bar */}
// //                             <div className="mb-4">
// //                               <div className="d-flex justify-content-between align-items-center mb-2">
// //                                 <span className="badge fs-5 px-3 py-2 text-white" style={{ backgroundColor: '#12544f' }}>
// //                                   Step {currentWizardStep + 1} of {totalSteps} ({sections.find(s => s.id === activeSection)?.label})
// //                                 </span>
// //                                 <span className="fw-bold fs-5 text-secondary">
// //                                   {Math.round(((currentWizardStep + 1) / totalSteps) * 100)}%
// //                                 </span>
// //                               </div>
// //                               <div className="progress" style={{ height: '12px' }}>
// //                                 <div
// //                                   className="progress-bar"
// //                                   style={{
// //                                     width: `${((currentWizardStep + 1) / totalSteps) * 100}%`,
// //                                     backgroundColor: '#2a835f',
// //                                   }}
// //                                 />
// //                               </div>
// //                             </div>

// //                             <form
// //                               onSubmit={(e) => {
// //                                 e.preventDefault();
// //                                 if (currentWizardStep < totalSteps - 1) {
// //                                   setCurrentWizardStep((prev) => prev + 1);
// //                                   speak(`Moving to step ${currentWizardStep + 2}`);
// //                                 } else {
// //                                   handleSave(e);
// //                                 }
// //                               }}
// //                               noValidate
// //                             >
// //                               {currentFieldObj &&
// //                                 renderField({
// //                                   label: currentFieldObj.label,
// //                                   field: currentFieldObj.field,
// //                                   placeholder: currentFieldObj.placeholder,
// //                                   required: currentFieldObj.required,
// //                                   multiline: currentFieldObj.multiline,
// //                                   inputRef: currentFieldObj.inputRef,
// //                                   help: currentFieldObj.help,
// //                                 })}

// //                               {/* Wizard Navigation Footer */}
// //                               <div className="d-flex justify-content-between align-items-center pt-4 border-top mt-4">
// //                                 <button
// //                                   type="button"
// //                                   className={`btn ${outlineBtnClass} btn-lg fw-bold fs-4 px-4 py-3`}
// //                                   onClick={() => {
// //                                     if (currentWizardStep > 0) {
// //                                       setCurrentWizardStep((prev) => prev - 1);
// //                                     } else {
// //                                       setIsEditing(false);
// //                                     }
// //                                   }}
// //                                 >
// //                                   <ArrowLeft size={22} className="me-2" />
// //                                   {currentWizardStep === 0 ? 'Cancel' : 'Previous'}
// //                                 </button>

// //                                 <button type="submit" className="btn btn-primary btn-lg fw-bold fs-4 px-5 py-3 shadow-sm">
// //                                   <span>{currentWizardStep === totalSteps - 1 ? 'Save Profile' : 'Next Step'}</span>
// //                                   {currentWizardStep === totalSteps - 1 ? (
// //                                     <Save size={22} className="ms-2" />
// //                                   ) : (
// //                                     <ArrowRight size={22} className="ms-2" />
// //                                   )}
// //                                 </button>
// //                               </div>
// //                             </form>
// //                           </div>
// //                         );
// //                       })()
// //                     )}
// //                   </div>
// //                 </div>
// //               )}

// //               {/* Non-editing saved details view */}
// //               {!isEditing && (
// //                 <div>
// //                   {activeSection === 'personal' && (
// //                     <div className="row g-4">
// //                       {[
// //                         ['Full name', profile.name],
// //                         ['Phone or email', profile.contact],
// //                         ['Location', profile.location],
// //                         ['Professional headline', profile.headline],
// //                       ].map(([label, value]) => (
// //                         <div className="col-md-6" key={label}>
// //                           <div className="rounded-4 p-4 h-100 border shadow-sm saved-card">
// //                             <div className="d-flex justify-content-between align-items-center mb-2">
// //                               <span className={`fw-bold fs-5 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                                 {label}
// //                               </span>
// //                               <button
// //                                 type="button"
// //                                 className={`btn btn-sm ${outlineBtnClass} px-3 py-2 fs-5`}
// //                                 onClick={() => speak(`${label}: ${value || 'Not added yet'}`)}
// //                                 aria-label={`Read ${label} aloud`}
// //                               >
// //                                 <Volume2 size={20} />
// //                               </button>
// //                             </div>
// //                             <div className="fw-bold fs-3 text-break">{value || 'Not added yet'}</div>
// //                           </div>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   )}

// //                   {activeSection === 'skills' && (
// //                     <div className="d-grid gap-4">
// //                       {[
// //                         ['Skills and tools', profile.skills],
// //                         ['Work experience and training', profile.experience],
// //                         ['Education and certificates', profile.education],
// //                       ].map(([label, value]) => (
// //                         <div className="rounded-4 p-4 border shadow-sm saved-card" key={label}>
// //                           <div className="d-flex justify-content-between align-items-center mb-2">
// //                             <span className={`fw-bold fs-5 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                               {label}
// //                             </span>
// //                             <button
// //                               type="button"
// //                               className={`btn btn-sm ${outlineBtnClass} px-3 py-2 fs-5`}
// //                               onClick={() => speak(`${label}: ${value || 'Not added yet'}`)}
// //                               aria-label={`Read ${label} aloud`}
// //                             >
// //                               <Volume2 size={20} />
// //                             </button>
// //                           </div>
// //                           <div className="fs-3 text-break" style={{ whiteSpace: 'pre-wrap' }}>
// //                             {value || 'Not added yet'}
// //                           </div>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   )}

// //                   {activeSection === 'support' && (
// //                     <div className="d-grid gap-4">
// //                       {supports.length ? (
// //                         ACCOMMODATION_OPTIONS.filter((item) => supports.includes(item.id)).map((item) => (
// //                           <div
// //                             key={item.id}
// //                             className="rounded-4 p-4 border d-flex align-items-center justify-content-between gap-3 shadow-sm saved-card"
// //                             style={{ borderColor: '#2a835f' }}
// //                           >
// //                             <div className="d-flex align-items-start gap-3">
// //                               <Check size={28} className="mt-1 flex-shrink-0" style={{ color: '#8bbb92' }} />
// //                               <div>
// //                                 <div className="fw-bold fs-3">{item.label}</div>
// //                                 <div className={`fs-4 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                                   {item.description}
// //                                 </div>
// //                               </div>
// //                             </div>
// //                             <button
// //                               type="button"
// //                               className={`btn ${outlineBtnClass} fs-5 px-3 py-2`}
// //                               onClick={() => speak(`${item.label}. ${item.description}`)}
// //                               aria-label={`Read ${item.label} aloud`}
// //                             >
// //                               <Volume2 size={22} />
// //                             </button>
// //                           </div>
// //                         ))
// //                       ) : (
// //                         <p className={`fs-4 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                           No workplace preferences selected yet. Tap "Edit or add details" to choose any support you prefer.
// //                         </p>
// //                       )}
// //                     </div>
// //                   )}

// //                   <div className="border-top mt-5 pt-5 d-flex flex-wrap justify-content-between gap-3" style={{ borderColor: darkMode ? '#2a835f' : '#dee2e6' }}>
// //                     <button type="button" className="btn btn-outline-danger btn-lg fw-bold fs-4 px-4 py-3" onClick={handleClear}>
// //                       <RotateCcw size={24} className="me-2" />
// //                       Clear profile
// //                     </button>
// //                     <button
// //                       type="button"
// //                       className="btn btn-primary btn-lg fw-bold fs-4 px-5 py-3 shadow-sm"
// //                       onClick={() => {
// //                         setIsEditing(true);
// //                         setCurrentWizardStep(0);
// //                         speak('Editing enabled.');
// //                       }}
// //                     >
// //                       <Pencil size={24} className="me-2" />
// //                       Edit or add details
// //                     </button>
// //                   </div>
// //                 </div>
// //               )}
// //             </div>

// //             <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4 px-2">
// //               <button
// //                 type="button"
// //                 className={`btn ${outlineBtnClass} fw-bold fs-5 px-4 py-3 d-flex align-items-center gap-2 shadow-sm`}
// //                 onClick={() =>
// //                   speak(
// //                     `Profile summary for ${profile.name || 'unnamed user'}. Contact: ${
// //                       profile.contact || 'not set'
// //                     }. Skills: ${profile.skills || 'none added'}. Experience: ${
// //                       profile.experience || 'none added'
// //                     }. ${supports.length} workplace supports selected.`
// //                   )
// //                 }
// //               >
// //                 <Volume2 size={24} />
// //                 <span>Read full profile summary aloud</span>
// //               </button>

// //               <span className={`fw-bold fs-5 ${darkMode ? 'text-light opacity-85' : 'text-secondary'}`}>
// //                 <ShieldCheck size={22} className="me-1" style={{ color: '#9ac7a1' }} />
// //                 Saved locally on this device
// //               </span>
// //             </div>
// //           </section>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // }

// // export default ProfilePage;






// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import { UserRound, BriefcaseBusiness, Accessibility, ShieldCheck, Pencil, Save, X, RotateCcw, CircleCheck, ArrowLeft, ArrowRight, Check, Volume2 } from 'lucide-react';
// import { TopBar } from '../../components/jobSeeker/TopBar';
// import { ProfileSidebar } from '../../components/jobSeeker/ProfileSidebar';
// import { ProfileField } from '../../components/jobSeeker/ProfileField';

// const PROFILE_STORAGE_KEY = 'savanna_saved_job_profile';
// const SUPPORTS_STORAGE_KEY = 'savanna_device_supports';

// const ACCOMMODATION_OPTIONS = [
//   { id: 'screen_reader', label: 'Screen-reader compatibility', simpleLabel: 'Works with screen readers', description: 'Accessible websites, documents and applications.' },
//   { id: 'written_instructions', label: 'Written and visual instructions', simpleLabel: 'Clear written steps and pictures', description: 'Clear written steps, diagrams or demonstrations.' },
//   { id: 'step_free', label: 'Step-free access or remote work', simpleLabel: 'No stairs or work from home', description: 'An accessible workplace or the option to work remotely.' },
//   { id: 'flexible_hours', label: 'Flexible working hours', simpleLabel: 'Flexible schedule and breaks', description: 'A flexible schedule or additional breaks when needed.' },
// ];

// const EMPTY_PROFILE = { name: '', contact: '', location: '', headline: '', skills: '', experience: '', education: '' };

// function readStoredProfile() {
//   if (typeof window === 'undefined') return EMPTY_PROFILE;
//   try {
//     const saved = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
//     return { ...EMPTY_PROFILE, ...saved };
//   } catch {
//     return EMPTY_PROFILE;
//   }
// }

// function readStoredSupports() {
//   if (typeof window === 'undefined') return [];
//   try {
//     const saved = JSON.parse(window.localStorage.getItem(SUPPORTS_STORAGE_KEY) || '[]');
//     return Array.isArray(saved) ? saved : [];
//   } catch {
//     return [];
//   }
// }

// const currentValCheck = (val) => Boolean(val && String(val).length > 0);

// export function ProfilePage({ onBackToJobs }) {
//   const [profile, setProfile] = useState(readStoredProfile);
//   const [supports, setSupports] = useState(readStoredSupports);
// const [isEditing, setIsEditing] = useState(false);
//   const [currentWizardStep, setCurrentWizardStep] = useState(0);

//   const [zoomLevel, setZoomLevel] = useState(115);
//   const [wideSpacing, setWideSpacing] = useState(false);
//   const [simpleLanguage, setSimpleLanguage] = useState(false);
//   const [darkMode, setDarkMode] = useState(false);
//   const [speechLang, setSpeechLang] = useState('en-GB');

//   const [recordingField, setRecordingField] = useState(null);
//   const [announcement, setAnnouncement] = useState('');
//   const [saveMessage, setSaveMessage] = useState('');
//   const [errorMessage, setErrorMessage] = useState('');
//   const [activeSection, setActiveSection] = useState('personal');

//   const nameRef = useRef(null);
//   const sectionHeadingRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const baseTextRef = useRef('');
//   const finalTranscriptRef = useRef('');

//   const outlineBtnClass = darkMode ? 'btn-outline-light' : 'btn-outline-dark';

//   const cardStyle = {
//     background: darkMode ? '#12544f' : '#f8fafc',
//     color: darkMode ? '#f8fafc' : '#0f172a',
//     borderColor: darkMode ? '#2a835f' : '#cbd5e1',
//   };

//   const sections = [
//     { id: 'personal', label: simpleLanguage ? 'About me' : 'Personal details', icon: UserRound },
//     { id: 'skills', label: simpleLanguage ? 'My work & skills' : 'Skills & experience', icon: BriefcaseBusiness },
//     { id: 'support', label: simpleLanguage ? 'Work support' : 'Workplace preferences', icon: Accessibility },
//   ];

//   const wizardFields = useMemo(() => {
//     if (activeSection === 'personal') {
//       return [
//         { label: simpleLanguage ? 'My full name' : 'Full name', field: 'name', placeholder: 'Enter or speak your full name', required: true, inputRef: nameRef, help: 'This is the name shown on your job profile.' },
//         { label: 'Phone number or email', field: 'contact', placeholder: 'e.g. +251 9XX XXX XXX or name@email.com', required: true, help: 'Employers can use this to contact you.' },
//         { label: simpleLanguage ? 'City or town (optional)' : 'City or location (optional)', field: 'location', placeholder: 'e.g. Addis Ababa' },
//         { label: simpleLanguage ? 'Job title or goal (optional)' : 'Professional headline (optional)', field: 'headline', placeholder: 'e.g. Customer support | Data entry', help: 'A short line about the kind of work you do or want.' },
//       ];
//     } else if (activeSection === 'skills') {
//       return [
//         { label: simpleLanguage ? 'What I am good at' : 'Skills and tools', field: 'skills', multiline: true, placeholder: 'Speak or list skills you can do...', help: 'Write as much as you like. The box grows as you type.' },
//         { label: simpleLanguage ? 'Past work or training' : 'Work experience, volunteering or training', field: 'experience', multiline: true, placeholder: 'Describe previous jobs, volunteer work, projects or training...' },
//         { label: simpleLanguage ? 'School or certificates (optional)' : 'Education and certificates (optional)', field: 'education', multiline: true, placeholder: 'Add your school, qualification, courses or certificates...' },
//       ];
//     }
//     return [];
//   }, [activeSection, simpleLanguage]);

//   const completion = useMemo(() => {
//     const fields = [profile.name, profile.contact, profile.location, profile.headline, profile.skills, profile.experience, profile.education];
//     return Math.round((fields.filter((value) => String(value || '').trim()).length / fields.length) * 100);
//   }, [profile]);

//   const initials = profile.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';

//   const speak = (text) => {
//     setAnnouncement('');
//     setTimeout(() => setAnnouncement(text), 50);
//     if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
//       window.speechSynthesis.cancel();
//       const utterance = new window.SpeechSynthesisUtterance(text);
//       utterance.rate = 0.95;
//       window.speechSynthesis.speak(utterance);
//     }
//   };

//   const updateField = (field, value) => {
//     setProfile((current) => ({ ...current, [field]: value }));
//     setSaveMessage('');
//   };

//   const startVoiceInput = (field, label) => {
//     if (typeof window === 'undefined') return;
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) {
//       setErrorMessage('Voice typing is not supported in this browser.');
//       return;
//     }
//     if ('speechSynthesis' in window) window.speechSynthesis.cancel();
//     try { recognitionRef.current?.abort(); } catch {}

//     setErrorMessage('');
//     baseTextRef.current = String(profile[field] || '').trim();
//     finalTranscriptRef.current = '';

//     const recognition = new SpeechRecognition();
//     recognition.lang = speechLang;
//     recognition.continuous = true;
//     recognition.interimResults = true;
//     recognitionRef.current = recognition;

//     recognition.onresult = (event) => {
//       let interim = '';
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         const piece = event.results[i][0].transcript;
//         if (event.results[i].isFinal) finalTranscriptRef.current += piece.trim() + ' ';
//         else interim += piece;
//       }
//       updateField(field, (finalTranscriptRef.current + interim).trim());
//     };
//     recognition.onend = () => setRecordingField(null);
//     recognition.start();
//     setRecordingField(field);
//   };

//   const stopVoiceInput = () => {
//     try { recognitionRef.current?.stop?.(); } catch {}
//     setRecordingField(null);
//   };

//   const handleBackspaceField = (field) => {
//     updateField(field, String(profile[field] || '').slice(0, -1));
//   };

//   const handleClearField = (field) => {
//     updateField(field, '');
//   };

//   const toggleSupport = (id, label) => {
//     const exists = supports.includes(id);
//     setSupports(exists ? supports.filter((i) => i !== id) : [...supports, id]);
//     speak(exists ? `Unchecked ${label}` : `Checked ${label}`);
//   };

//   const handleSave = (event) => {
//     event?.preventDefault?.();
//     if (!profile.name.trim() || !profile.contact.trim()) {
//       setErrorMessage('Please enter your full name and a phone number or email.');
//       return;
//     }
//     window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
//     window.localStorage.setItem(SUPPORTS_STORAGE_KEY, JSON.stringify(supports));
//     setIsEditing(false);
//     setCurrentWizardStep(0);
//     setSaveMessage('Your profile has been saved successfully.');
//   };

//   const handleCancel = () => {
//     setProfile(readStoredProfile());
//     setSupports(readStoredSupports());
//     setIsEditing(false);
//     setCurrentWizardStep(0);
//   };

//   const handleClear = () => {
//     if (!window.confirm('Clear all profile info?')) return;
//     window.localStorage.removeItem(PROFILE_STORAGE_KEY);
//     window.localStorage.removeItem(SUPPORTS_STORAGE_KEY);
//     setProfile(EMPTY_PROFILE);
//     setSupports([]);
//     setIsEditing(true);
//     setCurrentWizardStep(0);
//   };

//   return (
//     <div
//       className={`profile-page ${darkMode ? 'dark-mode' : ''}`}
//       style={{
//         fontSize: `${zoomLevel}%`,
//         letterSpacing: wideSpacing ? '0.04em' : 'normal',
//         background: darkMode ? '#092328' : '#f1f5f9',
//         color: darkMode ? '#f8fafc' : '#0f172a',
//         minHeight: '100vh',
//       }}
//     >
//       <style>{`
//         .profile-page {
//           --palette-dark: #092328;
//           --palette-teal: #12544f;
//           --palette-green: #2a835f;
//           --palette-sage: #8bbb92;
//           font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
//         }
//         .profile-page * { box-sizing: border-box; }

//         .profile-page ::-webkit-scrollbar {
//           width: 6px;
//           height: 6px;
//         }
//         .profile-page ::-webkit-scrollbar-track {
//           background: ${darkMode ? '#092328' : '#e2e8f0'};
//         }
//         .profile-page ::-webkit-scrollbar-thumb {
//           background: ${darkMode ? '#2a835f' : '#94a3b8'};
//           border-radius: 3px;
//         }
//         .profile-page ::-webkit-scrollbar-thumb:hover {
//           background: #8bbb92;
//         }

//         .profile-page .topbar {
//           background: #ffffff;
//           border-bottom: 2px solid #cbd5e1;
//           z-index: 1030;
//         }
//         .profile-page.dark-mode .topbar {
//           background: #092328;
//           border-bottom: 2px solid #12544f;
//         }
//         .profile-page .brand-mark {
//           width: 52px;
//           height: 52px;
//           display: grid;
//           place-items: center;
//           border-radius: 14px;
//           color: #ffffff;
//           background: #12544f;
//         }
//         .profile-page.dark-mode .brand-mark {
//           background: #2a835f;
//         }
//         .profile-page .hero {
//           background: linear-gradient(135deg, #092328 0%, #12544f 100%);
//           color: #ffffff;
//           border-radius: 24px;
//           box-shadow: 0 12px 32px rgba(9, 35, 40, 0.25);
//           border: 1.5px solid #2a835f;
//         }
//         .profile-page .surface {
//           background: #ffffff;
//           border: 1.5px solid #cbd5e1;
//           border-radius: 20px;
//           box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
//         }
//         .profile-page.dark-mode .surface {
//           background: #0f2c31;
//           border: 1.5px solid #12544f;
//           color: #f8fafc;
//           box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
//         }
//         @media (min-width: 992px) {
//           .profile-page .static-sidebar {
//             position: -webkit-sticky;
//             position: sticky;
//             top: 96px;
//             align-self: flex-start;
//             max-height: calc(100vh - 112px);
//             overflow-y: auto;
//           }
//         }
//         .profile-page .profile-avatar {
//           width: 90px;
//           height: 90px;
//           display: grid;
//           place-items: center;
//           border-radius: 24px;
//           background: #dbeafe;
//           color: #12544f;
//           font-size: 2rem;
//           font-weight: 800;
//           flex: 0 0 auto;
//           border: 2px solid #8bbb92;
//         }
//         .profile-page.dark-mode .profile-avatar {
//           background: #12544f;
//           color: #8bbb92;
//           border-color: #2a835f;
//         }
//         .profile-page .profile-input {
//           border: 2.5px solid #64748b;
//           border-radius: 14px;
//           min-height: 64px;
//           padding: 1rem;
//           color: #0f172a;
//           background: #ffffff;
//           font-weight: 500;
//         }
//         .profile-page.dark-mode .profile-input {
//           border-color: #2a835f;
//           background: #092328;
//           color: #f8fafc;
//         }
//         .profile-page.dark-mode .profile-input::placeholder {
//           color: #8bbb92;
//           opacity: 0.7;
//         }
//         .profile-page .profile-input:focus {
//           border-color: #2a835f;
//           box-shadow: 0 0 0 0.3rem rgba(42, 131, 95, 0.25);
//         }
//         .profile-page .section-nav {
//           width: 100%;
//           text-align: left;
//           border: 2px solid transparent;
//           border-radius: 14px;
//           padding: 16px 18px;
//           background: transparent;
//           color: #1e293b;
//           font-weight: 700;
//           margin-bottom: 8px;
//         }
//         .profile-page.dark-mode .section-nav {
//           color: #cbd5e1;
//         }
//         .profile-page .section-nav.active {
//           background: #12544f;
//           border-color: #2a835f;
//           color: #ffffff;
//         }
//         .profile-page .support-option {
//           border: 2.5px solid #cbd5e1;
//           border-radius: 16px;
//           padding: 20px;
//           cursor: pointer;
//           transition: border-color 0.15s, background 0.15s;
//           background: #ffffff;
//         }
//         .profile-page.dark-mode .support-option {
//           border-color: #12544f;
//           background: #12544f;
//           color: #f8fafc;
//         }
//         .profile-page .support-option:has(input:checked) {
//           border-color: #2a835f;
//           background: #e6f4ed;
//         }
//         .profile-page.dark-mode .support-option:has(input:checked) {
//           border-color: #8bbb92;
//           background: #092328;
//         }
//         .profile-page .btn {
//           min-height: 52px;
//           border-radius: 14px;
//           font-weight: 700;
//         }
//         .profile-page .btn-primary {
//           background: #12544f;
//           border-color: #12544f;
//           color: #ffffff;
//         }
//         .profile-page .btn-primary:hover {
//           background: #092328;
//           border-color: #092328;
//         }
//         .profile-page.dark-mode .btn-primary {
//           background: #2a835f;
//           border-color: #2a835f;
//           color: #ffffff;
//         }
//         .profile-page.dark-mode .btn-primary:hover {
//           background: #12544f;
//           border-color: #12544f;
//         }
//       `}</style>

//       <div className="visually-hidden" aria-live="assertive" aria-atomic="true">
//         {announcement}
//       </div>

//       {/* 1. Connected TopBar Component */}
//       <TopBar
//         {...{
//           zoomLevel,
//           setZoomLevel,
//           wideSpacing,
//           setWideSpacing,
//           simpleLanguage,
//           setSimpleLanguage,
//           speechLang,
//           setSpeechLang,
//           darkMode,
//           setDarkMode,
//           speak,
//           outlineBtnClass,
//         }}
//       />

//       <main id="profile-main" className="container-fluid px-4 py-4 py-lg-5">
//         {saveMessage && <div className="alert alert-success fs-4 fw-bold p-4 mb-4">{saveMessage}</div>}
//         {errorMessage && <div className="alert alert-danger fs-4 fw-bold p-4 mb-4">{errorMessage}</div>}

//         <div className="row g-4 align-items-start">
//           {/* 2. Connected ProfileSidebar Component */}
//           <ProfileSidebar
//             {...{
//               profile,
//               initials,
//               sections,
//               activeSection,
//               setActiveSection,
//               setCurrentWizardStep,
//               speak,
//               darkMode,
//             }}
//           />

//           {/* Main Panel & Wizard Modal Integration */}
//           <section className="col-lg-8">
//             <div
//               className="surface p-4 p-md-5 rounded-4 shadow"
//               style={{
//                 background: darkMode ? '#0f2c31' : '#ffffff',
//                 color: darkMode ? '#f8fafc' : '#0f172a',
//                 border: darkMode ? '1.5px solid #12544f' : 'none',
//               }}
//             >
//               <div className="d-flex justify-content-between align-items-center mb-4">
//                 <h2 style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>{sections.find((s) => s.id === activeSection)?.label}</h2>
//                 {!isEditing && (
//                   <button className="btn btn-primary fw-bold px-4" onClick={() => setIsEditing(true)}>
//                     <Pencil size={20} className="me-2" /> Edit profile
//                   </button>
//                 )}
//               </div>

//               {/* Full-Screen Wizard Overlay */}
//               {isEditing && (
//                 <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(9, 35, 40, 0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
//                   <div className="surface p-4 p-md-5 rounded-4 w-100 position-relative shadow-lg" style={{ maxWidth: '750px', background: darkMode ? '#0f2c31' : '#ffffff', color: darkMode ? '#f8fafc' : '#0f172a', border: '2px solid #2a835f' }}>
//                     <button className="btn-close position-absolute top-0 end-0 m-4" onClick={handleCancel} style={{ filter: darkMode ? 'invert(1)' : 'none' }} />

//                     {activeSection === 'support' ? (
//                       <form onSubmit={handleSave}>
//                         <h3 style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>Workplace preferences</h3>
//                         <div className="d-grid gap-3 my-4">
//                           {ACCOMMODATION_OPTIONS.map((item) => (
//                             <label key={item.id} className="support-option d-flex gap-3 align-items-center p-3 border rounded-3" style={{ background: darkMode ? '#12544f' : '#f8fafc', color: darkMode ? '#f8fafc' : '#0f172a', borderColor: darkMode ? '#2a835f' : '#cbd5e1' }}>
//                               <input type="checkbox" checked={supports.includes(item.id)} onChange={() => toggleSupport(item.id, item.label)} />
//                               <span><strong style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>{item.label}</strong><br /><small className={darkMode ? 'text-light opacity-75' : 'text-muted'}>{item.description}</small></span>
//                             </label>
//                           ))}
//                         </div>
//                         <button type="submit" className="btn btn-primary w-100">Save Preferences</button>
//                       </form>
//                     ) : (
//                       (() => {
//                         const totalSteps = wizardFields.length;
//                         const currentField = wizardFields[currentWizardStep];
//                         return (
//                           <div>
//                             <div className="mb-3 fw-bold" style={{ color: darkMode ? '#8bbb92' : '#358982' }}>Step {currentWizardStep + 1} of {totalSteps}</div>
//                             <form onSubmit={(e) => {
//                               e.preventDefault();
//                               if (currentWizardStep < totalSteps - 1) setCurrentWizardStep((p) => p + 1);
//                               else handleSave(e);
//                             }}>
//                               {currentField && (
//                                 <ProfileField
//                                   {...currentField}
//                                   {...{ profile, updateField, recordingField, startVoiceInput, stopVoiceInput, handleBackspaceField, handleClearField, speak, darkMode, outlineBtnClass }}
//                                 />
//                               )}
//                               <div className="d-flex justify-content-between mt-4">
//                                 <button type="button" className={`btn ${outlineBtnClass}`} onClick={() => currentWizardStep > 0 ? setCurrentWizardStep((p) => p - 1) : setIsEditing(false)}>
//                                   <ArrowLeft size={18} className="me-1" /> {currentWizardStep === 0 ? 'Cancel' : 'Previous'}
//                                 </button>
//                                 <button type="submit" className="btn btn-primary">
//                                   {currentWizardStep === totalSteps - 1 ? 'Save Profile' : 'Next Step'} <ArrowRight size={18} className="ms-1" />
//                                 </button>
//                               </div>
//                             </form>
//                           </div>
//                         );
//                       })()
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* View Mode */}
//               {!isEditing && (
//                 <div>
//                   {activeSection === 'personal' && (
//                     <div className="row g-3">
//                       {[['Name', profile.name], ['Contact', profile.contact], ['Location', profile.location], ['Headline', profile.headline]].map(([lbl, val]) => (
//                         <div className="col-md-6" key={lbl}>
//                           <div className="p-3 border rounded-3 shadow-sm" style={cardStyle}>
//                             <small className={`fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>{lbl}</small>
//                             <div className="fs-4 fw-semibold">{val || 'Not provided'}</div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                   {activeSection === 'skills' && (
//                     <div className="d-grid gap-3">
//                       {[['Skills', profile.skills], ['Experience', profile.experience], ['Education', profile.education]].map(([lbl, val]) => (
//                         <div className="p-3 border rounded-3 shadow-sm" key={lbl} style={cardStyle}>
//                           <small className={`fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>{lbl}</small>
//                           <div className="fs-5" style={{ whiteSpace: 'pre-wrap' }}>{val || 'Not provided'}</div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                   {activeSection === 'support' && (
//                     <div className="d-grid gap-3">
//                       {supports.length ? ACCOMMODATION_OPTIONS.filter((i) => supports.includes(i.id)).map((i) => (
//                         <div key={i.id} className="p-3 border rounded-3 shadow-sm d-flex align-items-center gap-3" style={cardStyle}>
//                           <Check style={{ color: darkMode ? '#8bbb92' : '#2a835f' }} size={24} />
//                           <div><strong style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>{i.label}</strong><br /><small className={darkMode ? 'text-light opacity-75' : 'text-muted'}>{i.description}</small></div>
//                         </div>
//                       )) : <p className={darkMode ? 'text-light' : 'text-secondary'}>No preferences selected yet.</p>}
//                     </div>
//                   )}
//                   <div className="mt-4 pt-3 border-top d-flex justify-content-between" style={{ borderColor: darkMode ? '#12544f' : '#dee2e6' }}>
//                     <button className="btn btn-outline-danger" onClick={handleClear}><RotateCcw size={18} className="me-2" />Clear Profile</button>
//                     <button className="btn btn-primary" onClick={() => setIsEditing(true)}><Pencil size={18} className="me-2" />Edit Details</button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }

// export default ProfilePage;




import React, { useMemo, useRef, useState } from 'react';
import { UserRound, BriefcaseBusiness, Accessibility, Pencil, RotateCcw, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { TopBar } from '../../components/jobSeeker/TopBar';
import { ProfileSidebar } from '../../components/jobSeeker/ProfileSidebar';
import { ProfileField } from '../../components/jobSeeker/ProfileField';
import { TRANSLATIONS } from '../../utils/translations';

const PROFILE_STORAGE_KEY = 'savanna_saved_job_profile';
const SUPPORTS_STORAGE_KEY = 'savanna_device_supports';
const EMPTY_PROFILE = { name: '', contact: '', location: '', headline: '', skills: '', experience: '', education: '' };

function readStoredProfile() {
  if (typeof window === 'undefined') return EMPTY_PROFILE;
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
    return { ...EMPTY_PROFILE, ...saved };
  } catch {
    return EMPTY_PROFILE;
  }
}

function readStoredSupports() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(SUPPORTS_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function ProfilePage({ onBackToJobs }) {
  const [profile, setProfile] = useState(readStoredProfile);
  const [supports, setSupports] = useState(readStoredSupports);
  const [isEditing, setIsEditing] = useState(false);
  const [currentWizardStep, setCurrentWizardStep] = useState(0);

  const [zoomLevel, setZoomLevel] = useState(115);
  const [wideSpacing, setWideSpacing] = useState(false);
  const [simpleLanguage, setSimpleLanguage] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-GB');

  const [recordingField, setRecordingField] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSection, setActiveSection] = useState('personal');

  const nameRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');
  const finalTranscriptRef = useRef('');

  // Active language resolver
  const langCode = speechLang.startsWith('am') ? 'am' : 'en';
  const t = (key) => TRANSLATIONS[langCode]?.[key] || TRANSLATIONS.en[key] || key;

  const outlineBtnClass = darkMode ? 'btn-outline-light' : 'btn-outline-dark';

  const cardStyle = {
    background: darkMode ? '#12544f' : '#f8fafc',
    color: darkMode ? '#f8fafc' : '#0f172a',
    borderColor: darkMode ? '#2a835f' : '#cbd5e1',
  };

  const accommodationOptions = [
    { id: 'screen_reader', label: t('acc_screen_reader_label'), description: t('acc_screen_reader_desc') },
    { id: 'written_instructions', label: t('acc_written_instructions_label'), description: t('acc_written_instructions_desc') },
    { id: 'step_free', label: t('acc_step_free_label'), description: t('acc_step_free_desc') },
    { id: 'flexible_hours', label: t('acc_flexible_hours_label'), description: t('acc_flexible_hours_desc') },
  ];

  const sections = [
    { id: 'personal', label: simpleLanguage ? t('personalDetailsSimple') : t('personalDetails'), icon: UserRound },
    { id: 'skills', label: simpleLanguage ? t('skillsExperienceSimple') : t('skillsExperience'), icon: BriefcaseBusiness },
    { id: 'support', label: simpleLanguage ? t('workplacePrefsSimple') : t('workplacePrefs'), icon: Accessibility },
  ];

  const wizardFields = useMemo(() => {
    if (activeSection === 'personal') {
      return [
        { label: simpleLanguage ? t('fullNameSimple') : t('fullName'), field: 'name', placeholder: t('fullNamePlaceholder'), required: true, inputRef: nameRef, help: t('fullNameHelp') },
        { label: t('contact'), field: 'contact', placeholder: t('contactPlaceholder'), required: true, help: t('contactHelp') },
        { label: simpleLanguage ? t('locationSimple') : t('location'), field: 'location', placeholder: t('locationPlaceholder') },
        { label: simpleLanguage ? t('headlineSimple') : t('headline'), field: 'headline', placeholder: t('headlinePlaceholder'), help: t('headlineHelp') },
      ];
    } else if (activeSection === 'skills') {
      return [
        { label: simpleLanguage ? t('skillsSimple') : t('skills'), field: 'skills', multiline: true, placeholder: t('skillsPlaceholder'), help: t('skillsHelp') },
        { label: simpleLanguage ? t('experienceSimple') : t('experience'), field: 'experience', multiline: true, placeholder: t('experiencePlaceholder') },
        { label: simpleLanguage ? t('educationSimple') : t('education'), field: 'education', multiline: true, placeholder: t('educationPlaceholder') },
      ];
    }
    return [];
  }, [activeSection, simpleLanguage, langCode]);

  const initials = profile.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';

  const speak = (text) => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(text), 50);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = speechLang;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaveMessage('');
  };

  const startVoiceInput = (field) => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage(t('voiceNotSupported'));
      return;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    try { recognitionRef.current?.abort(); } catch {}

    setErrorMessage('');
    baseTextRef.current = String(profile[field] || '').trim();
    finalTranscriptRef.current = '';

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscriptRef.current += piece.trim() + ' ';
        else interim += piece;
      }
      updateField(field, (finalTranscriptRef.current + interim).trim());
    };
    recognition.onend = () => setRecordingField(null);
    recognition.start();
    setRecordingField(field);
  };

  const stopVoiceInput = () => {
    try { recognitionRef.current?.stop?.(); } catch {}
    setRecordingField(null);
  };

  const handleBackspaceField = (field) => {
    updateField(field, String(profile[field] || '').slice(0, -1));
  };

  const handleClearField = (field) => {
    updateField(field, '');
  };

  const toggleSupport = (id, label) => {
    const exists = supports.includes(id);
    setSupports(exists ? supports.filter((i) => i !== id) : [...supports, id]);
    speak(label);
  };

  const handleSave = (event) => {
    event?.preventDefault?.();
    if (!profile.name.trim() || !profile.contact.trim()) {
      setErrorMessage(t('validationError'));
      return;
    }
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.localStorage.setItem(SUPPORTS_STORAGE_KEY, JSON.stringify(supports));
    setIsEditing(false);
    setCurrentWizardStep(0);
    setSaveMessage(t('saveSuccess'));
  };

  const handleCancel = () => {
    setProfile(readStoredProfile());
    setSupports(readStoredSupports());
    setIsEditing(false);
    setCurrentWizardStep(0);
  };

  const handleClear = () => {
    if (!window.confirm(t('clearConfirm'))) return;
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    window.localStorage.removeItem(SUPPORTS_STORAGE_KEY);
    setProfile(EMPTY_PROFILE);
    setSupports([]);
    setIsEditing(false);
    setCurrentWizardStep(0);
  };

  return (
    <div
      className={`profile-page ${darkMode ? 'dark-mode' : ''}`}
      style={{
        fontSize: `${zoomLevel}%`,
        letterSpacing: wideSpacing ? '0.04em' : 'normal',
        background: darkMode ? '#092328' : '#f1f5f9',
        color: darkMode ? '#f8fafc' : '#0f172a',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');

        .profile-page {
          --palette-dark: #092328;
          --palette-teal: #12544f;
          --palette-green: #2a835f;
          --palette-sage: #8bbb92;
          font-family: 'Noto Sans Ethiopic', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
        }
        .profile-page * { box-sizing: border-box; }
        @media (min-width: 992px) {
          .profile-page .static-sidebar {
            position: sticky;
            top: 96px;
            align-self: flex-start;
            max-height: calc(100vh - 112px);
            overflow: hidden;
          }
        }
        .profile-page .btn { min-height: 52px; border-radius: 14px; font-weight: 700; }
        .profile-page .btn-primary { background: #12544f; border-color: #12544f; color: #ffffff; }
        .profile-page .btn-primary:hover { background: #092328; border-color: #092328; }
        .profile-page.dark-mode .btn-primary { background: #2a835f; border-color: #2a835f; color: #ffffff; }
        .profile-page.dark-mode .btn-primary:hover { background: #12544f; border-color: #12544f; }
      `}</style>

      <div className="visually-hidden" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>

      <TopBar
        {...{
          zoomLevel,
          setZoomLevel,
          wideSpacing,
          setWideSpacing,
          simpleLanguage,
          setSimpleLanguage,
          speechLang,
          setSpeechLang,
          darkMode,
          setDarkMode,
          speak,
          t,
        }}
      />

      <main id="profile-main" className="container-fluid px-4 py-4 py-lg-5">
        {saveMessage && <div className="alert alert-success fs-4 fw-bold p-4 mb-4">{saveMessage}</div>}
        {errorMessage && <div className="alert alert-danger fs-4 fw-bold p-4 mb-4">{errorMessage}</div>}

        <div className="row g-4 align-items-start">
          <ProfileSidebar
            {...{
              profile,
              initials,
              sections,
              activeSection,
              setActiveSection,
              setCurrentWizardStep,
              speak,
              darkMode,
              t,
            }}
          />

          <section className="col-lg-8">
            <div
              className="surface p-4 p-md-5 rounded-4 shadow"
              style={{
                background: darkMode ? '#0f2c31' : '#ffffff',
                color: darkMode ? '#f8fafc' : '#0f172a',
                border: darkMode ? '1.5px solid #12544f' : 'none',
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>{sections.find((s) => s.id === activeSection)?.label}</h2>
                {!isEditing && (
                  <button className="btn btn-primary fw-bold px-4" onClick={() => setIsEditing(true)}>
                    <Pencil size={20} className="me-2" /> {t('editProfile')}
                  </button>
                )}
              </div>

              {isEditing && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(9, 35, 40, 0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                  <div className="surface p-4 p-md-5 rounded-4 w-100 position-relative shadow-lg" style={{ maxWidth: '750px', background: darkMode ? '#0f2c31' : '#ffffff', color: darkMode ? '#f8fafc' : '#0f172a', border: '2px solid #2a835f' }}>
                    <button className="btn-close position-absolute top-0 end-0 m-4" onClick={handleCancel} style={{ filter: darkMode ? 'invert(1)' : 'none' }} />

                    {activeSection === 'support' ? (
                      <form onSubmit={handleSave}>
                        <h3 style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>{t('workplacePrefs')}</h3>
                        <div className="d-grid gap-3 my-4">
                          {accommodationOptions.map((item) => (
                            <label key={item.id} className="support-option d-flex gap-3 align-items-center p-3 border rounded-3" style={{ background: darkMode ? '#12544f' : '#f8fafc', color: darkMode ? '#f8fafc' : '#0f172a', borderColor: darkMode ? '#2a835f' : '#cbd5e1', cursor: 'pointer' }}>
                              <input type="checkbox" checked={supports.includes(item.id)} onChange={() => toggleSupport(item.id, item.label)} style={{ width: '24px', height: '24px' }} />
                              <span><strong style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>{item.label}</strong><br /><small className={darkMode ? 'text-light opacity-75' : 'text-muted'}>{item.description}</small></span>
                            </label>
                          ))}
                        </div>
                        <button type="submit" className="btn btn-primary w-100">{t('savePreferences')}</button>
                      </form>
                    ) : (
                      (() => {
                        const totalSteps = wizardFields.length;
                        const currentField = wizardFields[currentWizardStep];
                        return (
                          <div>
                            <div className="mb-3 fw-bold" style={{ color: darkMode ? '#8bbb92' : '#2a835f' }}>
                              {t('step')} {currentWizardStep + 1} {t('of')} {totalSteps}
                            </div>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              if (currentWizardStep < totalSteps - 1) setCurrentWizardStep((p) => p + 1);
                              else handleSave(e);
                            }}>
                              {currentField && (
                                <ProfileField
                                  {...currentField}
                                  {...{ profile, updateField, recordingField, startVoiceInput, stopVoiceInput, handleBackspaceField, handleClearField, speak, darkMode, t }}
                                />
                              )}
                              <div className="d-flex justify-content-between mt-4">
                                <button type="button" className={`btn ${outlineBtnClass}`} onClick={() => currentWizardStep > 0 ? setCurrentWizardStep((p) => p - 1) : setIsEditing(false)}>
                                  <ArrowLeft size={18} className="me-1" /> {currentWizardStep === 0 ? t('cancel') : t('previous')}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                  {currentWizardStep === totalSteps - 1 ? t('saveProfile') : t('nextStep')} <ArrowRight size={18} className="ms-1" />
                                </button>
                              </div>
                            </form>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              )}

              {!isEditing && (
                <div>
                  {activeSection === 'personal' && (
                    <div className="row g-3">
                      {[[t('nameLabel'), profile.name], [t('contactViewLabel'), profile.contact], [t('locationViewLabel'), profile.location], [t('headlineViewLabel'), profile.headline]].map(([lbl, val]) => (
                        <div className="col-md-6" key={lbl}>
                          <div className="p-3 border rounded-3 shadow-sm" style={cardStyle}>
                            <small className={`fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>{lbl}</small>
                            <div className="fs-4 fw-semibold">{val || t('notProvided')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeSection === 'skills' && (
                    <div className="d-grid gap-3">
                      {[[t('skillsViewLabel'), profile.skills], [t('experienceViewLabel'), profile.experience], [t('educationViewLabel'), profile.education]].map(([lbl, val]) => (
                        <div className="p-3 border rounded-3 shadow-sm" key={lbl} style={cardStyle}>
                          <small className={`fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>{lbl}</small>
                          <div className="fs-5" style={{ whiteSpace: 'pre-wrap' }}>{val || t('notProvided')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeSection === 'support' && (
                    <div className="d-grid gap-3">
                      {supports.length ? accommodationOptions.filter((i) => supports.includes(i.id)).map((i) => (
                        <div key={i.id} className="p-3 border rounded-3 shadow-sm d-flex align-items-center gap-3" style={cardStyle}>
                          <Check style={{ color: darkMode ? '#8bbb92' : '#2a835f' }} size={24} />
                          <div><strong style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>{i.label}</strong><br /><small className={darkMode ? 'text-light opacity-75' : 'text-muted'}>{i.description}</small></div>
                        </div>
                      )) : <p className={darkMode ? 'text-light' : 'text-secondary'}>{t('noPrefsSelected')}</p>}
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-top d-flex justify-content-between" style={{ borderColor: darkMode ? '#12544f' : '#dee2e6' }}>
                    <button className="btn btn-outline-danger" onClick={handleClear}><RotateCcw size={18} className="me-2" />{t('clearProfile')}</button>
                    <button className="btn btn-primary" onClick={() => setIsEditing(true)}><Pencil size={18} className="me-2" />{t('editDetails')}</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;