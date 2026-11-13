import { Mic, Volume2, Shapes } from 'lucide-react';
import { Switch } from '../ui/Switch.jsx';
import { Select } from '../ui/Select.jsx';
import './FeatureToggles.css';

/**
 * How learners can read and answer this form.
 *
 * These are form-level switches. A question can still opt out of voice
 * individually, but it can never opt in when voice is off here.
 */
const FEATURES = [
  {
    name: 'voiceInput',
    icon: Mic,
    label: 'Spoken answers',
    description:
      'Learners can answer by speaking, review what was heard, and correct it before moving on. Typing always stays available.',
  },
  {
    name: 'readAloud',
    icon: Volume2,
    label: 'Read questions aloud',
    description: 'Each question can be played as speech, along with a summary before submitting.',
  },
  {
    name: 'lowLiteracy',
    icon: Shapes,
    label: 'Simple words and icons',
    description:
      'Shows the shorter, plainer version of every question with a supporting icon and larger touch targets.',
  },
];

export function FeatureToggles({ features, defaultLanguage, onFeatureChange, onDefaultLanguageChange }) {
  return (
    <div className="feature-toggles">
      <ul className="feature-toggles__list" role="list">
        {FEATURES.map((feature) => (
          <li className="feature-toggles__item" key={feature.name}>
            <span className="feature-toggles__icon" aria-hidden="true">
              <feature.icon />
            </span>
            <Switch
              id={`feature-${feature.name}`}
              label={feature.label}
              description={feature.description}
              checked={features[feature.name]}
              onChange={(checked) => onFeatureChange(feature.name, checked)}
            />
          </li>
        ))}
      </ul>

      <div className="feature-toggles__language">
        <Select
          id="default-language"
          label="Language the form opens in"
          value={defaultLanguage}
          onChange={onDefaultLanguageChange}
          options={[
            { value: 'en', label: 'English' },
            { value: 'am', label: 'Amharic (አማርኛ)' },
          ]}
          help="Learners can switch language at any point while filling the form in."
        />
      </div>
    </div>
  );
}
