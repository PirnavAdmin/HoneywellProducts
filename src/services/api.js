// Central API configuration for the ASP.NET Core Web API.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wildlife-unwieldy-devotee.ngrok-free.dev';

export async function apiRequest(path, options = {}) {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };
  if (!options.isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || errBody.Message || `API request failed: ${response.status}`);
  }
  return response.json();
}

