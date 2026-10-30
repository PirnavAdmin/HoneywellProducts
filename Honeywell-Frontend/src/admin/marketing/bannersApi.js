import axios from 'axios';
import { getApiDomain, DEFAULT_BACKEND_URL, resolveMediaUrl } from '../../utils/apiConfig';
import { apiCache } from '../../utils/apiCache';

export const clearBannerCache = () => {
  apiCache.invalidate('banners');
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const keysToRemove = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && (key.startsWith('page_banner_') || key === 'home_hero_slides')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent('banners-updated'));
    } catch {}
  }
};

export const resolveBannerImage = (url) => {
  if (!url) return '';
  return resolveMediaUrl(url);
};

const getBaseUrl = () => {
  const domain = getApiDomain() || '';
  return domain ? `${domain.replace(/\/$/, '')}/api/Banners` : '/api/Banners';
};

const getHeaders = () => {
  const token = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('adminToken') : null) || (typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null);
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

export const KNOWN_BANNER_TYPES = ['Hero', 'Products', 'Solutions', 'Business', 'About', 'Resources', 'Contact', 'Promo', 'Trust'];

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

  const rawTarget = item.targetUrl || item.TargetUrl || item.link || item.Link || item.url || item.Url || '';
  const rawSub = item.subtitle || item.Subtitle || item.description || item.Description || '';
  const rawDesc = item.description || item.Description || '';

  // 1. Primary check: Extract explicit [Type:...] tag from subtitle or description
  let extractedType = '';
  const tagMatch = String(rawSub).match(/\[Type:\s*([A-Za-z0-9_]+)\]/i) ||
                   String(rawDesc).match(/\[Type:\s*([A-Za-z0-9_]+)\]/i);

  if (tagMatch && tagMatch[1]) {
    const matchedKnown = KNOWN_BANNER_TYPES.find(t => t.toLowerCase() === tagMatch[1].toLowerCase());
    extractedType = matchedKnown || (tagMatch[1].charAt(0).toUpperCase() + tagMatch[1].slice(1).toLowerCase());
  }

  // 2. Secondary check: Direct bannerType property on item
  if (!extractedType) {
    const propType = item.bannerType || item.BannerType || item.type || item.Type;
    if (propType && typeof propType === 'string' && propType.trim()) {
      const matchedKnown = KNOWN_BANNER_TYPES.find(t => t.toLowerCase() === propType.trim().toLowerCase());
      extractedType = matchedKnown || (propType.trim().charAt(0).toUpperCase() + propType.trim().slice(1).toLowerCase());
    }
  }

  // 3. Fallback: Explicit query parameter type in targetUrl (e.g. ?type=Products)
  if (!extractedType && rawTarget) {
    const urlMatch = String(rawTarget).match(/[?&]type=([A-Za-z0-9_]+)/i);
    if (urlMatch && urlMatch[1]) {
      const matchedKnown = KNOWN_BANNER_TYPES.find(t => t.toLowerCase() === urlMatch[1].toLowerCase());
      if (matchedKnown) extractedType = matchedKnown;
    }
  }

  // 4. Fallback: Title containing "... Banner"
  if (!extractedType) {
    const titleLower = String(item.title || item.Title || '').toLowerCase();
    for (const t of KNOWN_BANNER_TYPES) {
      if (t !== 'Hero' && titleLower.includes(`${t.toLowerCase()} banner`)) {
        extractedType = t;
        break;
      }
    }
  }

  // 5. Default fallback to Hero
  if (!extractedType) {
    extractedType = 'Hero';
  }

  // Extract custom CTA button text if saved: [Cta:Text] or [Btn:Text]
  const ctaMatch = String(rawSub).match(/\[(?:Cta|Btn):\s*([^\]]+)\]/i) ||
                   String(rawDesc).match(/\[(?:Cta|Btn):\s*([^\]]+)\]/i);
  const customCta = ctaMatch ? ctaMatch[1].trim() : (item.ctaText || item.buttonText || '');

  // Extract secondary button type: [Sec:quote|contact|none]
  const secMatch = String(rawSub).match(/\[Sec:\s*([A-Za-z0-9_-]+)\]/i) ||
                   String(rawDesc).match(/\[Sec:\s*([A-Za-z0-9_-]+)\]/i);
  const customSec = secMatch ? secMatch[1].trim().toLowerCase() : (item.secondaryType || '');

  // Clean tags from displayed subtitle
  const cleanSubtitle = String(rawSub)
    .replace(/\[Type:\s*\w+\]/gi, '')
    .replace(/\[(?:Cta|Btn):\s*[^\]]+\]/gi, '')
    .replace(/\[Sec:\s*[^\]]+\]/gi, '')
    .trim();

  return {
    id: String(rawId),
    title: item.title || item.Title || item.name || item.Name || '',
    subtitle: cleanSubtitle,
    imageUrl: String(rawImage || '').trim(),
    targetUrl: rawTarget || (extractedType === 'Products' ? '/products' : '/'),
    bannerType: extractedType,
    ctaText: customCta,
    secondaryType: customSec,
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
      const response = await axios.get(getBaseUrl(), { headers: getHeaders() });
      if (response.status === 200) {
        const list = Array.isArray(response.data) ? response.data : (response.data?.banners || response.data?.items || response.data?.data || []);
        let mapped = list.map(mapBannerFromApi).filter(Boolean);
        if (type) {
          const typeLower = type.toLowerCase();
          const matched = mapped.filter(b =>
            (b.bannerType && b.bannerType.toLowerCase() === typeLower) ||
            (typeLower !== 'hero' && b.targetUrl && b.targetUrl.toLowerCase().includes(`type=${typeLower}`))
          );
          if (matched.length > 0) return matched;
        }
        return mapped;
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
  const type = bannerData.bannerType || 'Hero';
  let targetUrl = (bannerData.targetUrl || '').trim();
  if (!targetUrl) {
    if (type === 'Products') targetUrl = '/products?type=Products';
    else if (type === 'Solutions') targetUrl = '/solutions?type=Solutions';
    else if (type === 'Business') targetUrl = '/business?type=Business';
    else if (type === 'About') targetUrl = '/about-us?type=About';
    else if (type === 'Resources') targetUrl = '/resources?type=Resources';
    else if (type === 'Contact') targetUrl = '/contact?type=Contact';
    else if (type === 'Promo') targetUrl = '/offers?type=Promo';
    else targetUrl = '/products';
  }

  const rawSub = bannerData.subtitle || bannerData.description || '';
  const cleanSub = rawSub
    .replace(/\[Type:\s*\w+\]/gi, '')
    .replace(/\[(?:Cta|Btn):\s*[^\]]+\]/gi, '')
    .replace(/\[Sec:\s*[^\]]+\]/gi, '')
    .trim();

  let tags = `[Type:${type}]`;
  if (bannerData.ctaText && bannerData.ctaText.trim()) {
    tags += ` [Cta:${bannerData.ctaText.trim()}]`;
  }
  if (bannerData.secondaryType && bannerData.secondaryType.trim()) {
    tags += ` [Sec:${bannerData.secondaryType.trim()}]`;
  }
  const taggedSub = cleanSub ? `${cleanSub} ${tags}` : tags;

  const payload = {
    title: bannerData.title || '',
    subtitle: taggedSub,
    description: taggedSub,
    imageUrl: bannerData.imageUrl || '',
    targetUrl: targetUrl,
    bannerType: type,
    isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
    displayOrder: Number(bannerData.displayOrder || 0)
  };
  const response = await axios.post(getBaseUrl(), payload, { headers: getHeaders() });
  clearBannerCache();
  apiCache.invalidate('banners');
  const mapped = mapBannerFromApi(response.data?.banner || response.data?.data || response.data);
  if (mapped) {
    mapped.bannerType = type;
    if (bannerData.ctaText) mapped.ctaText = bannerData.ctaText.trim();
    if (bannerData.secondaryType) mapped.secondaryType = bannerData.secondaryType.trim();
  }
  return mapped;
};

