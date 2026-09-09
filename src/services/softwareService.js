import axios from 'axios';
import { getApiDomain } from '../utils/apiConfig';
import {
  getSoftwareFromStore,
  getSoftwareByProductIdFromStore,
  upsertSoftwareInStore,
  deleteSoftwareFromStore,
} from '../admin/catalog/softwareStore';

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
      if (apiItems && apiItems.length >= 0) {
        return {
          items: apiItems,
          totalCount: apiItems.length,
          page: params.page || 1,
          pageSize: params.pageSize || 50,
          totalPages: 1,
        };
      }
    } catch (err) {
      console.warn('GET /api/software API call failed, using fallback store:', err.message);
    }

    // Client-side fallback store filtering
    let items = getSoftwareFromStore();
    if (params.status) {
      items = items.filter((item) => (item.status || 'Active').toLowerCase() === params.status.toLowerCase());
    }
    if (params.softwareType) {
      items = items.filter((item) => (item.softwareType || '').toLowerCase() === params.softwareType.toLowerCase());
    }
    if (params.platform) {
      items = items.filter((item) => (item.platform || '').toLowerCase() === params.platform.toLowerCase());
    }
    if (params.productId) {
      items = items.filter((item) => String(item.productId) === String(params.productId));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (item) =>
          (item.softwareName || '').toLowerCase().includes(q) ||
          (item.productName || '').toLowerCase().includes(q) ||
          (item.productModel || '').toLowerCase().includes(q) ||
          (item.version || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q)
      );
    }
    return {
      items,
      totalCount: items.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
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
      console.warn(`GET /api/software/${id} API call failed, using fallback store:`, err.message);
    }

    const items = getSoftwareFromStore();
    return items.find((item) => String(item.id) === String(id)) || null;
  },

  /**
   * GET /api/products/{productId}/software
   */
  async getByProductId(productId) {
    if (!productId) return [];
    try {
      const response = await api.get(`/api/products/${productId}/software`);
      const apiItems = unwrapList(response);
      if (apiItems) {
        return apiItems;
      }
    } catch (err) {
      console.warn(`GET /api/products/${productId}/software failed, using fallback store:`, err.message);
    }

    return getSoftwareByProductIdFromStore(productId);
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

    try {
      const response = await api.post('/api/software', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const saved = unwrapItem(response);
      if (saved) upsertSoftwareInStore(saved);
      return saved;
    } catch (err) {
      console.warn('POST /api/software failed, saving locally:', err.message);
      let fileUrl = softwareData.fileUrl || '';
      if (file) {
        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      }
      const payload = {
        ...softwareData,
        fileUrl,
        fileSize: file ? file.size : softwareData.fileSize || 0,
      };
      return upsertSoftwareInStore(payload);
    }
  },

  /**
   * PUT /api/software/{id}
   */
  async update(id, softwareData, file = null, keepExistingFile = false) {
    const fd = this.buildFormData(softwareData, file, keepExistingFile);
    if (id) fd.append('Id', id);

    try {
      const response = await api.put(`/api/software/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const saved = unwrapItem(response);
      if (saved) upsertSoftwareInStore(saved);
      return saved;
    } catch (err) {
      console.warn(`PUT /api/software/${id} failed, updating locally:`, err.message);
      const payload = {
        ...softwareData,
        id,
        fileSize: file ? file.size : softwareData.fileSize || 0,
      };
      return upsertSoftwareInStore(payload);
    }
  },

  /**
   * DELETE /api/software/{id}
   */
  async delete(id) {
    try {
      await api.delete(`/api/software/${id}`);
    } catch (err) {
      console.warn(`DELETE /api/software/${id} failed, deleting locally:`, err.message);
    }
    deleteSoftwareFromStore(id);
  },

  /**
   * PATCH /api/software/{id}/status
   */
  async updateStatus(id, status) {
    try {
      const response = await api.patch(`/api/software/${id}/status`, { status });
      const updated = unwrapItem(response);
      if (updated) upsertSoftwareInStore(updated);
      return updated;
    } catch (err) {
      console.warn(`PATCH /api/software/${id}/status failed:`, err.message);
      const item = await this.getById(id);
      if (item) {
        const updated = { ...item, status };
        upsertSoftwareInStore(updated);
        return updated;
      }
    }
  },
};
