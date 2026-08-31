import { getApiDomain } from '../../utils/apiConfig';

const getBaseUrl = () => `${getApiDomain()}/api/AdminProfile`;

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * GET /api/AdminProfile
 * Fetches the current admin profile from the API.
 */
export const getAdminProfile = async () => {
  const url = getBaseUrl();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch admin profile: status ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('getAdminProfile error:', err);
    throw err;
  }
};

/**
 * PUT /api/AdminProfile
 * Updates the admin profile using PUT method.
 */
export const updateAdminProfile = async (profileData) => {
  const url = getBaseUrl();
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    if (!response.ok) {
      throw new Error(`Failed to update admin profile (PUT): status ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('updateAdminProfile error:', err);
    throw err;
  }
};

/**
 * POST /api/AdminProfile
 * Creates or updates the admin profile using POST method.
 */
export const postAdminProfile = async (profileData) => {
  const url = getBaseUrl();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    if (!response.ok) {
      throw new Error(`Failed to post admin profile (POST): status ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('postAdminProfile error:', err);
    throw err;
  }
};

/**
 * PUT /api/AdminProfile/settings
 * Updates admin profile settings using PUT method.
 */
export const updateAdminProfileSettings = async (settingsData) => {
  const url = `${getBaseUrl()}/settings`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settingsData)
    });
    if (!response.ok) {
      throw new Error(`Failed to update admin profile settings (PUT): status ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('updateAdminProfileSettings error:', err);
    throw err;
  }
};

/**
 * POST /api/AdminProfile/settings
 * Saves admin profile settings using POST method.
 */
export const postAdminProfileSettings = async (settingsData) => {
  const url = `${getBaseUrl()}/settings`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settingsData)
    });
    if (!response.ok) {
      throw new Error(`Failed to post admin profile settings (POST): status ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('postAdminProfileSettings error:', err);
    throw err;
  }
};
