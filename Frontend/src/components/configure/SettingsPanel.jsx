import { describeField } from '../../fieldDisplay.js';
import { hasTranslation, useLanguage, useT } from '../../i18n/index.js';
import { FieldRow } from './FieldRow.jsx';
import './SettingsPanel.css';

/**
 * The list of questions in a form, each with its settings.
 *
 * Order follows the configuration, which is the order a learner meets the
 * questions in.
 */
export function SettingsPanel({
  config,
  fields = config.fields,
  fieldErrors,
  formTypeId,
  lockReasons,
  onUpdateField,
}) {
  const t = useT();
  const language = useLanguage();

  /* The contract's English reason, unless this language has its own. */
  function lockReasonFor(fieldKey) {
    const key = `configure.lockReasons.${formTypeId}.${fieldKey}`;
    return formTypeId && hasTranslation(language, key) ? t(key) : lockReasons?.[fieldKey];
  }

  return (
    <ul className="settings-panel" role="list">
      {fields.map((fieldConfig) => (
        <FieldRow
          key={fieldConfig.key}
          fieldConfig={fieldConfig}
          field={describeField(fieldConfig, { language })}
          lockReason={lockReasonFor(fieldConfig.key)}
          error={fieldErrors[fieldConfig.key]}
          onUpdate={(patch) => onUpdateField(fieldConfig.key, patch)}
        />
      ))}
    </ul>
  );
}
