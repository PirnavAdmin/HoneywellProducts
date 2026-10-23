
import {
  API_BASE_URL,
  DEFAULT_BACKEND_URL,
} from '../services/api';

export { DEFAULT_BACKEND_URL };

export const getApiDomain = () => API_BASE_URL;

const LIVE_MEDIA_BASE_URL = (
  import.meta.env.VITE_MEDIA_BASE_URL ||
  'https://honeywellproducts.com'
).replace(/\/+$/, '');

export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim().replace(/\\/g, '/');

  if (
    !trimmed ||
    trimmed.toLowerCase().includes('placeholder')
  ) {
    return '';
  }

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.includes('honeywell-products-logo.png')) {
    return '/honeywell-products-logo.png';
  }

  // In development, send absolute /uploads URLs through Vite's proxy.
  if (import.meta.env.DEV && /^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);

      if (parsed.pathname.includes('/uploads/')) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      // Preserve the original URL if it cannot be parsed.
    }
  }

  // Handle uploaded images.
  if (trimmed.includes('/uploads/')) {
    const uploadPath = trimmed.slice(trimmed.indexOf('/uploads/'));

    if (import.meta.env.DEV) {
      return uploadPath;
    }

    return `${LIVE_MEDIA_BASE_URL}${uploadPath}`;
  }

  // Preserve other absolute URLs.
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Frontend static assets.
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

  const cleanBase = (
    API_BASE_URL || DEFAULT_BACKEND_URL || ''
  ).replace(/\/+$/, '');

  return `${cleanBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};
