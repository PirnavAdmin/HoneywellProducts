import { API_BASE_URL, DEFAULT_BACKEND_URL } from '../services/api';

export { DEFAULT_BACKEND_URL };

// Compatibility adapter for the supplied Admin Module.
// Uses relative base in dev mode to route through Vite server proxy and eliminate CORS preflight blocks and ngrok warnings.
export const getApiDomain = () => API_BASE_URL;

/**
 * Universal media/image URL resolver:
 * 1. Handles data: and blob: URLs
 * 2. Extracts any /uploads/... path and prefixes it with the correct API_BASE_URL
 *    (in Dev mode: relative '/uploads/...' to pass through Vite proxy and bypass ngrok warning;
 *     in Prod mode: full domain if configured)
 * 3. Handles default / placeholder fallbacks
 */
export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim().replace(/\\/g, '/');
  if (!trimmed || trimmed.toLowerCase().includes('placeholder')) return '';
  if (trimmed.includes('honeywell-products-logo.png')) return '/honeywell-products-logo.png';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const cleanBase = (API_BASE_URL || '').replace(/\/$/, '');

  if (trimmed.includes('/uploads/')) {
    const uploadPath = trimmed.slice(trimmed.indexOf('/uploads/'));
    return `${cleanBase}${uploadPath}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('assets/') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('images/') ||
    trimmed.startsWith('/favicon') ||
    trimmed.startsWith('/admin-')
  ) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  return `${cleanBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};
