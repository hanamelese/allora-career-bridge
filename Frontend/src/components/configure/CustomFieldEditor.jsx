import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CUSTOM_FIELD_TYPES, FIELD_KEYS } from '@onboarding/contracts';
import { Button } from '../ui/Button.jsx';
import { Checkbox } from '../ui/Checkbox.jsx';
import { Select } from '../ui/Select.jsx';
import { TextInput } from '../ui/TextInput.jsx';
import { slugify, uniqueKey } from '../../keys.js';
import './CustomFieldEditor.css';

/**
 * Add a question of your own.
 *
 * Only the three safe types the shared schema allows are offered - text, a
 * choice from a list, and yes/no - so a partner cannot introduce a field
 * type that the Form Engine would have to interpret.
 *
 * This is a real <form>, so Enter submits and the browser's own validation
 * applies before ours does.
 */
const TYPE_LABELS = {
  text: 'Short written answer',
  choice: 'Choose one from a list',
  yesNo: 'Yes or no',
};

export function CustomFieldEditor({ existingKeys, onAdd }) {
  const [labelEn, setLabelEn] = useState('');
  const [labelAm, setLabelAm] = useState('');
  const [type, setType] = useState('text');
  const [optionsText, setOptionsText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [error, setError] = useState(null);

  function reset() {
    setLabelEn('');
    setLabelAm('');
    setType('text');
    setOptionsText('');
    setIsPrivate(false);
    setIsRequired(false);
    setError(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = labelEn.trim();

    if (!trimmed) {
      setError('Write the question in English first. Amharic is optional.');
      return;
    }

    if (!slugify(trimmed)) {
      setError('Use at least one letter or number in the English question.');
      return;
    }

    const optionLabels = optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (type === 'choice' && optionLabels.length === 0) {
      setError('A question with a list of answers needs at least one option.');
      return;
    }

    /* Keys must not collide with a catalogue field or another custom one,
       because they become property names on the submitted answers. */
    const taken = [...FIELD_KEYS, ...existingKeys];
    const key = uniqueKey(trimmed, taken, 'question');

    const options = [];
    for (const label of optionLabels) {
      const value = uniqueKey(label, options.map((option) => option.value), 'option');
      options.push({ value, label: { en: label } });
    }

    onAdd({
      key,
      type,
      label: { en: trimmed, ...(labelAm.trim() ? { am: labelAm.trim() } : {}) },
      enabled: true,
      required: isRequired,
      visibility: isPrivate ? 'private' : 'public',
      ...(type === 'choice' ? { options } : {}),
    });

    reset();
  }

  return (
    <form className="custom-field-editor" onSubmit={handleSubmit}>
      <div className="custom-field-editor__row">
        <TextInput
          id="custom-label-en"
          label="Question in English"
          value={labelEn}
          onChange={setLabelEn}
          placeholder="For example: Preferred contact time"
          required
        />
        <TextInput
          id="custom-label-am"
          label="Question in Amharic (optional)"
          lang="am"
          value={labelAm}
          onChange={setLabelAm}
          help="Left blank, learners reading in Amharic see the English wording."
        />
      </div>

      <div className="custom-field-editor__row">
        <Select
          id="custom-type"
          label="Kind of answer"
          value={type}
          onChange={setType}
          options={CUSTOM_FIELD_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] }))}
        />

        {type === 'choice' ? (
          <TextInput
            id="custom-options"
            label="Answer options"
            multiline
            rows={3}
            value={optionsText}
            onChange={setOptionsText}
            help="One option per line."
          />
        ) : null}
      </div>

      <div className="custom-field-editor__checks">
        <Checkbox
          id="custom-required"
          label="An answer is required"
          checked={isRequired}
          onChange={setIsRequired}
        />
        <Checkbox
          id="custom-private"
          label="Keep answers private"
          checked={isPrivate}
          onChange={setIsPrivate}
        />
      </div>

      {error ? (
        <p className="custom-field-editor__error" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <Button type="submit" variant="primary" icon={Plus}>
          Add this question
        </Button>
      </div>
    </form>
  );
}
