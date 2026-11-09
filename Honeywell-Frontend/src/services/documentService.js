import axios from 'axios';
import { getApiDomain } from '../utils/apiConfig';
import { apiCache } from '../utils/apiCache';
import { getAdminToken } from '../utils/rbac';
import {
  saveDocFile,
  getDocFile,
  deleteDocFile,
  getLocalMetadataList,
  saveLocalMetadataList,
} from '../utils/documentStorage';

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
    let apiList = [];
    try {
      const response = await api.get('/api/documents', { params });
      apiList = unwrapList(response);
    } catch {
      apiList = [];
    }

    // Merge with locally stored metadata
    const stored = getLocalMetadataList();
    const mergedMap = new Map();

    // 1. Add API items
    apiList.forEach((item) => {
      if (item && item.id) mergedMap.set(String(item.id), item);
    });

    // 2. Merge local items
    stored.forEach((item) => {
      if (item && item.id && !mergedMap.has(String(item.id))) {
        mergedMap.set(String(item.id), item);
      }
    });

    let result = Array.from(mergedMap.values());

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
    let list = [];

    // 1. Try dedicated product endpoint
    try {
      const response = await api.get(`/api/products/${productId}/documents`);
      list = unwrapList(response);
    } catch {
      list = [];
    }

    // 2. Fallback: Try general documents endpoint with productId query param
    if (list.length === 0) {
      try {
        const response = await api.get('/api/documents', { params: { productId } });
        list = unwrapList(response);
      } catch {
        list = [];
      }
    }

    // 3. Fallback: Merge with local storage uploads for this product
    const stored = getLocalMetadataList().filter(
      (d) => String(d.productId) === String(productId)
    );

    const mergedMap = new Map();
    list.forEach((item) => {
      if (item && item.id) mergedMap.set(String(item.id), item);
    });
    stored.forEach((item) => {
      if (item && item.id && !mergedMap.has(String(item.id))) {
        mergedMap.set(String(item.id), item);
      }
    });

    return Array.from(mergedMap.values());
  },

  /**
   * GET /api/documents/{id}
   */
  async getById(id) {
    if (!id) return null;
    try {
      const response = await api.get(`/api/documents/${id}`);
      const item = unwrapItem(response);
      if (item && item.id) return item;
    } catch {
      // Fallback
    }

    const stored = getLocalMetadataList();
    return stored.find((d) => String(d.id) === String(id)) || null;
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
    let savedItem = null;

    // 1. Try backend upload
    try {
      const fd = this.buildFormData(productId, docData, file, false);
      const response = await api.post(`/api/products/${productId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      savedItem = unwrapItem(response);
    } catch (err) {
      console.warn('Backend document upload failed, using storage sync fallback:', err.message);
    }

    const docId = savedItem?.id || Date.now();

    // 2. Persist binary file in IndexedDB
    if (file) {
      await saveDocFile(docId, file);
    }

    // 3. Persist metadata in localStorage
    const docRecord = {
      id: docId,
      productId: Number(productId),
      productName: docData.productName || '',
      category: docData.category,
      title: docData.title,
      description: docData.description || '',
      revision: docData.revision || '',
      language: docData.language || 'English',
      documentDate: docData.documentDate || new Date().toISOString(),
      status: docData.status || 'Active',
      sortOrder: docData.sortOrder || 0,
      fileUrl: savedItem?.fileUrl || `/api/documents/${docId}/download`,
      originalFileName: file?.name || savedItem?.originalFileName || `${docData.title}.pdf`,
      fileSize: file?.size || savedItem?.fileSize || 0,
      mimeType: 'application/pdf',
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasLocalFile: Boolean(file),
    };

    const current = getLocalMetadataList();
    const updated = [docRecord, ...current.filter((d) => String(d.id) !== String(docId))];
    saveLocalMetadataList(updated);

    apiCache.invalidate('documents');
    apiCache.invalidate('products');
    apiCache.invalidate(`product_${productId}`);

    return docRecord;
  },

  /**
   * PUT /api/documents/{id}
   */
  async update(id, docData, file = null, keepExistingFile = true) {
    let savedItem = null;

    if (file) {
      await saveDocFile(id, file);
    }

    try {
      const fd = this.buildFormData(docData.productId, docData, file, keepExistingFile);
      const response = await api.put(`/api/documents/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      savedItem = unwrapItem(response);
    } catch (err) {
      console.warn('Backend document update failed, syncing locally:', err.message);
    }

    const current = getLocalMetadataList();
    const existing = current.find((d) => String(d.id) === String(id));
    const updatedRecord = {
      ...(existing || {}),
      ...(savedItem || {}),
      ...docData,
      id: Number(id),
      originalFileName: file?.name || savedItem?.originalFileName || existing?.originalFileName || `${docData.title}.pdf`,
      fileSize: file?.size || savedItem?.fileSize || existing?.fileSize || 0,
      hasLocalFile: Boolean(file || existing?.hasLocalFile),
      updatedAt: new Date().toISOString(),
    };

    const nextList = [updatedRecord, ...current.filter((d) => String(d.id) !== String(id))];
    saveLocalMetadataList(nextList);

    apiCache.invalidate('documents');
    apiCache.invalidate('products');
    if (docData.productId) {
      apiCache.invalidate(`product_${docData.productId}`);
    }

    return updatedRecord;
  },

  /**
   * DELETE /api/documents/{id}
   */
  async delete(id) {
    try {
      await api.delete(`/api/documents/${id}`);
    } catch (err) {
      console.warn('Backend document delete failed, removing locally:', err.message);
    }

    await deleteDocFile(id);

    const current = getLocalMetadataList();
    const target = current.find((d) => String(d.id) === String(id));
    const nextList = current.filter((d) => String(d.id) !== String(id));
    saveLocalMetadataList(nextList);

    apiCache.invalidate('documents');
    apiCache.invalidate('products');
    if (target?.productId) {
      apiCache.invalidate(`product_${target.productId}`);
    }

    return true;
  },

  /**
   * PATCH /api/documents/{id}/status
   */
  async updateStatus(id, status) {
    try {
      await api.patch(`/api/documents/${id}/status`, { status });
    } catch (err) {
      console.warn('Backend document status update failed, syncing locally:', err.message);
    }

    const current = getLocalMetadataList();
    const updated = current.map((d) =>
      String(d.id) === String(id) ? { ...d, status, updatedAt: new Date().toISOString() } : d
    );
    saveLocalMetadataList(updated);

    apiCache.invalidate('documents');
    apiCache.invalidate('products');
    return { id, status };
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
   * Seamlessly checks IndexedDB for local file first, then falls back to backend stream
   */
  async openPreview(id) {
    try {
      const localFile = await getDocFile(id);
      if (localFile) {
        const blobUrl = URL.createObjectURL(localFile);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
        return true;
      }
    } catch (e) {
      console.warn('Could not load local file for preview:', e);
    }

    window.open(this.getViewUrl(id), '_blank', 'noopener,noreferrer');
    return true;
  },

  /**
   * Trigger download programmatically
   * Seamlessly checks IndexedDB for local file first, then falls back to backend stream
   */
  async download(id, fileName = 'document.pdf') {
    const finalName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

    try {
      const localFile = await getDocFile(id);
      if (localFile) {
        const blobUrl = URL.createObjectURL(localFile);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = finalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return true;
      }
    } catch (e) {
      console.warn('Could not load local file for download:', e);
    }

    try {
      const downloadUrl = this.getDownloadUrl(id);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = finalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (err) {
      console.warn(`Download trigger failed for id ${id}:`, err);
      window.open(this.getDownloadUrl(id), '_blank', 'noopener,noreferrer');
      return true;
    }
  },
};
