// Central API configuration for ASP.NET Core Web API.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wildlife-unwieldy-devotee.ngrok-free.dev';

export async function apiRequest(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
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
