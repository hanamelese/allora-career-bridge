import { EyeOff, Lock } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Checkbox } from '../ui/Checkbox.jsx';
import { Switch } from '../ui/Switch.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import { FieldOptionsEditor } from './FieldOptionsEditor.jsx';
import { UploadRulesEditor } from './UploadRulesEditor.jsx';
import { describeUploadRules } from '../../fieldDisplay.js';
import { useLanguage, useT } from '../../i18n/index.js';
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

export function FieldRow({ fieldConfig, field, lockReason, error, onUpdate }) {
  const t = useT();
  const language = useLanguage();
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
              {t('configure.field.private')}
            </Badge>
          ) : null}
          {fieldConfig.locked ? (
            <Badge tone="locked" icon={Lock}>
              {t('configure.field.alwaysOn')}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="field-row__controls">
        <Switch
          id={`${idPrefix}-enabled`}
          label={t('configure.field.ask')}
          checked={fieldConfig.enabled}
          disabled={fieldConfig.locked}
          lockedReason={fieldConfig.locked ? lockReason : null}
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

      {field.notice ? <p className="field-row__notice">{field.notice}</p> : null}

      {/* What applicants will be allowed to upload, always in view. */}
      {field.type === 'file' && fieldConfig.enabled ? (
        <p className="field-row__upload">{describeUploadRules(fieldConfig.upload ?? field.definition?.upload, language)}</p>
      ) : null}

      {error ? (
        <p className="field-row__error" role="alert">
          {error}
        </p>
      ) : null}

      {canEditWording ? (
        <details className="field-row__details">
          <summary className="field-row__summary">
            {field.type === 'file' ? t('configure.field.detailsFile') : t('configure.field.detailsVoice')}
          </summary>

          <div className="field-row__panel">
            <fieldset className="field-row__group">
              <legend className="field-row__legend">{t('configure.field.wording')}</legend>
              <div className="field-row__pair">
                <TextInput
                  id={`${idPrefix}-label-en`}
                  label={t('configure.field.english')}
                  value={fieldConfig.label?.en ?? ''}
                  placeholder={catalogLabel?.en}
                  help={t('configure.field.labelEnHelp')}
                  onChange={(value) =>
                    onUpdate({ label: patchOverride(fieldConfig.label, 'en', value, catalogLabel) })
                  }
                />
                <TextInput
                  id={`${idPrefix}-label-am`}
                  label={t('configure.field.amharic')}
                  lang="am"
                  value={fieldConfig.label?.am ?? ''}
                  placeholder={catalogLabel?.am}
                  help={t('configure.field.labelAmHelp')}
                  onChange={(value) =>
                    onUpdate({ label: patchOverride(fieldConfig.label, 'am', value, catalogLabel) })
                  }
                />
              </div>
            </fieldset>

            <fieldset className="field-row__group">
              <legend className="field-row__legend">{t('configure.field.helpText')}</legend>
              <div className="field-row__pair">
                <TextInput
                  id={`${idPrefix}-help-en`}
                  label={t('configure.field.english')}
                  multiline
                  value={fieldConfig.helpText?.en ?? ''}
                  placeholder={catalogHelp?.en ?? t('configure.field.helpPlaceholder')}
                  onChange={(value) =>
                    onUpdate({
                      helpText: patchOverride(fieldConfig.helpText, 'en', value, catalogHelp),
                    })
                  }
                />
                <TextInput
                  id={`${idPrefix}-help-am`}
                  label={t('configure.field.amharic')}
                  lang="am"
                  multiline
                  value={fieldConfig.helpText?.am ?? ''}
                  placeholder={catalogHelp?.am ?? t('configure.field.fallsBackToEnglish')}
                  onChange={(value) =>
                    onUpdate({
                      helpText: patchOverride(fieldConfig.helpText, 'am', value, catalogHelp),
                    })
                  }
                />
              </div>
            </fieldset>

            {field.type === 'file' ? (
              <fieldset className="field-row__group">
                <legend className="field-row__legend">{t('configure.field.uploadRestrictions')}</legend>
                <UploadRulesEditor
                  idPrefix={idPrefix}
                  settings={fieldConfig.upload ?? field.definition?.upload}
                  onChange={(upload) => onUpdate({ upload })}
                />
              </fieldset>
            ) : null}

            {field.optionsEditable ? (
              <fieldset className="field-row__group">
                <legend className="field-row__legend">{t('configure.field.answerOptions')}</legend>
                <FieldOptionsEditor
                  idPrefix={idPrefix}
                  options={field.options}
                  onChange={(options) => onUpdate({ options })}
                />
              </fieldset>
            ) : null}

            <fieldset className="field-row__group">
              <legend className="field-row__legend">{t('configure.field.privacyAndVoice')}</legend>

              {field.isPrivateByCatalog ? (
                <p className="field-row__fixed">
                  {t('configure.field.alwaysPrivate')}
                </p>
              ) : (
                <Checkbox
                  id={`${idPrefix}-private`}
                  label={t('configure.field.keepPrivate')}
                  description={t('configure.field.keepPrivateDescription')}
                  checked={fieldConfig.visibility === 'private'}
                  onChange={(checked) =>
                    onUpdate({ visibility: checked ? 'private' : 'public' })
                  }
                />
              )}

              {field.supportsVoice ? (
                <p className="field-row__fixed">
                  {t('configure.field.voiceAlways')}
                </p>
              ) : (
                <p className="field-row__fixed">
                  {t('configure.field.voiceNever')}
                </p>
              )}
            </fieldset>
          </div>
        </details>
      ) : null}
    </li>
  );
}
