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
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}
