import { API_BASE_URL } from './api';
import { applications } from '../data/solutions';
import { applicationImages } from '../data/imageLibrary';

export const mapSolutionFromApi = (raw = {}) => {
  const rawImage = raw.imageUrl || raw.image || raw.mediaUrl || '';
  const isInvalidImage = !rawImage || rawImage.includes('placeholder.png') || rawImage.includes('placeholder');
  const appId = String(raw.id || raw.solutionId || 'home').toLowerCase();
  const fallbackImage = applicationImages[appId] || applicationImages['home'] || '/honeywell-products-logo.png';

  return {
    id: String(raw.id ?? raw.solutionId ?? ''),
    title: raw.title || raw.name || raw.solutionName || 'Security Solution',
    description: raw.description || raw.shortDescription || 'Comprehensive surveillance planning and application-led product selection.',
    application: raw.application || raw.targetEnvironment || raw.categoryName || 'General Security',
    categoryId: String(raw.categoryId || raw.category || 'cctv-cameras'),
    image: isInvalidImage ? fallbackImage : rawImage,
    imageUrl: isInvalidImage ? fallbackImage : rawImage,
    features: Array.isArray(raw.features) && raw.features.length > 0
      ? raw.features
      : ['Application-led planning', 'Scalable product selection', 'Sales-assisted recommendation'],
  };
};

export const solutionService = {
  // 1. GET (All)
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/solutions`, {
        headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        if (list.length > 0) return list.map(mapSolutionFromApi);
      }
    } catch (e) {
      // Quiet fallback if server endpoint is unavailable
    }

    return applications.map(a => ({
      id: a.id,
      title: a.name,
      description: a.description,
      application: a.name,
      categoryId: a.categoryId,
      image: a.image || applicationImages[a.id] || '/honeywell-products-logo.png',
      imageUrl: a.image || applicationImages[a.id] || '/honeywell-products-logo.png',
      features: ['Application-led planning', 'Scalable product selection', 'Sales-assisted recommendation']
    }));
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
      // Quiet fallback
    }

    const found = applications.find(a => String(a.id) === String(id));
    if (!found) return null;
    return {
      id: found.id,
      title: found.name,
      description: found.description,
      application: found.name,
      categoryId: found.categoryId,
      image: found.image || applicationImages[found.id] || '/honeywell-products-logo.png',
      imageUrl: found.image || applicationImages[found.id] || '/honeywell-products-logo.png',
      features: ['Application-led planning', 'Scalable product selection', 'Sales-assisted recommendation']
    };
  },

  // 3. POST (Create)
  async create(solutionData) {
    const response = await fetch(`${API_BASE_URL}/api/solutions`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
      headers: { 'ngrok-skip-browser-warning': 'true' }
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
