import { fieldCatalog, getCatalogItems } from '@onboarding/contracts';
import { getIcon } from './icons.js';

/**
 * Resolving what a question actually says.
 *
 * A partner's override wins over the catalogue, and English is the
 * fallback for a language the override does not cover - so an override
 * can never leave a question blank.
 */
export function resolveText(override, fallback, language = 'en') {
  return (
    override?.[language] ?? fallback?.[language] ?? override?.en ?? fallback?.en ?? ''
  );
}

/**
 * Everything the dashboard needs to describe one configured field,
 * whether it is a catalogue field or a partner's custom one.
 */
export function describeField(fieldConfig, { language = 'en', isCustom = false } = {}) {
  const definition = isCustom ? null : fieldCatalog[fieldConfig.key];

  const options = isCustom
    ? fieldConfig.options ?? []
    : fieldConfig.options ?? definition?.options ?? [];

  return {
    key: fieldConfig.key,
    isCustom,
    definition,
    type: definition?.type ?? fieldConfig.type ?? 'text',
    label: resolveText(fieldConfig.label, definition?.label, language),
    helpText: resolveText(fieldConfig.helpText, definition?.helpText, language) || null,
    notice: definition?.notice ? resolveText(null, definition.notice, language) : null,
    icon: definition?.icon ?? null,
    Icon: getIcon(definition?.icon),
    options,
    catalogOptions: definition?.options ?? [],
    optionsEditable: definition?.optionsEditable === true,
    catalogOptionItems: definition?.optionsFrom ? getCatalogItems(definition.optionsFrom) : [],
    /* Private either because the catalogue says so, or because the partner
       chose to keep this answer private. */
    isPrivate: fieldConfig.visibility === 'private' || definition?.private === true,
    isPrivateByCatalog: definition?.private === true,
    supportsVoice: isCustom ? true : definition?.voiceInput !== false,
  };
}
