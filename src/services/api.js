// Central API configuration for ASP.NET Core Web API.
export const DEFAULT_BACKEND_URL = 'https://wildlife-unwieldy-devotee.ngrok-free.dev';

// In dev mode, force relative path ('') so requests route through Vite proxy (/api) to eliminate CORS blocks
export const API_BASE_URL = import.meta.env.DEV 
  ? '' 
  : (import.meta.env.VITE_API_BASE_URL || DEFAULT_BACKEND_URL);

export async function apiRequest(path, options = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${cleanPath}`;
  const response = await fetch(url, {
    headers: { 
      'ngrok-skip-browser-warning': 'true',
      'Content-Type': 'application/json', 
      ...options.headers 
    },
    ...options,
  });
  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      if (errJson) {
        if (typeof errJson === 'string') errorDetail = errJson;
        else if (errJson.title) errorDetail = errJson.title;
        else if (errJson.message) errorDetail = errJson.message;
        else if (errJson.detail) errorDetail = errJson.detail;
        else if (errJson.errors && typeof errJson.errors === 'object') {
          errorDetail = Object.entries(errJson.errors)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join(' | ');
        }
      }
    } catch {
      try {
        errorDetail = await response.text();
      } catch {}
    }
    const cleanMsg = errorDetail ? `API Error (${response.status}): ${errorDetail}` : `API request failed: ${response.status}`;
    throw new Error(cleanMsg);
  }
  return response.json();
}
