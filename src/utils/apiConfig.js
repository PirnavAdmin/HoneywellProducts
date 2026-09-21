import { API_BASE_URL, DEFAULT_BACKEND_URL } from '../services/api';

export { DEFAULT_BACKEND_URL };

// Compatibility adapter for the supplied Admin Module.
// Uses relative base in dev mode to route through Vite server proxy and eliminate CORS preflight blocks.
export const getApiDomain = () => API_BASE_URL;
