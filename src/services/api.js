// Central API configuration for ASP.NET Core Web API.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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


