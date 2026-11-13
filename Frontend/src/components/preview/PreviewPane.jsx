import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { FormRenderer } from '@onboarding/form-engine/react';
import { Button } from '../ui/Button.jsx';
import { Switch } from '../ui/Switch.jsx';
import { Select } from '../ui/Select.jsx';
import { getIcon } from '../../icons.js';
import './PreviewPane.css';

/**
 * The live preview.
 *
 * It mounts the same `FormRenderer` the embedded form will use, driven by
 * the draft configuration being edited - so this is the learner experience
 * itself, not a drawing of it. Every change in the Configure view shows up
 * here immediately.
 */

/* The engine names icons as strings so it needs no icon library of its
   own; the dashboard supplies the components. */
function renderIcon(name) {
  const Icon = getIcon(name);
  return <Icon />;
}

export function PreviewPane({ config }) {
  const [language, setLanguage] = useState(config.defaultLanguage);
  const [lowLiteracy, setLowLiteracy] = useState(config.features.lowLiteracy);
  const [runId, setRunId] = useState(0);

  const isVariant = lowLiteracy !== config.features.lowLiteracy;

  return (
    <div className="preview-pane">
      <div className="preview-pane__controls">
        <Select
          id="preview-language"
          label="Preview in"
          value={language}
          onChange={setLanguage}
          options={config.languages.map((code) => ({
            value: code,
            label: code === 'am' ? 'Amharic (አማርኛ)' : 'English',
          }))}
        />

        <Switch
          id="preview-low-literacy"
          label="Simple words and icons"
          checked={lowLiteracy}
          onChange={setLowLiteracy}
        />

        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={() => setRunId((current) => current + 1)}
        >
          Start again
        </Button>
      </div>

      {isVariant ? (
        <p className="preview-pane__variant" role="status">
          You are previewing simple words and icons, which is currently switched{' '}
          {config.features.lowLiteracy ? 'on' : 'off'} for learners in the Configure view.
        </p>
      ) : null}

      <div className="preview-pane__frame">
        <FormRenderer
          /* A new run remounts the renderer, which is how "start again"
             clears the answers without the engine needing a reset API. */
          key={`${runId}-${language}-${lowLiteracy}`}
          config={config}
          settings={{
            language,
            lowLiteracy,
            readAloud: config.features.readAloud,
            voiceInput: config.features.voiceInput,
          }}
          renderIcon={renderIcon}
        />
      </div>
    </div>
  );
}
