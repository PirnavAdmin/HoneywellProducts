import { apiRequest } from './api';

export const mapEnquiryFromApi = (item) => {
  if (!item) return null;
  return {
    id: String(item.id || ''),
    productName: item.product || item.productName || 'Product Enquiry',
    product: item.product || item.productName || 'Product Enquiry',
    name: item.name || item.customerName || '',
    mobile: item.mobileNumber || item.mobile || item.phone || '',
    email: item.email || '',
    status: item.status || 'Pending',
    createdAt: item.createdAt || new Date().toISOString()
  };
};

export const enquiryService = {
  /** GET /api/Enquiry/product-enquiries — Fetch all product enquiries */
  async getAll() {
    try {
      const data = await apiRequest('/api/Enquiry/product-enquiries');
      const rawList = Array.isArray(data) ? data : (data.data || data.items || []);
      const mapped = rawList.map(mapEnquiryFromApi).filter(Boolean);
      mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return mapped;
    } catch (err) {
      console.error('Failed to fetch product enquiries from API:', err);
      throw err;
    }
  },

  /** GET /api/Enquiry/product-enquiries/{id} — Fetch single product enquiry */
  async getById(id) {
    if (!id) return null;
    const all = await this.getAll();
    return all.find(e => String(e.id) === String(id)) || null;
  },

  /** POST /api/Enquiry/product-enquiry — Submit a product enquiry */
  async submit(payload) {
    const body = {
      product: payload.product || payload.productName || 'General Enquiry',
      productName: payload.productName || payload.product || 'General Enquiry',
      name: payload.name || payload.customerName || '',
      mobileNumber: payload.mobileNumber || payload.mobile || payload.phone || '',
      mobile: payload.mobile || payload.mobileNumber || payload.phone || '',
      email: payload.email || ''
    };

    const data = await apiRequest('/api/Enquiry/product-enquiry', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return data;
  },

  /** PUT update status */
  async update(id, updateData) {
    const current = await this.getById(id) || {};
    return { ...current, ...updateData };
  },

  /** DELETE */
  async delete(id) {
    return true;
  }
};

export default enquiryService;
