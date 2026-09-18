import axios from 'axios';
import { getApiDomain } from '../utils/apiConfig';


const BASE_URL = getApiDomain();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
});

// Interceptor to inject Authorization header if admin token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

const unwrapList = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

const unwrapItem = (response) => {
  const data = response?.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data?.data ?? data;
  }
  return data ?? {};
};

export const softwareService = {
  /**
   * GET /api/software
   * Supports search, productId, categoryId, softwareType, platform, featured, status, page, pageSize
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/api/software', { params });
      const data = response?.data;

      // Handle paged API structure { items, totalCount, page, pageSize, totalPages }
      if (data && Array.isArray(data.items)) {
        return {
          items: data.items,
          totalCount: data.totalCount ?? data.items.length,
          page: data.page ?? params.page ?? 1,
          pageSize: data.pageSize ?? params.pageSize ?? 50,
          totalPages: data.totalPages ?? Math.ceil((data.totalCount || data.items.length) / (params.pageSize || 50)),
        };
      }

      const apiItems = unwrapList(response);
      return {
        items: apiItems,
        totalCount: apiItems.length,
        page: params.page || 1,
        pageSize: params.pageSize || 50,
        totalPages: 1,
      };
    } catch (err) {
      console.warn('GET /api/software API call failed:', err.message);
      return {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
      };
    }
  },

  /**
   * GET /api/software/{id}
   */
  async getById(id) {
    try {
      const response = await api.get(`/api/software/${id}`);
      const item = unwrapItem(response);
      if (item && (item.id || item.softwareId)) return item;
    } catch (err) {
      console.warn(`GET /api/software/${id} API call failed:`, err.message);
    }
    return null;
  },

  /**
   * GET /api/products/{productId}/software
   */
  async getByProductId(productId) {
    if (!productId) return [];
    try {
      const response = await api.get(`/api/products/${productId}/software`);
      return unwrapList(response) || [];
    } catch (err) {
      console.warn(`GET /api/products/${productId}/software failed:`, err.message);
      return [];
    }
  },

  /**
   * GET /api/software/{id}/download
   */
  getDownloadUrl(id) {
    return `${BASE_URL}/api/software/${id}/download`;
  },

  async download(id, externalUrl = null) {
    const downloadUrl = `${BASE_URL}/api/software/${id}/download`;
    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (err) {
      console.warn(`Download trigger for /api/software/${id}/download failed:`, err);
      if (externalUrl) {
        window.open(externalUrl, '_blank', 'noopener,noreferrer');
        return true;
      }
      return false;
    }
  },

  /**
   * Build FormData using exact Swagger DTO PascalCase key names
   */
  buildFormData(softwareData, file = null, keepExistingFile = false) {
    const fd = new FormData();

    const mapping = {
      productId: 'ProductId',
      ProductId: 'ProductId',
      softwareName: 'SoftwareName',
      SoftwareName: 'SoftwareName',
      description: 'Description',
      Description: 'Description',
      softwareType: 'SoftwareType',
      SoftwareType: 'SoftwareType',
      version: 'Version',
      Version: 'Version',
      platform: 'Platform',
      Platform: 'Platform',
      architecture: 'Architecture',
      Architecture: 'Architecture',
      externalUrl: 'ExternalUrl',
      ExternalUrl: 'ExternalUrl',
      releaseDate: 'ReleaseDate',
      ReleaseDate: 'ReleaseDate',
      releaseNotes: 'ReleaseNotes',
      ReleaseNotes: 'ReleaseNotes',
      minimumRequirements: 'MinimumRequirements',
      MinimumRequirements: 'MinimumRequirements',
      status: 'Status',
      Status: 'Status',
      isFeatured: 'IsFeatured',
      IsFeatured: 'IsFeatured',
      sortOrder: 'SortOrder',
      SortOrder: 'SortOrder',
    };

    const keysProcessed = new Set();

    Object.keys(softwareData).forEach((key) => {
      const targetKey = mapping[key] || key;
      if (keysProcessed.has(targetKey)) return;
      keysProcessed.add(targetKey);

      const val = softwareData[key];
      if (val !== undefined && val !== null) {
        fd.append(targetKey, val);
      }
    });

    if (file) {
      fd.append('File', file);
    }

    if (keepExistingFile) {
      fd.append('KeepExistingFile', 'true');
    }

    return fd;
  },

  /**
   * POST /api/software
   */
  async create(softwareData, file = null) {
    const fd = this.buildFormData(softwareData, file);
    const response = await api.post('/api/software', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapItem(response);
  },

  /**
   * PUT /api/software/{id}
   */
  async update(id, softwareData, file = null, keepExistingFile = false) {
    const fd = this.buildFormData(softwareData, file, keepExistingFile);
    if (id) fd.append('Id', id);

    const response = await api.put(`/api/software/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapItem(response);
  },

  /**
   * DELETE /api/software/{id}
   */
  async delete(id) {
    await api.delete(`/api/software/${id}`);
    return true;
  },

  /**
   * PATCH /api/software/{id}/status
   */
  async updateStatus(id, status) {
    const response = await api.patch(`/api/software/${id}/status`, { status });
    return unwrapItem(response);
  },
};
