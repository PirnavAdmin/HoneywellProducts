import { apiRequest, API_BASE_URL } from './api';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const mapQuoteFromApi = (item) => {
  if (!item) return null;
  const rawId = item.id ?? item.quoteId ?? item._id ?? '';
  return {
    id: String(rawId),
    name: item.name || item.customerName || item.fullName || '',
    companyName: item.companyName || item.company || item.organization || '',
    gstin: item.gstin || item.gstNumber || '',
    email: item.email || item.emailAddress || '',
    mobile: item.mobile || item.phone || item.contactNumber || '',
    product: item.product || item.productName || 'General bulk requirement',
    productId: item.productId ? String(item.productId) : null,
    quantity: Number(item.quantity) || 1,
    location: item.location || item.city || item.siteLocation || '',
    requirement: item.requirement || item.message || item.description || '',
    quoteAmount: item.quoteAmount || item.amount || item.totalAmount || 0,
    status: item.status || 'Pending',
    createdAt: item.createdAt || item.dateCreated || item.createdOn || new Date().toISOString()
  };
};

export const quoteService = {
  /** GET (All) — GET /api/quotes */
  async getAll() {
    try {
      const data = await apiRequest('/api/quotes');
      const list = Array.isArray(data) ? data : (data.quotes || data.items || data.data || []);
      return list.map(mapQuoteFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Quotes API getAll error:', err.message);
      return [];
    }
  },

  /** GET (ById) — GET /api/quotes/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/quotes/${id}`);
      return mapQuoteFromApi(data.quote || data.data || data);
    } catch (err) {
      console.warn(`Quotes API getById(${id}) error:`, err.message);
      throw err;
    }
  },

  /** POST (Create) — POST /api/quotes */
  async submit(payload) {
    const apiPayload = {
      name: payload.name || payload.customerName || '',
      companyName: payload.companyName || payload.company || '',
      gstin: payload.gstin ? payload.gstin.trim().toUpperCase() : '',
      mobile: payload.mobile || payload.phone || '',
      phone: payload.mobile || payload.phone || '',
      email: payload.email || '',
      product: payload.product || payload.productName || 'General bulk requirement',
      productId: payload.productId ? String(payload.productId) : null,
      quantity: Number(payload.quantity) || 1,
      location: payload.location || '',
      requirement: payload.requirement || payload.message || '',
      quoteAmount: Number(payload.quoteAmount || payload.amount || 0),
      status: payload.status || 'Pending'
    };

    const url = `${API_BASE_URL}/api/quotes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      throw new Error(`Failed to submit bulk quote (${response.status})`);
    }

    let resData = null;
    try {
      resData = await response.json();
    } catch (e) {
      resData = null;
    }

    return mapQuoteFromApi(resData?.quote || resData?.data || resData) || { ok: true, payload: apiPayload };
  },

  /** PUT (Update) — PUT /api/quotes/{id} */
  async update(id, updateData) {
    let current = {};
    try {
      current = await this.getById(id);
    } catch (e) {
      console.warn('Could not pre-fetch quote details for update:', e.message);
    }

    const merged = { ...current, ...updateData };
    const apiPayload = {
      id: isNaN(Number(id)) ? id : Number(id),
      name: merged.name || '',
      companyName: merged.companyName || merged.company || '',
      gstin: merged.gstin || '',
      mobile: merged.mobile || merged.phone || '',
      phone: merged.mobile || merged.phone || '',
      email: merged.email || '',
      product: merged.product || 'General bulk requirement',
      productId: merged.productId || null,
      quantity: Number(merged.quantity) || 1,
      location: merged.location || '',
      requirement: merged.requirement || '',
      quoteAmount: Number(merged.quoteAmount || merged.amount || 0),
      status: merged.status || 'Pending'
    };

    const url = `${API_BASE_URL}/api/quotes/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to update quote ${id} (${response.status})`);
    }

    return apiPayload;
  },

  /** DELETE — DELETE /api/quotes/{id} */
  async delete(id) {
    const url = `${API_BASE_URL}/api/quotes/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete quote ${id} (${response.status})`);
    }

    return true;
  }
};

