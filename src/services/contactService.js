import { apiRequest, API_BASE_URL } from './api';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const STORAGE_KEY = 'sat_contacts_store';

const getLocalContacts = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalContacts = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sat_contacts_updated'));
    }
  } catch (e) {
    console.warn('Failed to write to localStorage for contacts:', e);
  }
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
    let apiList = [];
    try {
      const data = await apiRequest('/api/contact');
      const rawList = Array.isArray(data) ? data : (data.submissions || data.contacts || data.items || data.data || []);
      apiList = rawList.map(mapContactFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Contact API getAll error:', err.message);
    }

    const localList = getLocalContacts().map(mapContactFromApi).filter(Boolean);

    const mergedMap = new Map();
    localList.forEach((item) => { if (item.id) mergedMap.set(item.id, item); });
    apiList.forEach((item) => { if (item.id) mergedMap.set(item.id, item); });

    const combined = Array.from(mergedMap.values());
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return combined;
  },

  /** GET (ById) — GET /api/contact/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/contact/${id}`);
      const mapped = mapContactFromApi(data.contact || data.submission || data.data || data);
      if (mapped) return mapped;
    } catch (err) {
      console.warn(`Contact API getById(${id}) error:`, err.message);
    }
    const local = getLocalContacts().find((item) => String(item.id) === String(id));
    return local ? mapContactFromApi(local) : null;
  },

  /** POST (Create) — POST /api/contact */
  async submit(payload) {
    const generatedId = `CNT-${Date.now()}`;
    const newContact = {
      id: generatedId,
      name: payload.name || payload.customerName || '',
      mobile: payload.mobile || payload.phone || '',
      phone: payload.mobile || payload.phone || '',
      email: payload.email || '',
      company: payload.company || '',
      enquiryType: payload.enquiryType || payload.type || 'General Enquiry',
      message: payload.message || '',
      status: payload.status || 'Pending',
      createdAt: new Date().toISOString()
    };

    const currentLocal = getLocalContacts();
    const updatedLocal = [newContact, ...currentLocal.filter(item => item.id !== generatedId)];
    saveLocalContacts(updatedLocal);

    try {
      const url = `${API_BASE_URL}/api/contact`;
      const response = await fetch(url, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(newContact)
      });

      if (response.ok) {
        let resData = null;
        try { resData = await response.json(); } catch (e) { resData = null; }
        const mapped = mapContactFromApi(resData?.contact || resData?.data || resData);
        if (mapped && mapped.id && mapped.id !== generatedId) {
          const latestLocal = getLocalContacts().map(item => item.id === generatedId ? mapped : item);
          saveLocalContacts(latestLocal);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Backend contact submission warning, retained in local store:', err.message);
    }

    return newContact;
  },

  /** PUT (Update) — PUT /api/contact/{id} */
  async update(id, updateData) {
    let current = await this.getById(id) || {};
    const merged = { ...current, ...updateData };

    const currentLocal = getLocalContacts();
    const updatedLocal = currentLocal.map(item => String(item.id) === String(id) ? merged : item);
    saveLocalContacts(updatedLocal);

    try {
      const url = `${API_BASE_URL}/api/contact/${id}`;
      await fetch(url, {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(merged)
      });
    } catch (err) {
      console.warn(`Backend contact update(${id}) failed, updated in local store:`, err.message);
    }

    return merged;
  },

  /** DELETE — DELETE /api/contact/{id} */
  async delete(id) {
    const currentLocal = getLocalContacts();
    const updatedLocal = currentLocal.filter(item => String(item.id) !== String(id));
    saveLocalContacts(updatedLocal);

    try {
      const url = `${API_BASE_URL}/api/contact/${id}`;
      await fetch(url, {
        method: 'DELETE',
        headers: DEFAULT_HEADERS
      });
    } catch (err) {
      console.warn(`Backend contact delete(${id}) failed, removed from local store:`, err.message);
    }

    return true;
  }
};


