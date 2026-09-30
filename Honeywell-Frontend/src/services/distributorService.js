import { apiRequest } from './api';

/**
 * Maps raw backend distributor object to clean frontend data model
 */
export const mapDistributorFromApi = (item) => {
  if (!item) return null;

  const productLines = Array.isArray(item.productLines)
    ? item.productLines
    : (item.productCategories || item.productLines || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    id: item.id,
    name: item.name || item.companyName || '',
    companyName: item.name || item.companyName || '',
    partnerType: item.partnerType || item.tier || item.type || 'Authorized Distributor',
    tier: item.partnerType || item.tier || item.type || 'Authorized Distributor',
    badgeText: item.badgeText || (item.isVerified ? 'Official Verified' : ''),
    region: item.region || '',
    territory: item.territory || item.city || '',
    city: item.territory || item.city || '',
    coverageLocations: item.coverageLocations || item.state || '',
    state: item.coverageLocations || item.state || '',
    address: item.address || '',
    contactPerson: item.contactPerson || '',
    contactTitle: item.contactTitle || item.designation || 'Channel Lead',
    designation: item.contactTitle || item.designation || 'Channel Lead',
    phone: item.phone || item.mobile || '',
    email: item.email || '',
    gstin: item.gstin || '',
    productCategories: item.productCategories || (Array.isArray(item.productLines) ? item.productLines.join(', ') : ''),
    productLines: productLines.length > 0 ? productLines : ['CCTV Video Surveillance', 'Security Systems'],
    dispatchSla: item.dispatchSla || '24-48 Hours Express',
    bufferCapacity: item.bufferCapacity || item.warehouseCapacity || 'Standard Buffer Stock',
    warehouseCapacity: item.bufferCapacity || item.warehouseCapacity || 'Standard Buffer Stock',
    commercialTerms: item.commercialTerms || item.paymentTerms || 'Wholesale Commercial Terms',
    paymentTerms: item.commercialTerms || item.paymentTerms || 'Wholesale Commercial Terms',
    rating: item.rating || '4.8/5 (Verified)',
    description: item.description || '',
    isVerified: item.isVerified !== undefined ? Boolean(item.isVerified) : true,
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    displayOrder: typeof item.displayOrder === 'number' ? item.displayOrder : 0,
    createdAt: item.createdAt || new Date().toISOString()
  };
};

/**
 * Maps frontend form data to exact Swagger DistributorUpsertDto schema
 */
export const mapDistributorToApi = (form) => {
  const productCats = Array.isArray(form.productCategories)
    ? form.productCategories.join(', ')
    : form.productCategories || (Array.isArray(form.productLines) ? form.productLines.join(', ') : '') || '';

  return {
    name: (form.name || form.companyName || '').trim(),
    partnerType: (form.partnerType || form.tier || form.type || 'Authorized Distributor').trim(),
    badgeText: (form.badgeText || '').trim(),
    region: (form.region || '').trim(),
    territory: (form.territory || form.city || '').trim(),
    coverageLocations: (form.coverageLocations || form.state || '').trim(),
    address: (form.address || '').trim(),
    contactPerson: (form.contactPerson || '').trim(),
    contactTitle: (form.contactTitle || form.designation || '').trim(),
    phone: (form.phone || '').trim(),
    email: (form.email || '').trim(),
    gstin: (form.gstin || '').trim().toUpperCase(),
    productCategories: productCats.trim(),
    dispatchSla: (form.dispatchSla || '').trim(),
    bufferCapacity: (form.bufferCapacity || form.warehouseCapacity || '').trim(),
    commercialTerms: (form.commercialTerms || form.paymentTerms || '').trim(),
    rating: (form.rating || '').trim(),
    description: (form.description || '').trim(),
    isVerified: Boolean(form.isVerified),
    isActive: form.isActive !== undefined ? Boolean(form.isActive) : true,
    displayOrder: Number(form.displayOrder) || 0
  };
};

/**
 * Gets authentication headers for admin endpoints
 */
