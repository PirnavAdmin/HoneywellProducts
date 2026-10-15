// Central API configuration for ASP.NET Core Web API.
export const DEFAULT_BACKEND_URL = 'https://drab-smoking-unstaffed.ngrok-free.dev';
// In dev mode, force relative path ('') so requests route through Vite proxy (/api) to eliminate CORS blocks
export const API_BASE_URL = import.meta.env.DEV 
  ? '' 
  : (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BACKEND_URL);

export async function apiRequest(path, options = {}) {
  const { headers: customHeaders, ...restOptions } = options;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${cleanPath}`;

  const mergedHeaders = { 
    'ngrok-skip-browser-warning': 'true',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(customHeaders || {}) 
  };

  const response = await fetch(url, {
    cache: 'no-store',
    ...restOptions,
    headers: mergedHeaders,
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

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const htmlText = await response.text();
    if (htmlText.includes('ngrok') || htmlText.includes('<!DOCTYPE') || htmlText.includes('<html')) {
      throw new Error('API server or tunnel returned an HTML page instead of JSON data. Please retry.');
    }
    return htmlText;
  }

  return response.json();
}
