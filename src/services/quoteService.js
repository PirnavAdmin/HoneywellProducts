import { apiRequest, API_BASE_URL } from './api';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const STORAGE_KEY = 'sat_quotes_store';

const getLocalQuotes = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalQuotes = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sat_quotes_updated'));
    }
  } catch (e) {
    console.warn('Failed to write to localStorage for quotes:', e);
  }
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
    quoteAmount: Number(item.quoteAmount || item.amount || item.totalAmount || 0),
    status: item.status || 'Pending',
    createdAt: item.createdAt || item.dateCreated || item.createdOn || new Date().toISOString()
  };
};

export const quoteService = {
  /** GET (All) — GET /api/quotes */
  async getAll() {
    let apiList = [];
    try {
      const data = await apiRequest('/api/quotes');
      const rawList = Array.isArray(data) ? data : (data.quotes || data.items || data.data || []);
      apiList = rawList.map(mapQuoteFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Quotes API getAll error:', err.message);
    }

    const localList = getLocalQuotes().map(mapQuoteFromApi).filter(Boolean);

    const mergedMap = new Map();
    localList.forEach((item) => { if (item.id) mergedMap.set(item.id, item); });
    apiList.forEach((item) => { if (item.id) mergedMap.set(item.id, item); });

    const combined = Array.from(mergedMap.values());
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return combined;
  },

  /** GET (ById) — GET /api/quotes/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/quotes/${id}`);
      const mapped = mapQuoteFromApi(data.quote || data.data || data);
      if (mapped) return mapped;
    } catch (err) {
      console.warn(`Quotes API getById(${id}) error:`, err.message);
    }
    const local = getLocalQuotes().find((item) => String(item.id) === String(id));
    return local ? mapQuoteFromApi(local) : null;
  },

  /** POST (Create) — POST /api/quotes */
  async submit(payload) {
    const generatedId = `QTE-${Date.now()}`;
    const newQuote = {
      id: generatedId,
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
      status: payload.status || 'Pending',
      createdAt: new Date().toISOString()
    };

    // 1. Immediately store in localStorage so Admin panel reflects it even if backend API fails or is 404
    const currentLocal = getLocalQuotes();
    const updatedLocal = [newQuote, ...currentLocal.filter(item => item.id !== generatedId)];
    saveLocalQuotes(updatedLocal);

    // 2. Send to backend API
    try {
      const url = `${API_BASE_URL}/api/quotes`;
      const response = await fetch(url, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(newQuote)
      });

      if (response.ok) {
        let resData = null;
        try { resData = await response.json(); } catch (e) { resData = null; }
        const mapped = mapQuoteFromApi(resData?.quote || resData?.data || resData);
        if (mapped && mapped.id && mapped.id !== generatedId) {
          const latestLocal = getLocalQuotes().map(item => item.id === generatedId ? mapped : item);
          saveLocalQuotes(latestLocal);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Backend quote submission warning, retained in local store:', err.message);
    }

    return newQuote;
  },

  /** PUT (Update) — PUT /api/quotes/{id} */
  async update(id, updateData) {
    let current = await this.getById(id) || {};
    const merged = { ...current, ...updateData };

    const currentLocal = getLocalQuotes();
    const updatedLocal = currentLocal.map(item => String(item.id) === String(id) ? merged : item);
    saveLocalQuotes(updatedLocal);

    try {
      const url = `${API_BASE_URL}/api/quotes/${id}`;
      await fetch(url, {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(merged)
      });
    } catch (err) {
      console.warn(`Backend quote update(${id}) failed, updated in local store:`, err.message);
    }

    return merged;
  },

  /** DELETE — DELETE /api/quotes/{id} */
  async delete(id) {
    const currentLocal = getLocalQuotes();
    const updatedLocal = currentLocal.filter(item => String(item.id) !== String(id));
    saveLocalQuotes(updatedLocal);

    try {
      const url = `${API_BASE_URL}/api/quotes/${id}`;
      await fetch(url, {
        method: 'DELETE',
        headers: DEFAULT_HEADERS
      });
    } catch (err) {
      console.warn(`Backend quote delete(${id}) failed, removed from local store:`, err.message);
    }

    return true;
  }
};

