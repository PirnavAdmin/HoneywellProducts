import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';
import heroPosterImage from '../../assets/images/cctv-hero-poster.jpg';

const API_BASE = `${getApiDomain()}/api/Banners`;

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const api = axios.create({
  baseURL: API_BASE,
  validateStatus: status => status < 500
});

export const mapBannerFromApi = (item) => {
  if (!item) return null;
  const rawId = item.id ?? item.bannerId ?? item._id ?? '';
  const rawImage = item.imageUrl || item.image || item.bannerImage || '';
  const isInvalidImage = !rawImage || rawImage.includes('placeholder.png') || rawImage.includes('placeholder');

  return {
    id: String(rawId),
    title: item.title || item.name || '',
    subtitle: item.subtitle || item.description || '',
    imageUrl: isInvalidImage ? heroPosterImage : rawImage,
    targetUrl: item.targetUrl || item.link || item.url || '/products',
    bannerType: item.bannerType || item.type || 'Hero',
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : (item.active !== undefined ? Boolean(item.active) : true),
    displayOrder: Number(item.displayOrder || item.order || 0),
    createdAt: item.createdAt || item.dateCreated || new Date().toISOString()
  };
};

/**
 * GET /api/Banners/admin
 * Fetch all banners for admin panel
 */
export const fetchAdminBanners = async () => {
  try {
    const response = await api.get('/admin', { headers: getHeaders() });
    if (response.status === 200) {
      const list = Array.isArray(response.data) ? response.data : (response.data?.banners || response.data?.items || response.data?.data || []);
      return list.map(mapBannerFromApi).filter(Boolean);
    }
  } catch (err) {
    // Fallback to GET /api/Banners
    try {
      const response = await api.get('', { headers: getHeaders() });
      if (response.status === 200) {
        const list = Array.isArray(response.data) ? response.data : (response.data?.banners || response.data?.items || response.data?.data || []);
        return list.map(mapBannerFromApi).filter(Boolean);
      }
    } catch (e) {
      console.warn('Fetch Admin Banners Error:', e.message);
    }
  }
  return [];
};

import { apiCache } from '../../utils/apiCache';

/**
 * GET /api/Banners
 * Fetch active banners for public frontend
 */
export const fetchActiveBanners = async (type = '') => {
  return await apiCache.fetchWithCache(`banners_active_${type}`, async () => {
    try {
      const response = await api.get(type ? `?type=${encodeURIComponent(type)}` : '', { headers: getHeaders() });
      if (response.status === 200) {
        const list = Array.isArray(response.data) ? response.data : (response.data?.banners || response.data?.items || response.data?.data || []);
        return list.map(mapBannerFromApi).filter(Boolean);
      }
    } catch (err) {
      console.warn('Fetch Active Banners Error:', err.message);
    }
    return [];
  }, 10 * 60 * 1000);
};


/**
 * GET /api/Banners/{id}
 * Fetch single banner by ID
 */
export const fetchBannerById = async (id) => {
  try {
    const response = await api.get(`/${id}`, { headers: getHeaders() });
    if (response.status === 200) {
      return mapBannerFromApi(response.data?.banner || response.data?.data || response.data);
    }
  } catch (err) {
    console.warn(`Fetch Banner By ID ${id} Error:`, err.message);
  }
  return null;
};

/**
 * POST /api/Banners
 * Create a new banner
 */
export const createBanner = async (bannerData) => {
  const payload = {
    title: bannerData.title || '',
    subtitle: bannerData.subtitle || '',
    imageUrl: bannerData.imageUrl || '',
    targetUrl: bannerData.targetUrl || '/products',
    bannerType: bannerData.bannerType || 'Hero',
    isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
    displayOrder: Number(bannerData.displayOrder || 0)
  };
  const response = await api.post('', payload, { headers: getHeaders() });
  return mapBannerFromApi(response.data?.banner || response.data?.data || response.data);
};

/**
 * PUT /api/Banners/{id}
 * Update banner
 */
export const updateBanner = async (id, bannerData) => {
  const payload = {
    id: isNaN(Number(id)) ? id : Number(id),
    title: bannerData.title || '',
    subtitle: bannerData.subtitle || '',
    imageUrl: bannerData.imageUrl || '',
    targetUrl: bannerData.targetUrl || '/products',
    bannerType: bannerData.bannerType || 'Hero',
    isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
    displayOrder: Number(bannerData.displayOrder || 0)
  };
  const response = await api.put(`/${id}`, payload, { headers: getHeaders() });
  return mapBannerFromApi(response.data?.banner || response.data?.data || response.data);
};

/**
 * PUT /api/Banners/{id}/toggle
 * Toggle active status
 */
export const toggleBannerActive = async (id, currentActiveState) => {
  try {
    const response = await api.put(`/${id}/toggle`, {}, { headers: getHeaders() });
    if (response.status === 200) {
      return mapBannerFromApi(response.data?.banner || response.data?.data || response.data);
    }
  } catch (err) {
    console.warn(`Toggle banner ${id} error:`, err.message);
  }
  return await updateBanner(id, { isActive: !currentActiveState });
};

/**
 * POST /api/Banners/upload-image
 * Upload banner image helper
 */
export const uploadBannerImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await axios.post(`${API_BASE}/upload-image`, formData, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.url || response.data?.imageUrl || response.data?.path || '';
  } catch (err) {
    console.warn('Upload banner image error:', err.message);
    return URL.createObjectURL(file);
  }
};

/**
 * DELETE /api/Banners/{id}
 * Delete banner
 */
export const deleteBanner = async (id) => {
  await api.delete(`/${id}`, { headers: getHeaders() });
  return true;
};
