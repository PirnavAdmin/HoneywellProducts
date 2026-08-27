import { API_BASE_URL } from '../services/api';

// Compatibility adapter for the supplied Admin Module. The existing project
// remains the single source of truth for the API base URL.
export const getApiDomain = () => API_BASE_URL;
