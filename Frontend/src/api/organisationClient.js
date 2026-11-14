import { apiFetch } from './http.js';

/**
 * The signed-in partner's organisation settings.
 *
 *   listReferralPartners()          GET    /api/v1/organisation/referral-partners
 *   addReferralPartner(details)     POST   /api/v1/organisation/referral-partners
 *   updateReferralPartner(id, d)    PUT    /api/v1/organisation/referral-partners/:id
 *   removeReferralPartner(id)       DELETE /api/v1/organisation/referral-partners/:id
 */

const BASE = '/organisation/referral-partners';

export function listReferralPartners() {
  return apiFetch(BASE);
}

export function addReferralPartner(details) {
  return apiFetch(BASE, { method: 'POST', body: details });
}

export function updateReferralPartner(id, details) {
  return apiFetch(`${BASE}/${encodeURIComponent(id)}`, { method: 'PUT', body: details });
}

export function removeReferralPartner(id) {
  return apiFetch(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/*
 *   listAllowedOrigins()     GET    /api/v1/organisation/allowed-origins
 *   addAllowedOrigin(origin) POST   /api/v1/organisation/allowed-origins
 *   removeAllowedOrigin(id)  DELETE /api/v1/organisation/allowed-origins/:id
 */
const ORIGINS = '/organisation/allowed-origins';

export function listAllowedOrigins() {
  return apiFetch(ORIGINS);
}

export function addAllowedOrigin(origin) {
  return apiFetch(ORIGINS, { method: 'POST', body: { origin } });
}

export function removeAllowedOrigin(id) {
  return apiFetch(`${ORIGINS}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
