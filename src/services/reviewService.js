import { apiRequest, API_BASE_URL } from './api';
import { getReviewsByProductIdFromStore, upsertReviewInStore } from '../admin/catalog/reviewStore';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const mapReviewFromApi = (item) => {
  if (!item) return null;
  const rawId = item.id ?? item.reviewId ?? item._id ?? '';
  const customerName = item.customerName || item.customer || item.name || item.author || 'Anonymous';
  const reviewComment = item.reviewComment || item.comment || item.message || item.text || '';
  const reviewDate = item.reviewDate || item.date || item.createdAt || new Date().toISOString();
  const rating = Number(item.rating) || 5;
  const verifiedPurchase = item.verifiedPurchase !== undefined ? Boolean(item.verifiedPurchase) : (item.verified !== undefined ? Boolean(item.verified) : true);
  return {
    id: String(rawId),
    productId: item.productId ? String(item.productId) : null,
    customerName,
    customer: customerName,
    rating,
    reviewDate,
    date: reviewDate,
    reviewComment,
    comment: reviewComment,
    verifiedPurchase,
    verified: verifiedPurchase,
    status: item.status || 'Approved'
  };
};

const reviewsCache = new Map();

export const reviewService = {
  /** Synchronously get reviews from memory cache or localStore if available */
  getCached(productId) {
    if (!productId) return null;
    const key = String(productId).trim();
    if (reviewsCache.has(key)) {
      return reviewsCache.get(key);
    }
    const local = getReviewsByProductIdFromStore(key);
    const filtered = (local || []).filter((r) => !r.productId || String(r.productId) === key);
    return filtered.length > 0 ? filtered : null;
  },

  clearCache(productId = null) {
    if (productId) {
      reviewsCache.delete(String(productId).trim());
    } else {
      reviewsCache.clear();
    }
  },

  /** GET (ByProduct) — GET /api/reviews/{productId} strictly for this product */
  async getByProduct(productId) {
    if (!productId) return [];
    const key = String(productId).trim();
    if (!key || isNaN(Number(key))) {
      return [];
    }
    if (reviewsCache.has(key)) {
      return reviewsCache.get(key);
    }

    try {
      const data = await apiRequest(`/api/reviews/${key}`);
      const list = Array.isArray(data) ? data : (data.reviews || data.items || data.data || []);
      const mapped = list
        .map(mapReviewFromApi)
        .filter(Boolean)
        .filter((r) => !r.productId || String(r.productId) === key);

      reviewsCache.set(key, mapped);
      return mapped;
    } catch (err) {
      console.warn(`Reviews API getByProduct(${key}) error:`, err.message);
    }

    const local = getReviewsByProductIdFromStore(key) || [];
    const filteredLocal = local.filter((r) => !r.productId || String(r.productId) === key);
    reviewsCache.set(key, filteredLocal);
    return filteredLocal;
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
      productId: String(payload.productId || '').trim(),
      customerName: payload.customerName || payload.customer || payload.name || 'Anonymous',
      rating: Number(payload.rating) || 5,
      reviewDate: payload.reviewDate || payload.date || new Date().toISOString(),
      reviewComment: payload.reviewComment || payload.comment || '',
      verifiedPurchase: payload.verifiedPurchase !== undefined ? Boolean(payload.verifiedPurchase) : true,
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

    reviewsCache.clear();
    const finalReview = mapReviewFromApi(resData?.review || resData?.data || resData) || { ok: true, payload: apiPayload };
    if (finalReview && finalReview.productId) {
      upsertReviewInStore(finalReview);
    }
    return finalReview;
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
      productId: String(merged.productId || '').trim(),
      customerName: merged.customerName || merged.customer || 'Anonymous',
      rating: Number(merged.rating) || 5,
      reviewDate: merged.reviewDate || merged.date || new Date().toISOString(),
      reviewComment: merged.reviewComment || merged.comment || '',
      verifiedPurchase: merged.verifiedPurchase !== undefined ? Boolean(merged.verifiedPurchase) : true,
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

    reviewsCache.clear();
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

    reviewsCache.clear();
    return true;
  }
};
