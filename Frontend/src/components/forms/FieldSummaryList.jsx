import { Lock, EyeOff } from 'lucide-react';
import { fieldCatalog } from '@onboarding/contracts';
import { Badge } from '../ui/Badge.jsx';
import './FieldSummaryList.css';

/**
 * What a form currently asks for, read only.
 *
 * Labels come from the shared field catalog rather than being retyped
 * here, so this list and the learner-facing form can never disagree.
 */
function describeField(fieldConfig) {
  const definition = fieldCatalog[fieldConfig.key];

  return {
    key: fieldConfig.key,
    label: definition?.label?.en ?? fieldConfig.label?.en ?? fieldConfig.key,
    labelAm: definition?.label?.am ?? fieldConfig.label?.am ?? null,
    type: definition?.type ?? fieldConfig.type ?? 'text',
    isPrivate: fieldConfig.visibility === 'private' || definition?.private === true,
  };
}

export function FieldSummaryList({ fields }) {
  const enabledFields = fields.filter((field) => field.enabled);

  return (
    <ul className="field-summary" role="list">
      {enabledFields.map((fieldConfig) => {
        const field = describeField(fieldConfig);

        return (
          <li className="field-summary__item" key={field.key}>
            <div className="field-summary__main">
              <p className="field-summary__label">
                {field.label}
                {field.labelAm ? (
                  <span className="field-summary__label-am" lang="am">
                    {field.labelAm}
                  </span>
                ) : null}
              </p>
              <p className="field-summary__meta">
                <span className="text-mono">{field.key}</span>
                <span aria-hidden="true"> · </span>
                <span>{field.type}</span>
              </p>
            </div>

            <div className="field-summary__badges">
              <Badge tone="neutral">{fieldConfig.required ? 'Required' : 'Optional'}</Badge>
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
          </li>
        );
      })}
    </ul>
  );
}
