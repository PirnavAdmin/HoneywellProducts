import { apiRequest, API_BASE_URL } from './api';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const mapContactFromApi = (item) => {
  if (!item) return null;
  const rawId = item.id ?? item.contactId ?? item._id ?? '';
  return {
    id: String(rawId),
    name: item.name || item.customerName || item.fullName || '',
    email: item.email || item.emailAddress || '',
    mobile: item.mobile || item.phone || item.contactNumber || '',
    company: item.company || item.organization || '',
    enquiryType: item.enquiryType || item.type || item.subject || 'General Enquiry',
    message: item.message || item.description || item.details || '',
    status: item.status || 'Pending',
    createdAt: item.createdAt || item.dateCreated || item.createdOn || new Date().toISOString()
  };
};

export const contactService = {
  /** GET (All) — GET /api/contact */
  async getAll() {
    try {
      const data = await apiRequest('/api/contact');
      const list = Array.isArray(data) ? data : (data.submissions || data.contacts || data.items || data.data || []);
      return list.map(mapContactFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Contact API getAll error:', err.message);
      return [];
    }
  },

  /** GET (ById) — GET /api/contact/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/contact/${id}`);
      return mapContactFromApi(data.contact || data.submission || data.data || data);
    } catch (err) {
      console.warn(`Contact API getById(${id}) error:`, err.message);
      throw err;
    }
  },

  /** POST (Create) — POST /api/contact */
  async submit(payload) {
    const apiPayload = {
      name: payload.name || payload.customerName || '',
      mobile: payload.mobile || payload.phone || '',
      phone: payload.mobile || payload.phone || '',
      email: payload.email || '',
      company: payload.company || '',
      enquiryType: payload.enquiryType || payload.type || 'General Enquiry',
      message: payload.message || '',
      status: payload.status || 'Pending'
    };

    const url = `${API_BASE_URL}/api/contact`;
    const response = await fetch(url, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      throw new Error(`Failed to submit contact form (${response.status})`);
    }

    let resData = null;
    try {
      resData = await response.json();
    } catch (e) {
      resData = null;
    }

    return mapContactFromApi(resData?.contact || resData?.data || resData) || { ok: true, payload: apiPayload };
  },

  /** PUT (Update) — PUT /api/contact/{id} */
  async update(id, updateData) {
    let current = {};
    try {
      current = await this.getById(id);
    } catch (e) {
      console.warn('Could not pre-fetch contact submission details for update:', e.message);
    }

    const merged = { ...current, ...updateData };
    const apiPayload = {
      id: isNaN(Number(id)) ? id : Number(id),
      name: merged.name || '',
      mobile: merged.mobile || merged.phone || '',
      phone: merged.mobile || merged.phone || '',
      email: merged.email || '',
      company: merged.company || '',
      enquiryType: merged.enquiryType || 'General Enquiry',
      message: merged.message || '',
      status: merged.status || 'Pending'
    };

    const url = `${API_BASE_URL}/api/contact/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to update contact submission ${id} (${response.status})`);
    }

    return apiPayload;
  },

  /** DELETE — DELETE /api/contact/{id} */
  async delete(id) {
    const url = `${API_BASE_URL}/api/contact/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete contact submission ${id} (${response.status})`);
    }

    return true;
  }
};


