import axios from 'axios';
import { getApiDomain, DEFAULT_BACKEND_URL, resolveMediaUrl } from '../../utils/apiConfig';
import { apiCache } from '../../utils/apiCache';

export const resolveBannerImage = (url) => {
  if (!url) return '';
  return resolveMediaUrl(url);
};

const getBaseUrl = () => {
  const domain = getApiDomain() || '';
  return domain ? `${domain.replace(/\/$/, '')}/api/Banners` : '/api/Banners';
};

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

export const mapBannerFromApi = (item) => {
  if (!item || typeof item !== 'object') return null;
  const rawId = item.id ?? item.Id ?? item.bannerId ?? item.BannerId ?? item._id ?? '';
  const rawImage = (
    item.imageUrl || item.ImageUrl ||
    item.image || item.Image ||
    item.bannerImage || item.BannerImage ||
    item.url || item.Url ||
    item.path || item.Path ||
    item.image_url || item.banner_image ||
    item.filePath || item.FilePath ||
    ''
  );

  return {
    id: String(rawId),
    title: item.title || item.Title || item.name || item.Name || '',
    subtitle: item.subtitle || item.Subtitle || item.description || item.Description || '',
    imageUrl: String(rawImage || '').trim(),
    targetUrl: item.targetUrl || item.TargetUrl || item.link || item.Link || item.url || item.Url || '/products',
    bannerType: item.bannerType || item.BannerType || item.type || item.Type || 'Hero',
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : (item.IsActive !== undefined ? Boolean(item.IsActive) : (item.active !== undefined ? Boolean(item.active) : true)),
    displayOrder: Number(item.displayOrder ?? item.DisplayOrder ?? item.order ?? item.Order ?? 0),
    createdAt: item.createdAt || item.CreatedAt || item.dateCreated || new Date().toISOString()
  };
};

/**
 * GET /api/Banners/admin
 * Fetch all banners for admin panel
 */
export const fetchAdminBanners = async () => {
  try {
    const response = await axios.get(`${getBaseUrl()}/admin`, { headers: getHeaders() });
    if (response.status === 200) {
      const list = Array.isArray(response.data) ? response.data : (response.data?.banners || response.data?.items || response.data?.data || []);
      return list.map(mapBannerFromApi).filter(Boolean);
    }
  } catch (err) {
    // Fallback to GET /api/Banners
    try {
      const response = await axios.get(getBaseUrl(), { headers: getHeaders() });
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

/**
 * GET /api/Banners
 * Fetch active banners dynamically for public frontend
 */
export const fetchActiveBanners = async (type = '') => {
  const cacheKey = `banners_active_${type || 'all'}`;
  return await apiCache.fetchWithCache(cacheKey, async () => {
    try {
      const url = type ? `${getBaseUrl()}?type=${encodeURIComponent(type)}` : getBaseUrl();
      const response = await axios.get(url, { headers: getHeaders() });
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
    const response = await axios.get(`${getBaseUrl()}/${id}`, { headers: getHeaders() });
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
    description: bannerData.description || bannerData.subtitle || '',
    imageUrl: bannerData.imageUrl || '',
    targetUrl: bannerData.targetUrl || '/products',
    bannerType: bannerData.bannerType || 'Hero',
    isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
    displayOrder: Number(bannerData.displayOrder || 0)
  };
  const response = await axios.post(getBaseUrl(), payload, { headers: getHeaders() });
  apiCache.invalidate('banners');
  return mapBannerFromApi(response.data?.banner || response.data?.data || response.data);
};

/**
 * PUT /api/Banners/{id}
 * Update banner
 */
export const updateBanner = async (id, bannerData) => {
  const cleanId = isNaN(Number(id)) ? id : Number(id);
  const payload = {
    id: cleanId,
    title: bannerData.title || '',
    subtitle: bannerData.subtitle || '',
    description: bannerData.description || bannerData.subtitle || '',
    imageUrl: bannerData.imageUrl || '',
    targetUrl: bannerData.targetUrl || '/products',
    bannerType: bannerData.bannerType || 'Hero',
    isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
    displayOrder: Number(bannerData.displayOrder || 0)
  };
  const response = await axios.put(`${getBaseUrl()}/${id}`, payload, { headers: getHeaders() });
  apiCache.invalidate('banners');
  return mapBannerFromApi(response.data?.banner || response.data?.data || response.data);
};

/**
 * PUT /api/Banners/{id}/toggle
 * Toggle active status
 */
export const toggleBannerActive = async (id, currentActiveState) => {
  try {
    const response = await axios.put(`${getBaseUrl()}/${id}/toggle`, {}, { headers: getHeaders() });
    if (response.status === 200) {
      apiCache.invalidate('banners');
      return mapBannerFromApi(response.data?.banner || response.data?.data || response.data);
    }
  } catch (err) {
    console.warn(`Toggle banner ${id} error:`, err.message);
  }
  return await updateBanner(id, { isActive: !currentActiveState });
};

/**
 * POST /api/Banners/upload-image
 * Upload banner image with automatic fallback
 */
export const uploadBannerImage = async (file) => {
  const domain = getApiDomain() || '';
  const bannerUploadUrl = domain ? `${domain.replace(/\/$/, '')}/api/Banners/upload-image` : '/api/Banners/upload-image';
  const fallbackUploadUrl = domain ? `${domain.replace(/\/$/, '')}/api/Category/upload-image` : '/api/Category/upload-image';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('image', file);
  formData.append('imageFile', file);

  try {
    const response = await axios.post(bannerUploadUrl, formData, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'multipart/form-data',
      },
    });
    const url = response.data?.imageUrl || response.data?.url || response.data?.image || response.data?.path || '';
    if (url) return url;
  } catch (err) {
    console.warn('Banner upload primary route error, attempting fallback route:', err?.message);
  }

  // Fallback to Category/upload-image which is verified active on backend
  try {
    const fallbackResponse = await axios.post(fallbackUploadUrl, formData, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'multipart/form-data',
      },
    });
    const finalUrl = fallbackResponse.data?.imageUrl || fallbackResponse.data?.url || fallbackResponse.data?.image || fallbackResponse.data?.path || '';
    if (finalUrl) return finalUrl;
  } catch (fallbackErr) {
    console.error('All banner upload routes failed:', fallbackErr);
    throw fallbackErr;
  }

  throw new Error('Upload failed: Server did not return an image URL.');
};

/**
 * DELETE /api/Banners/{id}
 * Delete banner
 */
export const deleteBanner = async (id) => {
  await axios.delete(`${getBaseUrl()}/${id}`, { headers: getHeaders() });
  apiCache.invalidate('banners');
  return true;
};
