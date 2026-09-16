import { apiRequest } from './api';

export const mapPartnerFromApi = (item) => {
  if (!item) return null;
  return {
    id: String(item.id || ''),
    companyName: item.companyName || item.company || '',
    gstin: item.gstinNumber || item.gstin || '',
    contactPerson: item.contactPerson || item.name || '',
    businessType: item.businessType || item.partnerType || 'Distributor',
    mobile: item.mobile || item.phone || '',
    email: item.email || '',
    city: item.city || '',
    state: item.state || '',
    yearsInBusiness: item.yearsInBusiness || '',
    address: item.address || '',
    description: item.description || item.message || '',
    agreedToTerms: item.agreedToTerms !== undefined ? Boolean(item.agreedToTerms) : true,
    status: item.status || 'Pending',
    createdAt: item.createdAt || new Date().toISOString()
  };
};

export const partnerService = {
  /** GET /api/Partner/applications — Fetch all partner applications */
  async getApplications() {
    try {
      const data = await apiRequest('/api/Partner/applications');
      const rawList = Array.isArray(data) ? data : (data.data || data.items || []);
      const mapped = rawList.map(mapPartnerFromApi).filter(Boolean);
      mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return mapped;
    } catch (err) {
      console.error('Failed to fetch partner applications from API:', err);
      throw err;
    }
  },

  /** GET single application by ID */
  async getById(id) {
    if (!id) return null;
    const all = await this.getApplications();
    return all.find(p => String(p.id) === String(id)) || null;
  },

  /** POST /api/Partner/application — Submit a new partner application */
  async submitApplication(payload) {
    const body = {
      companyName: payload.companyName || payload.company || '',
      gstinNumber: payload.gstinNumber || payload.gstin || '',
      contactPerson: payload.contactPerson || payload.name || '',
      businessType: payload.businessType || payload.partnerType || 'Distributor',
      mobile: payload.mobile || payload.phone || '',
      email: payload.email || '',
      city: payload.city || '',
      state: payload.state || '',
      yearsInBusiness: payload.yearsInBusiness || '',
      address: payload.address || (payload.city ? `${payload.city}, ${payload.state || ''}` : 'Main Office Address'),
      description: payload.description || payload.message || '',
      agreedToTerms: payload.agreedToTerms !== undefined ? Boolean(payload.agreedToTerms) : true
    };

    const data = await apiRequest('/api/Partner/application', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return data;
  },

  /** Alias for submitApplication */
  async apply(payload) {
    return await this.submitApplication(payload);
  },

  /** Partner Login & Auth */
  async login(emailOrPhone, password) {
    return await apiRequest('/api/Partner/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password })
    });
  },

  /** Partner Registration */
  async register(payload) {
    return await apiRequest('/api/Partner/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /** Partner Dashboard */
  async getDashboard() {
    return await apiRequest('/api/Partner/dashboard');
  }
};

export default partnerService;
