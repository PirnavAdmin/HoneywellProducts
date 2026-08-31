import { API_BASE_URL } from '../services/api';

const DEFAULT_BACKEND_URL = 'https://wildlife-unwieldy-devotee.ngrok-free.dev';

// Compatibility adapter for the supplied Admin Module.
export const getApiDomain = () => API_BASE_URL || DEFAULT_BACKEND_URL;
