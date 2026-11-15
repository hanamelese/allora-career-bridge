import { EyeOff, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Checkbox } from '../ui/Checkbox.jsx';
import { Switch } from '../ui/Switch.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import { FieldOptionsEditor } from './FieldOptionsEditor.jsx';
import { resolveText } from '../../fieldDisplay.js';
import { useLanguage, useT } from '../../i18n/index.js';
import './FieldRow.css';

/** A question the partner added themselves. Removable, unlike a catalogue field. */
export function CustomFieldRow({ fieldConfig, error, onUpdate, onRemove }) {
  const t = useT();
  const language = useLanguage();
  const idPrefix = `custom-${fieldConfig.key}`;
  const displayLabel = resolveText(fieldConfig.label, null, language);

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
          <p className="field-row__label">{displayLabel}</p>
          <p className="field-row__meta">
            <span className="text-mono">{fieldConfig.key}</span>
            <span aria-hidden="true"> · </span>
            <span>{fieldConfig.type}</span>
            <span aria-hidden="true"> · </span>
            <span>{t('configure.field.addedByYou')}</span>
          </p>
        </div>

        <div className="field-row__badges">
          {fieldConfig.visibility === 'private' ? (
            <Badge tone="private" icon={EyeOff}>
              {t('configure.field.private')}
            </Badge>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          label={t('configure.field.removeQuestion', displayLabel)}
          onClick={onRemove}
        />
      </div>

      <div className="field-row__controls">
        <Switch
          id={`${idPrefix}-enabled`}
          label={t('configure.field.ask')}
          checked={fieldConfig.enabled}
          onChange={(checked) =>
            onUpdate({ enabled: checked, ...(checked ? {} : { required: false }) })
          }
        />

        <Checkbox
          id={`${idPrefix}-required`}
          label={t('configure.field.required')}
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
        <summary className="field-row__summary">{t('configure.field.detailsCustom')}</summary>

        <div className="field-row__panel">
          <fieldset className="field-row__group">
            <legend className="field-row__legend">{t('configure.field.wording')}</legend>
            <div className="field-row__pair">
              <TextInput
                id={`${idPrefix}-label-en`}
                label={t('configure.field.english')}
                value={fieldConfig.label.en ?? ''}
                onChange={(value) => updateLabel('en', value)}
              />
              <TextInput
                id={`${idPrefix}-label-am`}
                label={t('configure.field.amharic')}
                lang="am"
                value={fieldConfig.label.am ?? ''}
                placeholder={t('configure.field.fallsBackToEnglish')}
                onChange={(value) => updateLabel('am', value)}
              />
            </div>
          </fieldset>

          {fieldConfig.type === 'choice' ? (
            <fieldset className="field-row__group">
              <legend className="field-row__legend">{t('configure.field.answerOptions')}</legend>
              <FieldOptionsEditor
                idPrefix={idPrefix}
                keyName="value"
                options={fieldConfig.options ?? []}
                onChange={(options) => onUpdate({ options })}
              />
            </fieldset>
          ) : null}

          <fieldset className="field-row__group">
            <legend className="field-row__legend">{t('configure.field.privacy')}</legend>
            <Checkbox
              id={`${idPrefix}-private`}
              label={t('configure.field.keepPrivate')}
              description={t('configure.field.keepPrivateDescription')}
              checked={fieldConfig.visibility === 'private'}
              onChange={(checked) => onUpdate({ visibility: checked ? 'private' : 'public' })}
            />
          </fieldset>
        </div>
      </details>
    </li>
  );
}
