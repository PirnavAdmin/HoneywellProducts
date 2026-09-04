import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';
import smartSecurityImage from '../../assets/images/smart-security-sustainable-future.png';

const API_BASE = `${getApiDomain()}/api/marketing/banners`;

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
    imageUrl: isInvalidImage ? smartSecurityImage : rawImage,
    targetUrl: item.targetUrl || item.link || item.url || '/products',
    bannerType: item.bannerType || item.type || 'Hero',
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : (item.active !== undefined ? Boolean(item.active) : true),
    displayOrder: Number(item.displayOrder || item.order || 0),
    createdAt: item.createdAt || item.dateCreated || new Date().toISOString()
  };
};

/**
 * GET /api/marketing/banners
 * Fetch all banners for admin panel
 */
export const fetchAdminBanners = async () => {
  try {
    const response = await api.get('', { headers: getHeaders() });
    if (response.status === 200) {
      const list = Array.isArray(response.data) ? response.data : (response.data?.banners || response.data?.items || response.data?.data || []);
      return list.map(mapBannerFromApi).filter(Boolean);
    }
  } catch (err) {
    // Quiet fallback
  }
  return [];
};

/**
 * GET /api/marketing/banners
 * Fetch active banners for public frontend
 */
export const fetchActiveBanners = async (type = '') => {
  try {
    const response = await api.get(type ? `?type=${encodeURIComponent(type)}` : '', { headers: getHeaders() });
    if (response.status === 200) {
      const list = Array.isArray(response.data) ? response.data : (response.data?.banners || response.data?.items || response.data?.data || []);
      return list.map(mapBannerFromApi).filter(Boolean);
    }
  } catch (err) {
    // Quiet fallback
  }
  return [];
};

/**
 * GET /api/marketing/banners/{id}
 * Fetch single banner by ID
 */
export const fetchBannerById = async (id) => {
  try {
    const response = await api.get(`/${id}`, { headers: getHeaders() });
    if (response.status === 200) {
      return mapBannerFromApi(response.data?.banner || response.data?.data || response.data);
    }
  } catch (err) {
    // Quiet fallback
  }
  return null;
};

/**
 * POST /api/marketing/banners
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
 * PUT /api/marketing/banners/{id}
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
 * Toggle active status
 */
export const toggleBannerActive = async (id, currentActiveState) => {
  return await updateBanner(id, { isActive: !currentActiveState });
};

/**
 * Upload banner image helper
 */
export const uploadBannerImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await axios.post(`${getApiDomain()}/api/upload/image`, formData, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.url || response.data?.imageUrl || '';
  } catch {
    return URL.createObjectURL(file);
  }
};

/**
 * DELETE /api/marketing/banners/{id}
 * Delete banner
 */
export const deleteBanner = async (id) => {
  await api.delete(`/${id}`, { headers: getHeaders() });
  return true;
};
