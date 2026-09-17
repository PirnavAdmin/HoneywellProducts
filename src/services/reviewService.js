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
  getCached(productId, fallbackId = null) {
    if (productId && reviewsCache.has(String(productId).trim())) {
      return reviewsCache.get(String(productId).trim());
    }
    if (fallbackId && reviewsCache.has(String(fallbackId).trim())) {
      return reviewsCache.get(String(fallbackId).trim());
    }
    if (reviewsCache.has('all')) {
      return reviewsCache.get('all');
    }
    const local = getReviewsByProductIdFromStore(productId) || (fallbackId ? getReviewsByProductIdFromStore(fallbackId) : []);
    return local && local.length > 0 ? local : null;
  },

  /** GET (ByProduct) — GET /api/reviews/{productId} with fallbackId (e.g. slug) support */
  async getByProduct(productId, fallbackId = null) {
    if (!productId && !fallbackId) {
      if (reviewsCache.has('all')) return reviewsCache.get('all');
      return [];
    }
    const primaryKey = String(productId || fallbackId).trim();
    if (reviewsCache.has(primaryKey)) {
      return reviewsCache.get(primaryKey);
    }
    if (fallbackId && reviewsCache.has(String(fallbackId).trim())) {
      return reviewsCache.get(String(fallbackId).trim());
    }

    try {
      let data = await apiRequest(`/api/reviews/${primaryKey}`);
      let list = Array.isArray(data) ? data : (data.reviews || data.items || data.data || []);
      let mapped = list.map(mapReviewFromApi).filter(Boolean);

      // If primary ID returned empty and fallbackId (e.g. slug) is provided, query with fallbackId
      if (mapped.length === 0 && fallbackId && String(fallbackId).trim() !== primaryKey) {
        const fallbackKey = String(fallbackId).trim();
        const fallbackData = await apiRequest(`/api/reviews/${fallbackKey}`);
        const fallbackList = Array.isArray(fallbackData) ? fallbackData : (fallbackData.reviews || fallbackData.items || fallbackData.data || []);
        mapped = fallbackList.map(mapReviewFromApi).filter(Boolean);
      }

      // If still empty, query global catalogue reviews /api/reviews/all
      if (mapped.length === 0) {
        if (reviewsCache.has('all')) {
          mapped = reviewsCache.get('all');
        } else {
          const allData = await apiRequest('/api/reviews/all').catch(() => []);
          const allList = Array.isArray(allData) ? allData : (allData.reviews || allData.items || allData.data || []);
          mapped = allList.map(mapReviewFromApi).filter(Boolean);
          if (mapped.length > 0) {
            reviewsCache.set('all', mapped);
          }
        }
      }

      if (mapped.length > 0) {
        reviewsCache.set(primaryKey, mapped);
        if (fallbackId) reviewsCache.set(String(fallbackId).trim(), mapped);
        return mapped;
      }
    } catch (err) {
      console.warn(`Reviews API getByProduct(${primaryKey}) error:`, err.message);
    }

    // Fallback to local store or global cached reviews
    let local = getReviewsByProductIdFromStore(productId);
    if ((!local || local.length === 0) && fallbackId) {
      local = getReviewsByProductIdFromStore(fallbackId);
    }
    if ((!local || local.length === 0) && reviewsCache.has('all')) {
      local = reviewsCache.get('all');
    }
    const result = local || [];
    reviewsCache.set(primaryKey, result);
    if (fallbackId) reviewsCache.set(String(fallbackId).trim(), result);
    return result;
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
