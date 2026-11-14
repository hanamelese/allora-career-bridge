import { Select } from '../ui/Select.jsx';
import './LanguageSettings.css';

/**
 * Which language the form opens in.
 *
 * This used to sit beside switches for voice answers, read-aloud and
 * simple words. Those are no longer settings: every form has them, so a
 * partner can never publish a form without them.
 */
export function LanguageSettings({ defaultLanguage, onDefaultLanguageChange }) {
  return (
    <div className="language-settings">
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
  );
}
