import { API_BASE_URL } from './api';
import { apiCache } from '../utils/apiCache';
import { applications } from '../data/solutions';
import { applicationImages, solutionPortfolioImages } from '../data/imageLibrary';
import { resolveMediaUrl } from '../utils/apiConfig';

export const mapSolutionFromApi = (raw = {}) => {
  const rawImage = raw.imageUrl || raw.image || raw.mediaUrl || raw.ImageUrl || raw.Image || '';
  const isInvalidImage = !rawImage || rawImage.includes('placeholder.png') || rawImage.includes('placeholder');
  const appId = String(raw.id || raw.solutionId || 'home').toLowerCase();
  const fallbackImage = solutionPortfolioImages[appId] || applicationImages[appId] || applicationImages['home'] || '/assets/images/smart-technology-trends.png';

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

function getLocalFallbackSolutions() {
  const customSolutions = [
    {
      id: 'home',
      title: 'Residential & Smart Home Security',
      description: 'Complete home surveillance and access control for modern residences.',
      application: 'Residential Security',
      categoryId: 'cctv-cameras',
      image: solutionPortfolioImages['home'] || '/assets/images/catalog/solution-residential.jpg',
      imageUrl: solutionPortfolioImages['home'] || '/assets/images/catalog/solution-residential.jpg',
      features: ['Smart Wi-Fi Cameras', 'Doorbell Integration', 'Mobile Motion Alerts']
    },
    {
      id: 'office',
      title: 'Corporate Office & Facility Protection',
      description: 'Access control, time attendance, and IP video surveillance for modern workplaces.',
      application: 'Office Security',
      categoryId: 'networking',
      image: solutionPortfolioImages['office'] || '/assets/images/catalog/solution-office.jpg',
      imageUrl: solutionPortfolioImages['office'] || '/assets/images/catalog/solution-office.jpg',
      features: ['Biometric Entry Control', 'Centralized NVR Recording', 'Visitor Management']
    },
    {
      id: 'retail',
      title: 'Retail Store & Loss Prevention',
      description: 'High-definition video monitoring to prevent shoplifting and audit cashier points.',
      application: 'Retail & POS Security',
      categoryId: 'dome-camera',
      image: solutionPortfolioImages['retail'] || '/assets/images/catalog/solution-retail.jpg',
      imageUrl: solutionPortfolioImages['retail'] || '/assets/images/catalog/solution-retail.jpg',
      features: ['POS Cashier Overlay', 'Foot-Traffic Analytics', '360° Dome Coverage']
    },
    {
      id: 'factory',
      title: 'Industrial & Manufacturing Safety',
      description: 'Heavy-duty explosion-proof cameras and perimeter intrusion monitoring.',
      application: 'Industrial Security',
      categoryId: 'ip-camera',
      image: solutionPortfolioImages['factory'] || '/assets/images/catalog/solution-industrial.jpg',
      imageUrl: solutionPortfolioImages['factory'] || '/assets/images/catalog/solution-industrial.jpg',
      features: ['Thermal Perimeter Monitoring', 'Heavy Duty Enclosures', 'Automated AI Alerts']
    }
  ];

  return customSolutions;
}

export const solutionService = {
  async getAll() {
    if (import.meta.env.VITE_ADMIN_DATA_MODE === 'mock') {
      return getLocalFallbackSolutions();
    }
    return await apiCache.fetchWithCache('solutions_all', async () => {
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
        // Fallthrough to local applications data
      }

      return getLocalFallbackSolutions();
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

  // 3. UPLOAD IMAGE
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/api/solutions/upload-image`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
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
