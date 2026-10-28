
const DEFAULT_BACKEND_URL =
  'https://drab-smoking-unstaffed.ngrok-free.dev';

export { DEFAULT_BACKEND_URL };

// Local development uses Vite's /api proxy.
// Production uses VITE_API_BASE_URL or the configured fallback.
export const API_BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || DEFAULT_BACKEND_URL);

export async function apiRequest(path, options = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE_URL}${cleanPath}`;

  const response = await fetch(url, {
    ...options,
    cache: 'no-store',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      ...(function getAuthHeaders() {
        const adminTok = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('adminToken') : null) ||
                         (typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null);
        if (adminTok) {
          return { 'Authorization': `Bearer ${adminTok}` };
        }
        const custTok = typeof localStorage !== 'undefined' ? localStorage.getItem('customerToken') : null;
        if (custTok) {
          return { 'Authorization': `Bearer ${custTok}` };
        }
        return {};
      })(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = '';

    try {
      const errJson = await response.json();

      if (typeof errJson === 'string') {
        errorDetail = errJson;
      } else if (errJson?.title) {
        errorDetail = errJson.title;
      } else if (errJson?.message) {
        errorDetail = errJson.message;
      } else if (errJson?.detail) {
        errorDetail = errJson.detail;
      } else if (errJson?.errors) {
        errorDetail = Object.entries(errJson.errors)
          .map(([field, errors]) =>
            `${field}: ${
              Array.isArray(errors) ? errors.join(', ') : errors
            }`
          )
          .join(' | ');
      }
    } catch {
      errorDetail = response.statusText || '';
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      // Only clear credentials if an explicit auth renewal endpoint returned 401
      const isAuthRenewal = cleanPath.toLowerCase().startsWith('/api/auth/refresh');
      if (isAuthRenewal) {
        sessionStorage.removeItem('isAdmin');
        sessionStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminToken');
      }
    }

    throw new Error(
      errorDetail
        ? `API Error (${response.status}): ${errorDetail}`
        : `API request failed: ${response.status}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
