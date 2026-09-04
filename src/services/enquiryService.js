import { apiRequest, API_BASE_URL } from './api';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
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
    try {
      const data = await apiRequest('/api/enquiries');
      const list = Array.isArray(data) ? data : (data.enquiries || data.items || data.data || []);
      return list.map(mapEnquiryFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Enquiries API getAll error:', err.message);
      return [];
    }
  },

  /** GET (ById) — GET /api/enquiries/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/enquiries/${id}`);
      return mapEnquiryFromApi(data.enquiry || data.data || data);
    } catch (err) {
      console.warn(`Enquiries API getById(${id}) error:`, err.message);
      throw err;
    }
  },

  /** POST (Create) — POST /api/enquiries */
  async submit(payload) {
    const apiPayload = {
      name: payload.name || payload.customerName || '',
      mobile: payload.mobile || payload.phone || '',
      phone: payload.mobile || payload.phone || '',
      email: payload.email || '',
      company: payload.company || '',
      enquiryType: payload.enquiryType || payload.type || 'Product Enquiry',
      message: payload.message || (payload.productName ? `Enquiry regarding: ${payload.productName}` : ''),
      productId: payload.productId ? String(payload.productId) : null,
      productName: payload.productName || null,
      status: payload.status || 'Pending'
    };

    const url = `${API_BASE_URL}/api/enquiries`;
    const response = await fetch(url, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      throw new Error(`Failed to submit enquiry (${response.status})`);
    }

    let resData = null;
    try {
      resData = await response.json();
    } catch (e) {
      resData = null;
    }

    return mapEnquiryFromApi(resData?.enquiry || resData?.data || resData) || { ok: true, payload: apiPayload };
  },

  /** PUT (Update) — PUT /api/enquiries/{id} */
  async update(id, updateData) {
    let current = {};
    try {
      current = await this.getById(id);
    } catch (e) {
      console.warn('Could not pre-fetch enquiry details for update:', e.message);
    }

    const merged = { ...current, ...updateData };
    const apiPayload = {
      id: isNaN(Number(id)) ? id : Number(id),
      name: merged.name || '',
      mobile: merged.mobile || merged.phone || '',
      phone: merged.mobile || merged.phone || '',
      email: merged.email || '',
      company: merged.company || '',
      enquiryType: merged.enquiryType || 'Product Enquiry',
      message: merged.message || '',
      productId: merged.productId || null,
      productName: merged.productName || null,
      status: merged.status || 'Pending'
    };

    const url = `${API_BASE_URL}/api/enquiries/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to update enquiry ${id} (${response.status})`);
    }

    return apiPayload;
  },

  /** DELETE — DELETE /api/enquiries/{id} */
  async delete(id) {
    const url = `${API_BASE_URL}/api/enquiries/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete enquiry ${id} (${response.status})`);
    }

    return true;
  }
};