function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const distributorService = {
  /**
   * STEP 3 — GET /api/Distributors
   * Public Business Directory
   * Query params: search, region, type, category, isVerified
   */
  async getDistributors(params = {}) {
    const query = new URLSearchParams();
    if (params.search && params.search.trim()) query.append('search', params.search.trim());
    if (params.region && params.region.trim() && params.region !== 'All') query.append('region', params.region.trim());
    if (params.type && params.type.trim() && params.type !== 'All') query.append('type', params.type.trim());
    if (params.category && params.category.trim() && params.category !== 'All') query.append('category', params.category.trim());
    if (params.isVerified !== undefined && params.isVerified !== '' && params.isVerified !== null) {
      query.append('isVerified', String(params.isVerified));
    }
    query.append('_t', String(Date.now()));

    const queryString = query.toString();
    const endpoint = queryString ? `/api/Distributors?${queryString}` : '/api/Distributors';

    try {
      const data = await apiRequest(endpoint);
      const rawList = Array.isArray(data) ? data : (data.data || data.items || data.distributors || []);
      return rawList.map(mapDistributorFromApi).filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch distributors from API:', err);
      throw err;
    }
  },

  /**
   * STEP 4 — GET /api/Distributors/{id}
   * Distributor Details
   */
  async getDistributorById(id) {
    if (!id) throw new Error('Distributor ID is required.');
    try {
      const data = await apiRequest(`/api/Distributors/${id}`);
      const rawItem = data && data.data ? data.data : data;
      return mapDistributorFromApi(rawItem);
    } catch (err) {
      console.error(`Failed to fetch distributor #${id} details:`, err);
      throw err;
    }
  },

  /**
   * STEP 5 — GET /api/Distributors/regions
   * Populates Region Filter Dropdown
   */
  async getRegions() {
    try {
      const data = await apiRequest('/api/Distributors/regions');
      const list = Array.isArray(data) ? data : (data.data || data.items || data.regions || []);
      return list.filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch distributor regions from API:', err);
      throw err;
    }
  },

  /**
   * STEP 6 — GET /api/Distributors/types
   * Populates Partner/Dealer Type Dropdown
   */
  async getPartnerTypes() {
    try {
      const data = await apiRequest('/api/Distributors/types');
      const list = Array.isArray(data) ? data : (data.data || data.items || data.types || []);
      return list.filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch distributor types from API:', err);
      throw err;
    }
  },

  /**
   * STEP 7 — POST /api/Distributors/quote-request
   * Payload: DistributorQuoteRequestDto
   */
  async submitQuoteRequest(payload) {
    const body = {
      distributorId: payload.distributorId ? Number(payload.distributorId) : null,
      distributorName: payload.distributorName || payload.companyName || '',
      name: (payload.name || '').trim(),
      mobile: (payload.mobile || payload.phone || '').trim(),
      email: (payload.email || '').trim(),
      companyName: (payload.companyName || '').trim(),
      productRequirement: (payload.productRequirement || payload.requirement || payload.product || '').trim(),
      quantity: payload.quantity ? Number(payload.quantity) : 1,
      notes: (payload.notes || payload.message || '').trim()
    };

    try {
      const data = await apiRequest('/api/Distributors/quote-request', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return data;
    } catch (err) {
      console.error('Failed to submit distributor quote request:', err);
      throw err;
    }
  },

  /**
   * STEP 8 — GET /api/Distributors/admin/all
   * Admin: Returns all distributors (active & inactive)
   */
  async getAdminDistributors(params = {}) {
    const query = new URLSearchParams();
    if (params.search && params.search.trim()) query.append('search', params.search.trim());
    if (params.region && params.region.trim() && params.region !== 'All') query.append('region', params.region.trim());
    query.append('_t', String(Date.now()));

    const queryString = query.toString();
    const endpoint = queryString ? `/api/Distributors/admin/all?${queryString}` : '/api/Distributors/admin/all';

    try {
      const data = await apiRequest(endpoint, {
        headers: getAuthHeaders()
      });
      const rawList = Array.isArray(data) ? data : (data.data || data.items || data.distributors || []);
      return rawList.map(mapDistributorFromApi).filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch admin distributors from API:', err);
      throw err;
    }
  },

  /**
   * STEP 9 — POST /api/Distributors
   * Admin: Add new distributor
   */
  async createDistributor(payload) {
    const body = mapDistributorToApi(payload);
    try {
      const data = await apiRequest('/api/Distributors', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      this.notifySync();
      return data;
    } catch (err) {
      console.error('Failed to create distributor:', err);
      throw err;
    }
  },

  /**
   * STEP 10 — PUT /api/Distributors/{id}
   * Admin: Update existing distributor
   */
  async updateDistributor(id, payload) {
    if (!id) throw new Error('Distributor ID is required for update.');
    const body = mapDistributorToApi(payload);
    try {
      const data = await apiRequest(`/api/Distributors/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      this.notifySync();
      return data;
    } catch (err) {
      console.error(`Failed to update distributor #${id}:`, err);
      throw err;
    }
  },

  /**
   * STEP 11 — PATCH /api/Distributors/{id}/toggle-status
   * Admin: Toggle Active/Inactive status
   */
  async toggleDistributorStatus(id) {
    if (!id) throw new Error('Distributor ID is required.');
    try {
      const data = await apiRequest(`/api/Distributors/${id}/toggle-status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      this.notifySync();
      return data;
    } catch (err) {
      console.error(`Failed to toggle status for distributor #${id}:`, err);
      throw err;
    }
  },

  /**
   * STEP 12 — PATCH /api/Distributors/{id}/display-order?displayOrder={order}
   * Admin: Update display order
   */
  async updateDistributorDisplayOrder(id, displayOrder) {
    if (!id) throw new Error('Distributor ID is required.');
    const orderNum = Number(displayOrder) || 0;
    try {
      const data = await apiRequest(`/api/Distributors/${id}/display-order?displayOrder=${orderNum}`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      this.notifySync();
      return data;
    } catch (err) {
      console.error(`Failed to update display order for distributor #${id}:`, err);
      throw err;
    }
  },

  /**
   * STEP 13 — DELETE /api/Distributors/{id}
   * Admin: Delete distributor
   */
  async deleteDistributor(id) {
    if (!id) throw new Error('Distributor ID is required.');
    try {
      const data = await apiRequest(`/api/Distributors/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      this.notifySync();
      return data;
    } catch (err) {
      console.error(`Failed to delete distributor #${id}:`, err);
      throw err;
    }
  },

  /**
   * Dispatches instant sync events across windows/tabs/components
   */
  notifySync() {
    try {
      window.dispatchEvent(new CustomEvent('distributors_changed'));
      localStorage.setItem('distributors_last_sync', Date.now().toString());
    } catch {}
  }
};

export const distributorApi = distributorService;
export default distributorService;
