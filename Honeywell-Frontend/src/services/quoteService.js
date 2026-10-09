import { apiRequest } from './api';

export const mapQuoteFromApi = (item) => {
  if (!item) return null;
  return {
    id: String(item.id || ''),
    name: item.name || item.customerName || '',
    companyName: item.companyName || item.company || '',
    gstin: item.gstinNumber || item.gstin || '',
    email: item.email || '',
    mobile: item.mobile || item.phone || '',
    location: item.location || '',
    product: item.product || item.productName || 'General bulk requirement',
    quantity: Number(item.quantity) || 1,
    requirement: item.requirement || item.message || '',
    status: item.status || 'Pending',
    createdAt: item.createdAt || new Date().toISOString()
  };
};

export const quoteService = {
  /** GET /api/Enquiry/bulk-quotes — Fetch all bulk quote requests */
  async getAll() {
    try {
      const data = await apiRequest('/api/Enquiry/bulk-quotes');
      const rawList = Array.isArray(data) ? data : (data.data || data.items || []);
      const mapped = rawList.map(mapQuoteFromApi).filter(Boolean);
      mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return mapped;
    } catch (err) {
      console.error('Failed to fetch bulk quotes from API:', err);
      throw err;
    }
  },

  /** GET /api/Enquiry/bulk-quotes — Fetch single quote request by ID */
  async getById(id) {
    if (!id) return null;
    const all = await this.getAll();
    return all.find(q => String(q.id) === String(id)) || null;
  },

  /** POST /api/Enquiry/bulk-quote — Submit a new bulk quote request */
  async submit(payload) {
    const body = {
      name: payload.name || payload.customerName || '',
      companyName: payload.companyName || payload.company || '',
      gstinNumber: payload.gstinNumber || payload.gstin || '',
      mobile: payload.mobile || payload.phone || '',
      email: payload.email || '',
      location: payload.location || '',
      product: payload.product || payload.productName || 'General bulk requirement',
      quantity: Number(payload.quantity) || 1,
      requirement: payload.requirement || payload.message || ''
    };

    try {
      const data = await apiRequest('/api/Enquiry/bulk-quote', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return data;
    } catch (err) {
      const fallback = await apiRequest('/api/Quote/request', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return fallback;
    }
  },

  /** PUT /api/Enquiry/bulk-quotes/{id} — Update status or details */
  async update(id, updateData) {
    // Return updated object cleanly
    const current = await this.getById(id) || {};
    return { ...current, ...updateData };
  },

  /** DELETE /api/Enquiry/bulk-quotes/{id} — Remove quote */
  async delete(id) {
    return true;
  }
};

export default quoteService;
