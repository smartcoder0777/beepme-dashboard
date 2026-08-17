/**
 * Dashboard API / asset URL config.
 * Local: leave unset — Vite proxies /api and /uploads (see vite.config.js).
 * Railway: set VITE_API_BASE_URL at build time to the production backend, e.g.
 *   VITE_API_BASE_URL=https://trackerbackend-production-875d.up.railway.app/api
 * Optional: VITE_ASSET_BASE_URL=https://trackerbackend-production-875d.up.railway.app
 * (defaults to API host without /api for /uploads/... document links)
 */

const rawApi = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
export const API_BASE_URL = rawApi.replace(/\/$/, '') || '/api';

export function getAssetBaseUrl() {
  const explicit = (import.meta.env.VITE_ASSET_BASE_URL || '').trim().replace(/\/$/, '');
  if (explicit) return explicit;
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return API_BASE_URL.replace(/\/api\/?$/, '');
  }
  return '';
}

/** Local Railway /uploads paths are ephemeral and typically 404 after deploy. */
export function isEphemeralUploadUrl(path) {
  if (!path || typeof path !== 'string') return false;
  return path.startsWith('/uploads/') || path.includes('/uploads/');
}

/** Resolve backend asset paths (e.g. /uploads/...) for <a href> / <img>. */
export function resolveAssetUrl(path) {
  if (!path) return '#';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = getAssetBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}
