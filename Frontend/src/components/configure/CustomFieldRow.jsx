import { EyeOff, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Checkbox } from '../ui/Checkbox.jsx';
import { Switch } from '../ui/Switch.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import { FieldOptionsEditor } from './FieldOptionsEditor.jsx';
import './FieldRow.css';

/** A question the partner added themselves. Removable, unlike a catalogue field. */
export function CustomFieldRow({ fieldConfig, error, onUpdate, onRemove }) {
  const idPrefix = `custom-${fieldConfig.key}`;

  function updateLabel(language, value) {
    const label = { ...fieldConfig.label };

    if (value.trim() === '') {
      delete label[language];
    } else {
      label[language] = value;
    }

    // English is the fallback for every other language.
    if (!label.en) label.en = fieldConfig.label.en;

    onUpdate({ label });
  }

  return (
    <li className="field-row">
      <div className="field-row__header">
        <div className="field-row__identity">
          <p className="field-row__label">{fieldConfig.label.en}</p>
          <p className="field-row__meta">
            <span className="text-mono">{fieldConfig.key}</span>
            <span aria-hidden="true"> · </span>
            <span>{fieldConfig.type}</span>
            <span aria-hidden="true"> · </span>
            <span>added by your organisation</span>
          </p>
        </div>

        <div className="field-row__badges">
          {fieldConfig.visibility === 'private' ? (
            <Badge tone="private" icon={EyeOff}>
              Private
            </Badge>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          label={`Remove the question "${fieldConfig.label.en}"`}
          onClick={onRemove}
        />
      </div>

      <div className="field-row__controls">
        <Switch
          id={`${idPrefix}-enabled`}
          label="Ask this question"
          checked={fieldConfig.enabled}
          onChange={(checked) =>
            onUpdate({ enabled: checked, ...(checked ? {} : { required: false }) })
          }
        />

        <Checkbox
          id={`${idPrefix}-required`}
          label="An answer is required"
          checked={fieldConfig.required}
          disabled={!fieldConfig.enabled}
          onChange={(checked) => onUpdate({ required: checked })}
        />
      </div>

      {error ? (
        <p className="field-row__error" role="alert">
          {error}
        </p>
      ) : null}

      <details className="field-row__details">
        <summary className="field-row__summary">Wording, privacy and options</summary>

        <div className="field-row__panel">
          <fieldset className="field-row__group">
            <legend className="field-row__legend">Question wording</legend>
            <div className="field-row__pair">
              <TextInput
                id={`${idPrefix}-label-en`}
                label="English"
                value={fieldConfig.label.en ?? ''}
                onChange={(value) => updateLabel('en', value)}
              />
              <TextInput
                id={`${idPrefix}-label-am`}
                label="Amharic"
                lang="am"
                value={fieldConfig.label.am ?? ''}
                placeholder="Falls back to English"
                onChange={(value) => updateLabel('am', value)}
              />
            </div>
          </fieldset>

          {fieldConfig.type === 'choice' ? (
            <fieldset className="field-row__group">
              <legend className="field-row__legend">Answer options</legend>
              <FieldOptionsEditor
                idPrefix={idPrefix}
                keyName="value"
                options={fieldConfig.options ?? []}
                onChange={(options) => onUpdate({ options })}
              />
            </fieldset>
          ) : null}

          <fieldset className="field-row__group">
            <legend className="field-row__legend">Privacy</legend>
            <Checkbox
              id={`${idPrefix}-private`}
              label="Keep answers to this question private"
              description="Private answers are left out of the data shared with your organisation and with employers."
              checked={fieldConfig.visibility === 'private'}
              onChange={(checked) => onUpdate({ visibility: checked ? 'private' : 'public' })}
            />
          </fieldset>
        </div>
      </details>
    </li>
  );
}
