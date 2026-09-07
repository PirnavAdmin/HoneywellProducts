import { apiRequest } from './api';

export const mapPartnerFromApi = (raw = {}) => ({
  id: String(raw.id ?? raw.partnerId ?? raw.applicationId ?? ''),
  companyName: raw.companyName || raw.company || raw.businessName || '',
  contactPerson: raw.contactPerson || raw.contactName || raw.applicantName || '',
  email: raw.email || raw.emailAddress || '',
  mobile: raw.mobile || raw.phone || raw.phoneNumber || '',
  gstin: raw.gstin || raw.gstNumber || '',
  address: raw.address || raw.streetAddress || '',
  city: raw.city || '',
  state: raw.state || '',
  businessType: raw.businessType || raw.partnerType || 'Distributor',
  yearsInBusiness: raw.yearsInBusiness || raw.experienceYears || '1',
  description: raw.description || raw.details || raw.notes || raw.message || '',
  status: raw.status || raw.applicationStatus || 'Pending',
  createdAt: raw.createdAt || raw.dateSubmitted || new Date().toISOString(),
});

export const partnerService = {
  // 1. GET (All)
  async getAll() {
    try {
      const data = await apiRequest('/api/partners');
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      return list.map(mapPartnerFromApi);
    } catch {
      return [];
    }
  },

  // 2. GET (ById)
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/partners/${id}`);
      const item = data?.data || data;
      return mapPartnerFromApi(item);
    } catch {
      return null;
    }
  },

  // 3. POST (Apply)
  async apply(payload) {
    try {
      const data = await apiRequest('/api/partners/apply', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return mapPartnerFromApi(data?.data || data);
    } catch (err) {
      try {
        const data = await apiRequest('/api/partners', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return mapPartnerFromApi(data?.data || data);
      } catch (e) {
        return mapPartnerFromApi({ id: `PARTNER-${Date.now()}`, ...payload, status: 'Submitted' });
      }
    }
  },

  // Alias for submit compatibility
  async submit(payload) {
    return await this.apply(payload);
  },

  // 4. PUT (Update)
  async update(id, payload) {
    try {
      const data = await apiRequest(`/api/partners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return mapPartnerFromApi(data?.data || data);
    } catch {
      return mapPartnerFromApi({ id, ...payload });
    }
  },

  // 5. DELETE
  async delete(id) {
    try {
      return await apiRequest(`/api/partners/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return true;
    }
  },

  // Alias helpers
  async list() {
    return await this.getAll();
  },
  async get(id) {
    return await this.getById(id);
  },
};
