import { apiRequest, API_BASE_URL } from './api';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const STORAGE_KEY = 'sat_enquiries_store';

const getLocalEnquiries = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalEnquiries = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sat_enquiries_updated'));
    }
  } catch (e) {
    console.warn('Failed to write to localStorage for enquiries:', e);
  }
};

export const mapEnquiryFromApi = (item) => {
  if (!item) return null;
  const rawId = item.id ?? item.enquiryId ?? item._id ?? '';
  return {
    id: String(rawId),
    name: item.name || item.customerName || item.fullName || '',
    email: item.email || item.emailAddress || '',
    mobile: item.mobile || item.phone || item.contactNumber || '',
    company: item.company || item.organization || '',
    enquiryType: item.enquiryType || item.type || item.category || 'Product Enquiry',
    message: item.message || item.description || item.details || item.notes || '',
    productId: item.productId ? String(item.productId) : null,
    productName: item.productName || item.product || '',
    status: item.status || 'Pending',
    createdAt: item.createdAt || item.dateCreated || item.createdOn || new Date().toISOString()
  };
};

export const enquiryService = {
  /** GET (All) — GET /api/enquiries */
  async getAll() {
    let apiList = [];
    try {
      const data = await apiRequest('/api/enquiries');
      const rawList = Array.isArray(data) ? data : (data.enquiries || data.items || data.data || []);
      apiList = rawList.map(mapEnquiryFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Enquiries API getAll error:', err.message);
    }

    const localList = getLocalEnquiries().map(mapEnquiryFromApi).filter(Boolean);
    
    // Merge local & API list by ID
    const mergedMap = new Map();
    localList.forEach((item) => { if (item.id) mergedMap.set(item.id, item); });
    apiList.forEach((item) => { if (item.id) mergedMap.set(item.id, item); });

    const combined = Array.from(mergedMap.values());
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return combined;
  },

  /** GET (ById) — GET /api/enquiries/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/enquiries/${id}`);
      const mapped = mapEnquiryFromApi(data.enquiry || data.data || data);
      if (mapped) return mapped;
    } catch (err) {
      console.warn(`Enquiries API getById(${id}) error:`, err.message);
    }
    const local = getLocalEnquiries().find((item) => String(item.id) === String(id));
    return local ? mapEnquiryFromApi(local) : null;
  },

  /** POST (Create) — POST /api/enquiries */
  async submit(payload) {
    const generatedId = `ENQ-${Date.now()}`;
    const newEnquiry = {
      id: generatedId,
      name: payload.name || payload.customerName || '',
      mobile: payload.mobile || payload.phone || '',
      phone: payload.mobile || payload.phone || '',
      email: payload.email || '',
      company: payload.company || '',
      enquiryType: payload.enquiryType || payload.type || 'Product Enquiry',
      message: payload.message || (payload.productName ? `Enquiry regarding: ${payload.productName}` : ''),
      productId: payload.productId ? String(payload.productId) : null,
      productName: payload.productName || null,
      status: payload.status || 'Pending',
      createdAt: new Date().toISOString()
    };

    // 1. Immediately store in localStorage so Admin panel reflects it even if backend API fails or is 404
    const currentLocal = getLocalEnquiries();
    const updatedLocal = [newEnquiry, ...currentLocal.filter(item => item.id !== generatedId)];
    saveLocalEnquiries(updatedLocal);

    // 2. Send to backend API
    try {
      const url = `${API_BASE_URL}/api/enquiries`;
      const response = await fetch(url, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(newEnquiry)
      });

      if (response.ok) {
        let resData = null;
        try { resData = await response.json(); } catch (e) { resData = null; }
        const mapped = mapEnquiryFromApi(resData?.enquiry || resData?.data || resData);
        if (mapped && mapped.id && mapped.id !== generatedId) {
          const latestLocal = getLocalEnquiries().map(item => item.id === generatedId ? mapped : item);
          saveLocalEnquiries(latestLocal);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Backend enquiry submission warning, retained in local store:', err.message);
    }

    return newEnquiry;
  },

  /** PUT (Update) — PUT /api/enquiries/{id} */
  async update(id, updateData) {
    let current = await this.getById(id) || {};
    const merged = { ...current, ...updateData };

    const currentLocal = getLocalEnquiries();
    const updatedLocal = currentLocal.map(item => String(item.id) === String(id) ? merged : item);
    saveLocalEnquiries(updatedLocal);

    try {
      const url = `${API_BASE_URL}/api/enquiries/${id}`;
      await fetch(url, {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(merged)
      });
    } catch (err) {
      console.warn(`Backend enquiry update(${id}) failed, updated in local store:`, err.message);
    }

    return merged;
  },

  /** DELETE — DELETE /api/enquiries/{id} */
  async delete(id) {
    const currentLocal = getLocalEnquiries();
    const updatedLocal = currentLocal.filter(item => String(item.id) !== String(id));
    saveLocalEnquiries(updatedLocal);

    try {
      const url = `${API_BASE_URL}/api/enquiries/${id}`;
      await fetch(url, {
        method: 'DELETE',
        headers: DEFAULT_HEADERS
      });
    } catch (err) {
      console.warn(`Backend enquiry delete(${id}) failed, removed from local store:`, err.message);
    }

    return true;
  }
};

