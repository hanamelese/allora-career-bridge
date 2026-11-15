import { MAX_UPLOAD_MB, UPLOAD_FILE_TYPES, UPLOAD_FILE_TYPE_KEYS, resolveUploadRules } from '@onboarding/contracts';
import { Checkbox } from '../ui/Checkbox.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import { describeUploadRules } from '../../fieldDisplay.js';
import { useLanguage, useT } from '../../i18n/index.js';

/**
 * The restrictions on an upload question: the largest file, and which
 * kinds of file. Both are optional - a blank size means the most allowed
 * (25 MB) - and the sentence above the controls always says exactly what
 * applicants will see.
 */
export function UploadRulesEditor({ idPrefix, settings, onChange }) {
  const t = useT();
  const language = useLanguage();
  const rules = resolveUploadRules(settings);

  function setSize(raw) {
    const trimmed = raw.trim();
    const next = { ...(settings ?? {}) };

    if (trimmed === '') delete next.maxSizeMb;
    else next.maxSizeMb = Number(trimmed);

    onChange(Object.keys(next).length ? next : {});
  }

  function setKind(key, checked) {
    const accept = checked
      ? UPLOAD_FILE_TYPE_KEYS.filter((kind) => kind === key || rules.accept.includes(kind))
      : rules.accept.filter((kind) => kind !== key);

    onChange({ ...(settings ?? {}), accept });
  }

  return (
    <div className="upload-rules">
      <p className="upload-rules__summary" aria-live="polite">
        {describeUploadRules(settings, language)}
      </p>

      <TextInput
        id={`${idPrefix}-max-size`}
        label={t('configure.upload.maxSize')}
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_UPLOAD_MB}
        step={1}
        value={settings?.maxSizeMb === undefined ? '' : String(settings.maxSizeMb)}
        placeholder={String(MAX_UPLOAD_MB)}
        help={t('configure.upload.maxSizeHelp', MAX_UPLOAD_MB)}
        onChange={setSize}
      />

      <fieldset className="upload-rules__kinds">
        <legend className="upload-rules__legend">{t('configure.upload.kinds')}</legend>
        {UPLOAD_FILE_TYPE_KEYS.map((key) => {
          const isOnlyOne = rules.accept.length === 1 && rules.accept.includes(key);

          return (
            <Checkbox
              key={key}
              id={`${idPrefix}-kind-${key}`}
              label={UPLOAD_FILE_TYPES[key].label}
              description={isOnlyOne ? t('configure.upload.atLeastOne') : undefined}
              checked={rules.accept.includes(key)}
              disabled={isOnlyOne}
              onChange={(checked) => setKind(key, checked)}
            />
          );
        })}
      </fieldset>

      <p className="upload-rules__note">
        {t('configure.upload.note')}
      </p>
    </div>
  );
}
