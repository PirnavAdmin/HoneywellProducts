import axios from 'axios';
import { getApiDomain } from '../utils/apiConfig';
import { apiCache } from '../utils/apiCache';
import { getAdminToken } from '../utils/rbac';

const BASE_URL = getApiDomain();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
});

// Interceptor to inject Authorization header if admin token exists
api.interceptors.request.use((config) => {
  const token = getAdminToken();
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

export const documentService = {
  /**
   * GET /api/documents
   * Supports search, productId, categoryId, category, status, page, pageSize
   */
  async getAll(params = {}) {
    const response = await api.get('/api/documents', { params });
    let result = unwrapList(response);

    // Apply client filters if needed
    if (params.productId) {
      result = result.filter((d) => String(d.productId) === String(params.productId));
    }
    if (params.category) {
      result = result.filter((d) => (d.category || '').toLowerCase() === params.category.toLowerCase());
    }
    if (params.status) {
      result = result.filter((d) => (d.status || 'Active').toLowerCase() === params.status.toLowerCase());
    }

    return result;
  },

  /**
   * GET /api/products/{productId}/documents
   */
  async getByProductId(productId) {
    if (!productId) return [];
    try {
      const response = await api.get(`/api/products/${productId}/documents`);
      const list = unwrapList(response);
      if (list.length > 0) return list;
    } catch {
      // Fallback to query param on /api/documents
    }

    try {
      const response = await api.get('/api/documents', { params: { productId } });
      return unwrapList(response);
    } catch (err) {
      console.warn(`Failed to fetch documents for product ${productId}:`, err.message);
      return [];
    }
  },

  /**
   * GET /api/documents/{id}
   */
  async getById(id) {
    if (!id) return null;
    const response = await api.get(`/api/documents/${id}`);
    const item = unwrapItem(response);
    return (item && item.id) ? item : null;
  },

  /**
   * Build FormData for document upload/update
   */
  buildFormData(productId, docData, file = null, keepExistingFile = true) {
    const fd = new FormData();

    if (productId) {
      fd.append('ProductId', String(productId));
      fd.append('productId', String(productId));
    }

    if (docData.category) {
      fd.append('Category', docData.category);
      fd.append('category', docData.category);
    }

    if (docData.title) {
      fd.append('Title', docData.title);
      fd.append('title', docData.title);
    }

    if (docData.description !== undefined && docData.description !== null) {
      fd.append('Description', docData.description);
    }

    if (docData.revision !== undefined && docData.revision !== null) {
      fd.append('Revision', docData.revision);
    }

    if (docData.language !== undefined && docData.language !== null) {
      fd.append('Language', docData.language);
    }

    if (docData.documentDate) {
      const dateVal = docData.documentDate instanceof Date
        ? docData.documentDate.toISOString()
        : docData.documentDate;
      fd.append('DocumentDate', dateVal);
    }

    if (docData.status) {
      fd.append('Status', docData.status);
    }

    if (docData.sortOrder !== undefined && docData.sortOrder !== null) {
      fd.append('SortOrder', String(docData.sortOrder));
    }

    if (file) {
      fd.append('File', file);
      fd.append('file', file);
    }

    fd.append('KeepExistingFile', keepExistingFile ? 'true' : 'false');

    return fd;
  },

  /**
   * POST /api/products/{productId}/documents
   */
  async create(productId, docData, file) {
    const fd = this.buildFormData(productId, docData, file, false);
    const response = await api.post(`/api/products/${productId}/documents`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const savedItem = unwrapItem(response);

    apiCache.invalidate('documents');
    apiCache.invalidate('products');
    apiCache.invalidate(`product_${productId}`);

    return savedItem;
  },

  /**
   * PUT /api/documents/{id}
   */
  async update(id, docData, file = null, keepExistingFile = true) {
    const fd = this.buildFormData(docData.productId, docData, file, keepExistingFile);
    const response = await api.put(`/api/documents/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const savedItem = unwrapItem(response);

    apiCache.invalidate('documents');
    apiCache.invalidate('products');
    if (docData.productId) {
      apiCache.invalidate(`product_${docData.productId}`);
    }

    return savedItem;
  },

  /**
   * DELETE /api/documents/{id}
   */
  async delete(id, productId = null) {
    const response = await api.delete(`/api/documents/${id}`);

    apiCache.invalidate('documents');
    apiCache.invalidate('products');
    if (productId) {
      apiCache.invalidate(`product_${productId}`);
    }

    return response?.data || true;
  },

  /**
   * PATCH /api/documents/{id}/status
   */
  async updateStatus(id, status) {
    const response = await api.patch(`/api/documents/${id}/status`, { status });

    apiCache.invalidate('documents');
    apiCache.invalidate('products');
    return response?.data || { id, status };
  },

  /**
   * View URL for in-browser PDF preview
   */
  getViewUrl(id) {
    return `${BASE_URL}/api/documents/${id}/view`;
  },

  /**
   * Download URL for PDF download
   */
  getDownloadUrl(id) {
    return `${BASE_URL}/api/documents/${id}/download`;
  },

  /**
   * Open PDF preview in a new browser tab
   */
  async openPreview(id) {
    window.open(this.getViewUrl(id), '_blank', 'noopener,noreferrer');
    return true;
  },

  /**
   * Trigger download programmatically
   */
  async download(id, fileName = 'document.pdf') {
    const finalName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const downloadUrl = this.getDownloadUrl(id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = finalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  },
};
