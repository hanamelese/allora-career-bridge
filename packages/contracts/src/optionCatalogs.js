// packages/contracts/src/optionCatalogs.js
//
// One place to look up the option list a multi-choice question draws from.
// A field declares `optionsFrom: 'supportCatalog'` and the validator and
// the Form Engine both resolve it here, so adding a catalogue never means
// editing the validator.

import { supportCatalog, SUPPORT_KEYS } from './supportCatalog.js';
import {
  workplaceAccommodations,
  WORKPLACE_ACCOMMODATION_KEYS,
  interviewAccommodations,
  INTERVIEW_ACCOMMODATION_KEYS,
} from './accommodationCatalog.js';

export const optionCatalogs = {
  supportCatalog: { items: supportCatalog, keys: SUPPORT_KEYS },
  workplaceAccommodations: {
    items: workplaceAccommodations,
    keys: WORKPLACE_ACCOMMODATION_KEYS,
  },
  interviewAccommodations: {
    items: interviewAccommodations,
    keys: INTERVIEW_ACCOMMODATION_KEYS,
  },
};

export const OPTION_CATALOG_NAMES = Object.keys(optionCatalogs);

export function getCatalogItems(name) {
  return optionCatalogs[name]?.items ?? [];
}

export function getCatalogKeys(name) {
  return optionCatalogs[name]?.keys ?? [];
}
