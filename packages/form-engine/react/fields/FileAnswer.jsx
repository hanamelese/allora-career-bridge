import { useId, useRef, useState } from 'react';
import { acceptAttribute, checkFile, formatFileSize, listFileTypes } from '@onboarding/contracts/uploads.js';

const COPY = {
  en: {
    choose: 'Choose a file',
    replace: 'Choose a different file',
    remove: 'Remove this file',
    limits: (types, size) => `You can upload a ${types} file, up to ${size} MB.`,
    selected: 'Selected file',
    chosen: (name, size) => `Selected: ${name}, ${size}.`,
    removed: 'The file was removed. You can choose another, or skip this question.',
    where: 'The file is sent to the organisation with your answers when you send the form. It is not saved before then.',
    problems: {
      tooBig: (size, max) => `This file is ${size}. Choose a file of ${max} MB or less.`,
      wrongType: (allowed) => `This kind of file cannot be used. Choose a ${allowed} file.`,
      empty: 'This file is empty. Choose another file.',
      invalid: 'This file could not be read. Choose another file.',
    },
  },
  am: {
    choose: 'ፋይል ይምረጡ',
    replace: 'ሌላ ፋይል ይምረጡ',
    remove: 'ይህን ፋይል አስወግድ',
    limits: (types, size) => `${types} ፋይል፣ እስከ ${size} MB መጫን ይችላሉ።`,
    selected: 'የተመረጠ ፋይል',
    chosen: (name, size) => `ተመርጧል፦ ${name}፣ ${size}።`,
    removed: 'ፋይሉ ተወግዷል። ሌላ መምረጥ ወይም ይህን ጥያቄ መዝለል ይችላሉ።',
    where: 'ፋይሉ ቅጹን ሲልኩ ከመልሶችዎ ጋር ለድርጅቱ ይላካል። ከዚያ በፊት አይቀመጥም።',
    problems: {
      tooBig: (size, max) => `ይህ ፋይል ${size} ነው። ${max} MB ወይም ከዚያ በታች የሆነ ፋይል ይምረጡ።`,
      wrongType: (allowed) => `ይህ ዓይነት ፋይል መጠቀም አይቻልም። ${allowed} ፋይል ይምረጡ።`,
      empty: 'ይህ ፋይል ባዶ ነው። ሌላ ፋይል ይምረጡ።',
      invalid: 'ይህ ፋይል ሊነበብ አልቻለም። ሌላ ፋይል ይምረጡ።',
    },
  },
};

/** The plain-language message for a file problem, in the learner's language. */
export function describeFileProblem(found, language = 'en') {
  const copy = (COPY[language] ?? COPY.en).problems;
  if (!found) return null;
  if (found.problem === 'tooBig') return copy.tooBig(found.size, found.maxSizeMb);
  if (found.problem === 'wrongType') return copy.wrongType(found.allowed);
  return copy[found.problem] ?? copy.invalid;
}

/**
 * Uploading a file: a document, a CV.
 *
 * The real file input does the work - so it opens the device's own file
 * picker, with a keyboard (Enter or Space), by touch, and with a screen
 * reader, which announces it by the question's name. It is drawn as a
 * large button. The limits are said before a file is chosen; once one is,
 * its name, size and type are shown with ways to replace or remove it.
 *
 * A file that breaks the partner's rules is reported at once, in words
 * that say what to do. The engine applies the same check (one function,
 * `checkFile`) before the learner can move on.
 */
export function FileAnswer({ question, value, onChange, describedBy, hasError }) {
  const language = question.language ?? 'en';
  const copy = COPY[language] ?? COPY.en;
  const rules = question.upload;
  const id = `fe-${question.key}`;
  const limitsId = useId();
  const inputRef = useRef(null);
  const [status, setStatus] = useState('');

  const hasFile = Boolean(value && typeof value === 'object' && 'name' in value);
  const found = hasFile ? checkFile(value, rules) : null;
  /* The renderer shows the engine's message once the learner presses
     Next; until then, this says it straight away. */
  const problem = found && !hasError ? describeFileProblem(found, language) : null;

  function handleChange(event) {
    const file = event.target.files?.[0];
    /* Cleared so choosing the same file again still counts as a change. */
    event.target.value = '';
    if (!file) return;

    onChange(file);
    setStatus(copy.chosen(file.name, formatFileSize(file.size)));
  }

  function remove() {
    onChange(undefined);
    setStatus(copy.removed);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const described = [describedBy, limitsId, problem ? `${id}-problem` : null].filter(Boolean).join(' ');

  return (
    <div className="fe-file">
      <p className="fe-file__limits" id={limitsId}>
        {copy.limits(listFileTypes(rules, language === 'am' ? 'ወይም' : 'or'), rules.maxSizeMb)}{' '}
        {copy.where}
      </p>

      {/* The native input, kept in the tab order and visually hidden; its
          label is the visible button. */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="fe-file__input"
        accept={acceptAttribute(rules)}
        /* Starts with the button's visible words, then says which question
           it is for (WCAG 2.5.3, label in name). */
        aria-label={`${hasFile ? copy.replace : copy.choose}: ${question.label}`}
        aria-describedby={described}
        aria-invalid={hasError || Boolean(problem) || undefined}
        aria-required={question.required || undefined}
        onChange={handleChange}
      />
      <label htmlFor={id} className="fe-button fe-file__button">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
          />
        </svg>
        <span>{hasFile ? copy.replace : copy.choose}</span>
      </label>

      {hasFile ? (
        <div className={`fe-file__chosen${found ? ' fe-file__chosen--invalid' : ''}`}>
          <p className="fe-file__chosen-title">{copy.selected}</p>
          <dl className="fe-file__details">
            <div>
              <dt className="fe-visually-hidden">{language === 'am' ? 'ስም' : 'Name'}</dt>
              <dd className="fe-file__name">{value.name}</dd>
            </div>
            <div>
              <dt className="fe-visually-hidden">{language === 'am' ? 'መጠን እና ዓይነት' : 'Size and type'}</dt>
              <dd className="fe-file__meta">
                {formatFileSize(value.size)}
                {value.type ? ` · ${value.type}` : ''}
              </dd>
            </div>
          </dl>
          <button type="button" className="fe-button fe-button--quiet" onClick={remove}>
            {copy.remove}
            <span className="fe-visually-hidden">: {value.name}</span>
          </button>
        </div>
      ) : null}

      {problem ? (
        <p className="fe-error" id={`${id}-problem`} role="alert">
          {problem}
        </p>
      ) : null}

      <p className="fe-visually-hidden" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
