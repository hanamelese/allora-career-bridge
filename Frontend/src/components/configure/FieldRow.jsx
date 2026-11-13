import { EyeOff, Lock } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Checkbox } from '../ui/Checkbox.jsx';
import { Switch } from '../ui/Switch.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import { FieldOptionsEditor } from './FieldOptionsEditor.jsx';
import './FieldRow.css';

/**
 * One question's settings.
 *
 * A locked question is shown switched on and disabled, with the reason
 * next to it, rather than hidden - a partner should be able to see that it
 * is on and read why it cannot be removed.
 *
 * The wording editors sit inside a native <details>, so the row stays
 * scannable while every control remains reachable by keyboard without any
 * custom disclosure logic.
 */

/**
 * Apply one language of a label or help-text override.
 *
 * Returns `undefined` when the override is empty, which removes it and
 * falls back to the catalogue. English is kept whenever Amharic is set,
 * because English is the fallback for every other language.
 */
function patchOverride(current, language, value, catalogText) {
  const next = { ...(current ?? {}) };

  if (value.trim() === '') {
    delete next[language];
  } else {
    next[language] = value;
  }

  if (next.am && !next.en) {
    next.en = catalogText?.en ?? '';
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

export function FieldRow({ fieldConfig, field, lockReason, error, voiceAvailable, onUpdate }) {
  const idPrefix = `field-${fieldConfig.key}`;
  const catalogLabel = field.definition?.label;
  const catalogHelp = field.definition?.helpText;

  const canEditWording = fieldConfig.enabled;

  return (
    <li className="field-row">
      <div className="field-row__header">
        <span className="field-row__icon" aria-hidden="true">
          <field.Icon />
        </span>

        <div className="field-row__identity">
          <p className="field-row__label">{field.label}</p>
          <p className="field-row__meta">
            <span className="text-mono">{fieldConfig.key}</span>
            <span aria-hidden="true"> · </span>
            <span>{field.type}</span>
          </p>
        </div>

        <div className="field-row__badges">
          {field.isPrivate ? (
            <Badge tone="private" icon={EyeOff}>
              Private
            </Badge>
          ) : null}
          {fieldConfig.locked ? (
            <Badge tone="locked" icon={Lock}>
              Always on
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="field-row__controls">
        <Switch
          id={`${idPrefix}-enabled`}
          label="Ask this question"
          checked={fieldConfig.enabled}
          disabled={fieldConfig.locked}
          lockedReason={fieldConfig.locked ? lockReason : null}
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

      {field.notice ? <p className="field-row__notice">{field.notice}</p> : null}

      {error ? (
        <p className="field-row__error" role="alert">
          {error}
        </p>
      ) : null}

      {canEditWording ? (
        <details className="field-row__details">
          <summary className="field-row__summary">Wording, privacy and voice</summary>

          <div className="field-row__panel">
            <fieldset className="field-row__group">
              <legend className="field-row__legend">Question wording</legend>
              <div className="field-row__pair">
                <TextInput
                  id={`${idPrefix}-label-en`}
                  label="English"
                  value={fieldConfig.label?.en ?? ''}
                  placeholder={catalogLabel?.en}
                  help="Leave blank to use the standard wording."
                  onChange={(value) =>
                    onUpdate({ label: patchOverride(fieldConfig.label, 'en', value, catalogLabel) })
                  }
                />
                <TextInput
                  id={`${idPrefix}-label-am`}
                  label="Amharic"
                  lang="am"
                  value={fieldConfig.label?.am ?? ''}
                  placeholder={catalogLabel?.am}
                  help="Leave blank to use the reviewed Amharic translation."
                  onChange={(value) =>
                    onUpdate({ label: patchOverride(fieldConfig.label, 'am', value, catalogLabel) })
                  }
                />
              </div>
            </fieldset>

            <fieldset className="field-row__group">
              <legend className="field-row__legend">Help text</legend>
              <div className="field-row__pair">
                <TextInput
                  id={`${idPrefix}-help-en`}
                  label="English"
                  multiline
                  value={fieldConfig.helpText?.en ?? ''}
                  placeholder={catalogHelp?.en ?? 'Optional guidance shown under the question'}
                  onChange={(value) =>
                    onUpdate({
                      helpText: patchOverride(fieldConfig.helpText, 'en', value, catalogHelp),
                    })
                  }
                />
                <TextInput
                  id={`${idPrefix}-help-am`}
                  label="Amharic"
                  lang="am"
                  multiline
                  value={fieldConfig.helpText?.am ?? ''}
                  placeholder={catalogHelp?.am ?? 'Falls back to English'}
                  onChange={(value) =>
                    onUpdate({
                      helpText: patchOverride(fieldConfig.helpText, 'am', value, catalogHelp),
                    })
                  }
                />
              </div>
            </fieldset>

            {field.optionsEditable ? (
              <fieldset className="field-row__group">
                <legend className="field-row__legend">Answer options</legend>
                <FieldOptionsEditor
                  idPrefix={idPrefix}
                  options={field.options}
                  onChange={(options) => onUpdate({ options })}
                />
              </fieldset>
            ) : null}

            <fieldset className="field-row__group">
              <legend className="field-row__legend">Privacy and voice</legend>

              {field.isPrivateByCatalog ? (
                <p className="field-row__fixed">
                  Answers to this question are always private. They are never included in the
                  answers shared with your organisation or with an employer.
                </p>
              ) : (
                <Checkbox
                  id={`${idPrefix}-private`}
                  label="Keep answers to this question private"
                  description="Private answers are left out of the data shared with your organisation and with employers."
                  checked={fieldConfig.visibility === 'private'}
                  onChange={(checked) =>
                    onUpdate({ visibility: checked ? 'private' : 'public' })
                  }
                />
              )}

              {field.supportsVoice && voiceAvailable ? (
                <Checkbox
                  id={`${idPrefix}-voice`}
                  label="Allow a spoken answer to this question"
                  description="Learners can still type. Voice never submits an answer on its own."
                  checked={fieldConfig.voiceInput !== false}
                  onChange={(checked) => onUpdate({ voiceInput: checked ? undefined : false })}
                />
              ) : null}

              {!field.supportsVoice ? (
                <p className="field-row__fixed">
                  This question cannot be answered by voice, so voice input is not offered for it.
                </p>
              ) : null}
            </fieldset>
          </div>
        </details>
      ) : null}
    </li>
  );
}
