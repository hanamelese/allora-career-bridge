import { describeField } from '../../fieldDisplay.js';
import { FieldRow } from './FieldRow.jsx';
import './SettingsPanel.css';

/**
 * The list of questions in a form, each with its settings.
 *
 * Order follows the configuration, which is the order a learner meets the
 * questions in.
 */
export function SettingsPanel({ config, fieldErrors, lockReasons, onUpdateField }) {
  return (
    <ul className="settings-panel" role="list">
      {config.fields.map((fieldConfig) => (
        <FieldRow
          key={fieldConfig.key}
          fieldConfig={fieldConfig}
          field={describeField(fieldConfig)}
          lockReason={lockReasons?.[fieldConfig.key]}
          error={fieldErrors[fieldConfig.key]}
          voiceAvailable={config.features.voiceInput}
          onUpdate={(patch) => onUpdateField(fieldConfig.key, patch)}
        />
      ))}
    </ul>
  );
}
