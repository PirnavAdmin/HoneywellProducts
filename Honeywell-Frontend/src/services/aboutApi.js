import axios from 'axios';
import { getApiDomain } from '../utils/apiConfig';

const HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json'
};

const getAuthHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    ...HEADERS,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const domain = getApiDomain().replace(/\/$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${domain}${cleanPath}`;
};

export const aboutApi = {
  /**
   * Fetch public About Us configuration
   */
  async getAboutData() {
    const primaryUrl = `${getApiDomain()}/api/About`;
    const altUrl = `${getApiDomain()}/api/Settings/about-us`;

    try {
      const response = await axios.get(primaryUrl, {
        headers: HEADERS,
        timeout: 15000
      });
      return response.data;
    } catch (err) {
      // If primary endpoint fails, try alternative alias endpoint
      console.warn('Primary /api/About endpoint failed, attempting alias /api/Settings/about-us...', err.message);
      const altResponse = await axios.get(altUrl, {
        headers: HEADERS,
        timeout: 15000
      });
      return altResponse.data;
    }
  },

  /**
   * Update About Us configuration (Admin Only)
   */
  async updateAboutData(payload) {
    const primaryUrl = `${getApiDomain()}/api/About`;
    const altUrl = `${getApiDomain()}/api/Settings/about-us`;

    try {
      const response = await axios.put(primaryUrl, payload, {
        headers: getAuthHeaders(false),
        timeout: 20000
      });
      return response.data;
    } catch (err) {
      console.warn('PUT to primary endpoint failed, attempting POST/alt endpoint...', err.message);
      try {
        const altResponse = await axios.put(altUrl, payload, {
          headers: getAuthHeaders(false),
          timeout: 20000
        });
        return altResponse.data;
      } catch (postErr) {
        // Try POST method if PUT is disallowed by a server route
        const postResponse = await axios.post(primaryUrl, payload, {
          headers: getAuthHeaders(false),
          timeout: 20000
        });
        return postResponse.data;
      }
    }
  },

  /**
   * Upload About Us section image (Admin Only)
   * @param {File} imageFile 
   * @param {string} section - 'hero' | 'overview' | 'ceo'
   */
  async uploadAboutImage(imageFile, section) {
    const primaryUrl = `${getApiDomain()}/api/About/upload-image`;
    const altUrl = `${getApiDomain()}/api/Settings/about-us/upload-image`;

    const formData = new FormData();
    formData.append('imageFile', imageFile);
    if (section) {
      formData.append('section', section);
    }

    try {
      const response = await axios.post(primaryUrl, formData, {
        headers: getAuthHeaders(true),
        timeout: 30000
      });
      return response.data;
    } catch (err) {
      console.warn('Primary upload endpoint failed, attempting alternative alias...', err.message);
      const altResponse = await axios.post(altUrl, formData, {
        headers: getAuthHeaders(true),
        timeout: 30000
      });
      return altResponse.data;
    }
  }
};