/**
 * PUT /api/Banners/{id}
 * Update banner
 */
export const updateBanner = async (id, bannerData) => {
  const cleanId = isNaN(Number(id)) ? id : Number(id);
  const type = bannerData.bannerType || 'Hero';
  let targetUrl = (bannerData.targetUrl || '').trim();
  if (!targetUrl) {
    if (type === 'Products') targetUrl = '/products?type=Products';
    else if (type === 'Solutions') targetUrl = '/solutions?type=Solutions';
    else if (type === 'Business') targetUrl = '/business?type=Business';
    else if (type === 'About') targetUrl = '/about-us?type=About';
    else if (type === 'Resources') targetUrl = '/resources?type=Resources';
    else if (type === 'Contact') targetUrl = '/contact?type=Contact';
    else if (type === 'Promo') targetUrl = '/offers?type=Promo';
    else targetUrl = '/products';
  }

  const rawSub = bannerData.subtitle || bannerData.description || '';
  const cleanSub = rawSub
    .replace(/\[Type:\s*\w+\]/gi, '')
    .replace(/\[(?:Cta|Btn):\s*[^\]]+\]/gi, '')
    .replace(/\[Sec:\s*[^\]]+\]/gi, '')
    .trim();

  let tags = `[Type:${type}]`;
  if (bannerData.ctaText && bannerData.ctaText.trim()) {
    tags += ` [Cta:${bannerData.ctaText.trim()}]`;
  }
  if (bannerData.secondaryType && bannerData.secondaryType.trim()) {
    tags += ` [Sec:${bannerData.secondaryType.trim()}]`;
  }
  const taggedSub = cleanSub ? `${cleanSub} ${tags}` : tags;

  const payload = {
    id: cleanId,
    title: bannerData.title || '',
    subtitle: taggedSub,
    description: taggedSub,
    imageUrl: bannerData.imageUrl || '',
    targetUrl: targetUrl,
    bannerType: type,
    isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
    displayOrder: Number(bannerData.displayOrder || 0)
  };
  const response = await axios.put(`${getBaseUrl()}/${id}`, payload, { headers: getHeaders() });
  clearBannerCache();
  apiCache.invalidate('banners');
  const mapped = mapBannerFromApi(response.data?.banner || response.data?.data || response.data);
  if (mapped) {
    mapped.bannerType = type;
    if (bannerData.ctaText) mapped.ctaText = bannerData.ctaText.trim();
    if (bannerData.secondaryType) mapped.secondaryType = bannerData.secondaryType.trim();
  }
  return mapped;
};

/**
 * PUT /api/Banners/{id}/toggle
 * Toggle active status
 */
export const toggleBannerActive = async (id, currentActiveState) => {
  try {
    const response = await axios.put(`${getBaseUrl()}/${id}/toggle`, {}, { headers: getHeaders() });
    if (response.status === 200) {
      clearBannerCache();
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
  clearBannerCache();
  return true;
};
