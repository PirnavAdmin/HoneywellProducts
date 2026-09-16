import { apiRequest } from './api';

export const mapOfferFromApi = (item) => {
  if (!item) return null;
  const rawId = item.id ?? item.offerId ?? item._id ?? '';
  return {
    id: Number(rawId) || rawId,
    title: item.title || '',
    category: item.category || 'General',
    badgeTag: item.badgeTag || item.badge || 'SPECIAL OFFER',
    originalPrice: Number(item.originalPrice ?? item.regularPrice ?? 0),
    dealPrice: Number(item.dealPrice ?? item.price ?? item.offerPrice ?? 0),
    discountPercentage: Number(item.discountPercentage ?? item.discount ?? 0),
    description: item.description || '',
    imageUrl: item.imageUrl || item.image || '',
    endDate: item.endDate ? (typeof item.endDate === 'string' ? item.endDate.split('T')[0] : item.endDate) : '',
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    displayOrder: Number(item.displayOrder || 0),
    createdAt: item.createdAt || new Date().toISOString(),
    productId: item.productId ? Number(item.productId) : null
  };
};

export const offersService = {
  /** GET public active offers — GET /api/Offers or GET /api/Offers?category={category} */
  async getAll(category = '') {
    try {
      let path = '/api/Offers';
      if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
        path += `?category=${encodeURIComponent(category.trim())}`;
      }
      const data = await apiRequest(path);
      const list = Array.isArray(data) ? data : (data.offers || data.items || data.data || []);
      return list.map(mapOfferFromApi).filter(Boolean);
    } catch (err) {
      console.error('Offers API getAll() error:', err.message);
      throw err;
    }
  },

  /** GET admin offers (includes both active and inactive) — GET /api/Offers/admin */
  async getAdminAll() {
    try {
      const data = await apiRequest('/api/Offers/admin');
      const list = Array.isArray(data) ? data : (data.offers || data.items || data.data || []);
      return list.map(mapOfferFromApi).filter(Boolean);
    } catch (err) {
      console.error('Offers API getAdminAll() error:', err.message);
      throw err;
    }
  },

  /** GET single offer — GET /api/Offers/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/Offers/${id}`);
      const item = data.offer || data.data || data;
      return mapOfferFromApi(item);
    } catch (err) {
      console.error(`Offers API getById(${id}) error:`, err.message);
      throw err;
    }
  },

  /** POST create offer — POST /api/Offers */
  async create(payload) {
    const apiPayload = {
      title: payload.title || '',
      category: payload.category || 'General',
      badgeTag: payload.badgeTag || 'SPECIAL OFFER',
      originalPrice: Number(payload.originalPrice || 0),
      dealPrice: Number(payload.dealPrice || 0),
      discountPercentage: Number(payload.discountPercentage || 0),
      description: payload.description || '',
      imageUrl: payload.imageUrl || '',
      endDate: payload.endDate ? `${payload.endDate}T23:59:59Z` : new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      displayOrder: Number(payload.displayOrder || 0),
      productId: payload.productId ? Number(payload.productId) : null
    };

    const data = await apiRequest('/api/Offers', {
      method: 'POST',
      body: JSON.stringify(apiPayload)
    });

    const createdItem = data.offer || data.data || data;
    return mapOfferFromApi(createdItem) || apiPayload;
  },

  /** PUT update offer — PUT /api/Offers/{id} */
  async update(id, payload) {
    const apiPayload = {
      id: Number(id),
      title: payload.title || '',
      category: payload.category || 'General',
      badgeTag: payload.badgeTag || 'SPECIAL OFFER',
      originalPrice: Number(payload.originalPrice || 0),
      dealPrice: Number(payload.dealPrice || 0),
      discountPercentage: Number(payload.discountPercentage || 0),
      description: payload.description || '',
      imageUrl: payload.imageUrl || '',
      endDate: payload.endDate ? (payload.endDate.includes('T') ? payload.endDate : `${payload.endDate}T23:59:59Z`) : new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      displayOrder: Number(payload.displayOrder || 0),
      productId: payload.productId ? Number(payload.productId) : null
    };

    const data = await apiRequest(`/api/Offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiPayload)
    });

    const updatedItem = data.offer || data.data || data;
    return mapOfferFromApi(updatedItem) || apiPayload;
  },

  /** PATCH toggle active/inactive status — PATCH /api/Offers/{id}/status */
  async toggleStatus(id) {
    const data = await apiRequest(`/api/Offers/${id}/status`, {
      method: 'PATCH'
    });
    return data;
  },

  /** DELETE offer — DELETE /api/Offers/{id} */
  async delete(id) {
    const data = await apiRequest(`/api/Offers/${id}`, {
      method: 'DELETE'
    });
    return data;
  }
};

export default offersService;
