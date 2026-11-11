import { apiRequest } from './api';

export const mapContactFromApi = (item) => {
  if (!item) return null;
  return {
    id: String(item.id || ''),
    name: item.name || item.customerName || '',
    mobile: item.mobile || item.phone || '',
    email: item.email || '',
    company: item.company || '',
    enquiryType: item.enquiryType || item.type || 'General Enquiry',
    message: item.message || '',
    status: item.status || 'Pending',
    createdAt: item.createdAt || new Date().toISOString()
  };
};

export const contactService = {
  /** GET /api/Enquiry/contact-us — Fetch all contact us submissions */
  async getAll() {
    try {
      const data = await apiRequest('/api/Enquiry/contact-us');
      const rawList = Array.isArray(data) ? data : (data.data || data.items || []);
      const mapped = rawList.map(mapContactFromApi).filter(Boolean);
      mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return mapped;
    } catch (err) {
      console.error('Failed to fetch contact us messages from API:', err);
      throw err;
    }
  },

  /** GET /api/Enquiry/contact-us/{id} — Fetch single contact submission */
  async getById(id) {
    if (!id) return null;
    const all = await this.getAll();
    return all.find(c => String(c.id) === String(id)) || null;
  },

  /** POST /api/Enquiry/contact-us — Submit a contact us message */
  async submit(payload) {
    const body = {
      name: payload.name || payload.customerName || '',
      mobile: payload.mobile || payload.phone || '',
      email: payload.email || '',
      company: payload.company || '',
      enquiryType: payload.enquiryType || payload.type || 'General Enquiry',
      message: payload.message || ''
    };

    const data = await apiRequest('/api/Contact', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return data;
  },

  /** PUT /api/Enquiry/contact-us/{id} — Update contact submission details/status */
  async update(id, updateData = {}) {
    const body = {
      status: updateData.status,
      message: updateData.message !== undefined ? updateData.message : undefined,
      enquiryType: updateData.enquiryType || updateData.type || undefined
    };

    return await apiRequest(`/api/Enquiry/contact-us/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  /** DELETE /api/Enquiry/contact-us/{id} — Delete a contact submission */
  async delete(id) {
    const res = await apiRequest(`/api/Enquiry/contact-us/${id}`, {
      method: 'DELETE'
    });
    return res || true;
  }
};

export default contactService;
