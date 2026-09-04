import { apiRequest, API_BASE_URL } from './api';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const mapReviewFromApi = (item) => {
  if (!item) return null;
  const rawId = item.id ?? item.reviewId ?? item._id ?? '';
  return {
    id: String(rawId),
    productId: item.productId ? String(item.productId) : null,
    customerName: item.customerName || item.customer || item.name || item.author || 'Anonymous',
    rating: Number(item.rating) || 5,
    reviewDate: item.reviewDate || item.date || item.createdAt || new Date().toISOString(),
    reviewComment: item.reviewComment || item.comment || item.message || item.text || '',
    verifiedPurchase: item.verifiedPurchase !== undefined ? Boolean(item.verifiedPurchase) : (item.verified !== undefined ? Boolean(item.verified) : true),
    status: item.status || 'Approved'
  };
};

export const reviewService = {
  /** GET (ByProduct) — GET /api/reviews/{productId} */
  async getByProduct(productId) {
    if (!productId) return [];
    try {
      const data = await apiRequest(`/api/reviews/${productId}`);
      const list = Array.isArray(data) ? data : (data.reviews || data.items || data.data || []);
      return list.map(mapReviewFromApi).filter(Boolean);
    } catch (err) {
      console.warn(`Reviews API getByProduct(${productId}) error:`, err.message);
      return [];
    }
  },

  /** GET (ById) — GET /api/reviews/item/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/reviews/item/${id}`);
      return mapReviewFromApi(data.review || data.data || data);
    } catch (err) {
      console.warn(`Reviews API getById(${id}) error:`, err.message);
      throw err;
    }
  },

  /** POST (Create) — POST /api/reviews */
  async submit(payload) {
    const apiPayload = {
      productId: isNaN(Number(payload.productId)) ? payload.productId : Number(payload.productId),
      customerName: payload.customerName || payload.customer || payload.name || 'Anonymous',
      rating: Number(payload.rating) || 5,
      reviewDate: payload.reviewDate || payload.date || new Date().toISOString(),
      reviewComment: payload.reviewComment || payload.comment || '',
      verifiedPurchase: payload.verifiedPurchase !== undefined ? payload.verifiedPurchase : true,
      status: payload.status || 'Approved'
    };

    const url = `${API_BASE_URL}/api/reviews`;
    const response = await fetch(url, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      throw new Error(`Failed to submit review (${response.status})`);
    }

    let resData = null;
    try {
      resData = await response.json();
    } catch (e) {
      resData = null;
    }

    return mapReviewFromApi(resData?.review || resData?.data || resData) || { ok: true, payload: apiPayload };
  },

  /** PUT (Update) — PUT /api/reviews/{id} */
  async update(id, updateData) {
    let current = {};
    try {
      current = await this.getById(id);
    } catch (e) {
      console.warn('Could not pre-fetch review details for update:', e.message);
    }

    const merged = { ...current, ...updateData };
    const apiPayload = {
      id: isNaN(Number(id)) ? id : Number(id),
      productId: isNaN(Number(merged.productId)) ? merged.productId : Number(merged.productId),
      customerName: merged.customerName || merged.customer || 'Anonymous',
      rating: Number(merged.rating) || 5,
      reviewDate: merged.reviewDate || merged.date || new Date().toISOString(),
      reviewComment: merged.reviewComment || merged.comment || '',
      verifiedPurchase: merged.verifiedPurchase !== undefined ? merged.verifiedPurchase : true,
      status: merged.status || 'Approved'
    };

    const url = `${API_BASE_URL}/api/reviews/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to update review ${id} (${response.status})`);
    }

    return apiPayload;
  },

  /** DELETE — DELETE /api/reviews/{id} */
  async delete(id) {
    const url = `${API_BASE_URL}/api/reviews/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete review ${id} (${response.status})`);
    }

    return true;
  }
};
