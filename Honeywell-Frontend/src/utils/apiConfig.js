
import {
  API_BASE_URL,
  DEFAULT_BACKEND_URL,
} from '../services/api';

export { DEFAULT_BACKEND_URL };

export const getApiDomain = () => API_BASE_URL;

const LIVE_MEDIA_BASE_URL = (
  import.meta.env.VITE_MEDIA_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://honeywellproducts.com'
).replace(/\/+$/, '');

export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let trimmed = url.trim().replace(/\\/g, '/');

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

  // Automatically upgrade insecure http://honeywellproducts.com to https:// to prevent mixed-content blocking
  if (/^http:\/\/honeywellproducts\.com/i.test(trimmed)) {
    trimmed = trimmed.replace(/^http:\/\//i, 'https://');
  }

  // In development, send absolute /uploads URLs through Vite's proxy.
  if (import.meta.env.DEV && /^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);

      if (parsed.pathname.includes('/uploads/')) {
        let uploadPath = parsed.pathname;
        try {
          uploadPath = encodeURI(decodeURI(uploadPath));
        } catch {}
        return `${uploadPath}${parsed.search}${parsed.hash}`;
      }
    } catch {
      // Preserve the original URL if it cannot be parsed.
    }
  }

  // Handle uploaded images.
  if (trimmed.includes('/uploads/')) {
    let uploadPath = trimmed.slice(trimmed.indexOf('/uploads/'));
    try {
      uploadPath = encodeURI(decodeURI(uploadPath));
    } catch {}

    if (import.meta.env.DEV) {
      return uploadPath;
    }

    return `${LIVE_MEDIA_BASE_URL}${uploadPath}`;
  }

  // Preserve other absolute URLs.
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\/honeywellproducts\.com/i, 'https://honeywellproducts.com');
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
