import { Select } from '../ui/Select.jsx';
import { useT } from '../../i18n/index.js';
import './LanguageSettings.css';

/**
 * Which language the form opens in.
 *
 * This used to sit beside switches for voice answers, read-aloud and
 * simple words. Those are no longer settings: every form has them, so a
 * partner can never publish a form without them.
 */
export function LanguageSettings({ defaultLanguage, onDefaultLanguageChange }) {
  const t = useT();

  return (
    <div className="language-settings">
      <Select
        id="default-language"
        label={t('configure.language.label')}
        value={defaultLanguage}
        onChange={onDefaultLanguageChange}
        options={[
          { value: 'en', label: t('configure.language.english') },
          { value: 'am', label: t('configure.language.amharic') },
        ]}
        help={t('configure.language.help')}
      />
    </div>
  );
}
