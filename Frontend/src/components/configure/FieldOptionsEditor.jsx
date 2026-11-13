import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import './FieldOptionsEditor.css';

/**
 * The answer options a learner may choose from.
 *
 * Existing keys are shown but never edited: an answer already given refers
 * to its key, so changing one would quietly change what a past answer
 * means. Wording can always be changed; keys cannot.
 *
 * `keyName` is 'key' for a built-in field's options and 'value' for a
 * custom field's, which is how the shared schema names them.
 */
export function FieldOptionsEditor({ idPrefix, options, onChange, keyName = 'key' }) {
  function updateOption(index, patch) {
    onChange(options.map((option, position) => (position === index ? { ...option, ...patch } : option)));
  }

  function updateLabel(index, language, value) {
    const option = options[index];
    const label = { ...option.label };

    if (value.trim() === '') {
      delete label[language];
    } else {
      label[language] = value;
    }

    // English is the fallback for every other language, so it must stay.
    if (!label.en) label.en = option.label.en;

    updateOption(index, { label });
  }

  function addOption() {
    const taken = new Set(options.map((option) => option[keyName]));
    let suffix = options.length + 1;
    while (taken.has(`option_${suffix}`)) suffix += 1;

    onChange([...options, { [keyName]: `option_${suffix}`, label: { en: 'New option' } }]);
  }

  function removeOption(index) {
    onChange(options.filter((_, position) => position !== index));
  }

  return (
    <div className="options-editor">
      <ul className="options-editor__list" role="list">
        {options.map((option, index) => (
          <li className="options-editor__item" key={option[keyName]}>
            <p className="options-editor__key text-mono">{option[keyName]}</p>

            <div className="options-editor__labels">
              <TextInput
                id={`${idPrefix}-option-${option[keyName]}-en`}
                label="English"
                value={option.label.en ?? ''}
                onChange={(value) => updateLabel(index, 'en', value)}
              />
              <TextInput
                id={`${idPrefix}-option-${option[keyName]}-am`}
                label="Amharic"
                lang="am"
                value={option.label.am ?? ''}
                placeholder="Falls back to English"
                onChange={(value) => updateLabel(index, 'am', value)}
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              label={`Remove the option "${option.label.en ?? option[keyName]}"`}
              disabled={options.length <= 1}
              onClick={() => removeOption(index)}
            />
          </li>
        ))}
      </ul>

      <Button variant="secondary" size="sm" icon={Plus} onClick={addOption}>
        Add an option
      </Button>
    </div>
  );
}
