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

export const DEFAULT_ABOUT_DATA = {
  hero: {
    eyebrow: 'ABOUT US',
    title: 'Security Technology With a Clear Purpose',
    description: 'A premium framework prepared for official company story, market position and leadership content.',
    image: '/uploads/about/hero.jpg'
  },
  overview: {
    eyebrow: 'COMPANY OVERVIEW',
    title: 'Built for Product Discovery and Security Solutions',
    lead: 'The official company overview statement.',
    description: 'Scalable foundation for CCTV, security, solar product discovery, eCommerce preparation, bulk enquiries and channel partnerships.',
    image: '/uploads/about/overview.jpg'
  },
  vision: {
    title: 'Long-term Vision Statement',
    description: 'Detailed vision goals.'
  },
  mission: {
    title: 'Company Mission Statement',
    description: 'Detailed mission goals.'
  },
  portfolio: {
    eyebrow: 'PRODUCT PORTFOLIO',
    title: 'Security, CCTV & Solar Power Product Portfolio',
    description: 'Comprehensive surveillance systems, solar panels, inverters, storage batteries, and recording solutions.',
    items: [
      { icon: 'Camera', title: 'CCTV & Surveillance', text: 'Analog, Dome, Bullet, PTZ, and IP security cameras.' },
      { icon: 'Sun', title: 'Solar Panels & Energy', text: 'High-efficiency Monocrystalline, Polycrystalline, and Bifacial modules.' },
      { icon: 'Zap', title: 'Solar Inverters & Storage', text: 'Off-grid and hybrid solar inverters, lithium & gel batteries.' },
      { icon: 'Network', title: 'Recording & Networking', text: 'NVRs, DVRs, surveillance drives, and PoE network switches.' }
    ]
  },
  whyChooseUs: {
    eyebrow: 'WHY CHOOSE US',
    title: 'A Conservative, Client-Ready Approach',
    description: 'Statements avoid unsupported claims and remain ready for verified company information.',
    items: [
      { icon: 'ShieldCheck', title: 'Practical Security Focus', text: 'Product discovery organized around clear application needs.' },
      { icon: 'Eye', title: 'Transparent Product Data', text: 'Verified models and specifications.' },
      { icon: 'Handshake', title: 'Business Ready', text: 'Dedicated enquiry journeys for retail, bulk and partner requirements.' }
    ]
  },
  ceo: {
    name: 'CEO Full Name',
    designation: 'Chief Executive Officer',
    message: 'Approved executive statement.',
    subtext: 'Supporting leadership statement.',
    image: '/uploads/about/ceo.jpg'
  }
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
      return response.data || DEFAULT_ABOUT_DATA;
    } catch (err) {
      // If primary endpoint fails, try alternative alias endpoint
      console.warn('Primary /api/About endpoint failed, attempting alias /api/Settings/about-us...', err.message);
      try {
        const altResponse = await axios.get(altUrl, {
          headers: HEADERS,
          timeout: 15000
        });
        return altResponse.data || DEFAULT_ABOUT_DATA;
      } catch (altErr) {
        console.warn('Both About API endpoints failed, returning default fallback data:', altErr.message);
        return DEFAULT_ABOUT_DATA;
      }
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
