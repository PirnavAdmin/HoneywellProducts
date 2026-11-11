import { API_BASE_URL } from './api';
import { apiCache } from '../utils/apiCache';
import { applicationImages, solutionPortfolioImages } from '../data/imageLibrary';
import { resolveMediaUrl } from '../utils/apiConfig';
import { getAdminToken } from '../utils/rbac';

const getAuthHeaders = (extra = {}) => {
  const token = getAdminToken();
  return {
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra
  };
};

export const mapSolutionFromApi = (raw = {}) => {
  const rawImage = raw.imageUrl || raw.image || raw.mediaUrl || raw.ImageUrl || raw.Image || '';
  const isInvalidImage = !rawImage || rawImage.includes('placeholder.png') || rawImage.includes('placeholder');
  const appId = String(raw.id || raw.solutionId || 'home').toLowerCase();
  const fallbackImage = solutionPortfolioImages[appId] || applicationImages[appId] || applicationImages['home'] || '';

  const finalImg = isInvalidImage ? fallbackImage : (rawImage.startsWith('data:') ? rawImage : resolveMediaUrl(rawImage));

  return {
    id: String(raw.id ?? raw.solutionId ?? ''),
    title: raw.title || raw.name || raw.solutionName || raw.Title || 'Security Solution',
    description: raw.description || raw.shortDescription || raw.Description || 'Comprehensive surveillance planning and application-led product selection.',
    application: raw.application || raw.targetEnvironment || raw.categoryName || raw.Application || 'General Security',
    categoryId: String(raw.categoryId || raw.category || raw.CategoryId || 'cctv-cameras'),
    image: finalImg,
    imageUrl: finalImg,
    features: Array.isArray(raw.features || raw.Features) && (raw.features || raw.Features).length > 0
      ? (raw.features || raw.Features)
      : ['Application-led planning', 'Scalable product selection', 'Sales-assisted recommendation'],
  };
};

export const solutionService = {
  async getAll() {
    return await apiCache.fetchWithCache('solutions_all', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/solutions`, {
          headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          return list.map(mapSolutionFromApi);
        }
      } catch (e) {
        console.warn('Failed to fetch solutions from backend:', e.message);
      }

      return [];
    }, 15 * 60 * 1000);
  },

  // 2. GET (ById)
  async getById(id) {
    if (!id) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/solutions/${id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        return mapSolutionFromApi(data?.data || data);
      }
    } catch (err) {
      console.warn(`Failed to fetch solution ${id}:`, err.message);
    }

    return null;
  },

  // 3. UPLOAD IMAGE
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/api/solutions/upload-image`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error(`Image upload failed (${response.status})`);
    const data = await response.json();
    return data.imageUrl || data.ImageUrl;
  },

  // 4. POST (Create)
  async create(solutionData) {
    const response = await fetch(`${API_BASE_URL}/api/solutions`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(solutionData)
    });
    if (!response.ok) throw new Error(`Failed to create solution (${response.status})`);
    const data = await response.json();
    return mapSolutionFromApi(data?.data || data);
  },

  // 4. PUT (Update)
  async update(id, solutionData) {
    const response = await fetch(`${API_BASE_URL}/api/solutions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(solutionData)
    });
    if (!response.ok) throw new Error(`Failed to update solution ${id} (${response.status})`);
    const data = await response.json();
    return mapSolutionFromApi(data?.data || data);
  },

  // 5. DELETE
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/api/solutions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok && response.status !== 204) throw new Error(`Failed to delete solution ${id}`);
    return true;
  },

  // Alias helpers
  async list() {
    return await this.getAll();
  },
  async get(id) {
    return await this.getById(id);
  },
};
