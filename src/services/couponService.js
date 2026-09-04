import { apiRequest, API_BASE_URL } from './api';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const mapCouponFromApi = (item) => {
  if (!item) return null;
  const rawId = item.id ?? item.couponId ?? item._id ?? '';
  return {
    id: String(rawId),
    code: item.code || item.couponCode || '',
    description: item.description || item.title || `${item.code || 'Discount'} Coupon`,
    discount: Number(item.discountValue ?? item.discount ?? item.amount ?? 0),
    type: item.discountType === 'FixedAmount' ? 'Flat Amount' : (item.discountType || item.type || 'Percentage'),
    minSpend: Number(item.minCartValue ?? item.minSpend ?? item.minOrderValue ?? 0),
    maxDiscount: item.maxDiscountAmount ? Number(item.maxDiscountAmount) : (item.maxDiscount ? Number(item.maxDiscount) : null),
    startDate: item.startDate ? item.startDate.split('T')[0] : '',
    endDate: item.endDate ? item.endDate.split('T')[0] : '',
    usageLimit: Number(item.usageLimit || item.totalLimit || 0),
    usedCount: Number(item.usedCount || item.timesUsed || 0),
    perCustomerLimit: Number(item.perCustomerLimit || 1),
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : (item.status === 'Active' || item.couponStatus === 'Active'),
    status: item.couponStatus || item.status || (item.isActive ? 'Active' : 'Inactive')
  };
};

export const couponService = {
  /** GET (All) — GET /api/coupons */
  async getAll() {
    try {
      const data = await apiRequest('/api/coupons');
      const list = Array.isArray(data) ? data : (data.coupons || data.items || data.data || []);
      return list.map(mapCouponFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Coupons API getAll() error:', err.message);
      return [];
    }
  },

  /** GET (ById) — GET /api/coupons/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/coupons/${id}`);
      return mapCouponFromApi(data.coupon || data.data || data);
    } catch (err) {
      console.warn(`Coupons API getById(${id}) error:`, err.message);
      throw err;
    }
  },

  /** POST (Apply) — POST /api/coupons/apply */
  async applyCoupon(code, cartTotal = 0) {
    const url = `${API_BASE_URL}/api/coupons/apply`;
    const payload = {
      code: code.trim().toUpperCase(),
      couponCode: code.trim().toUpperCase(),
      cartTotal: Number(cartTotal) || 0,
      totalAmount: Number(cartTotal) || 0
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errMessage = `Coupon "${code}" is invalid or expired.`;
        try {
          const errData = await response.json();
          if (errData.message) errMessage = errData.message;
        } catch (e) {
          // fallback
        }
        throw new Error(errMessage);
      }

      const resData = await response.json();
      const couponObj = mapCouponFromApi(resData.coupon || resData.data || resData) || {};
      const discountAmount = Number(resData.discountAmount || resData.discount || couponObj.discount || 0);

      return {
        valid: true,
        code: code.trim().toUpperCase(),
        discountAmount,
        coupon: couponObj,
        message: resData.message || `Coupon "${code.toUpperCase()}" applied successfully!`
      };
    } catch (err) {
      console.warn(`Coupons API applyCoupon(${code}) error:`, err.message);
      throw err;
    }
  },

  /** POST (Create) — POST /api/coupons */
  async create(payload) {
    const apiPayload = {
      code: payload.code.trim().toUpperCase(),
      description: payload.description || '',
      discountType: payload.type === 'Flat Amount' ? 'FixedAmount' : (payload.type || 'Percentage'),
      discountValue: Number(payload.discount || payload.discountValue || 0),
      maxDiscountAmount: payload.maxDiscount ? Number(payload.maxDiscount) : null,
      minCartValue: Number(payload.minSpend || payload.minCartValue || 0),
      usageLimit: Number(payload.usageLimit || 0),
      usedCount: Number(payload.usedCount || 0),
      startDate: payload.startDate ? `${payload.startDate}T00:00:00Z` : null,
      endDate: payload.endDate ? `${payload.endDate}T23:59:59Z` : null,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : (payload.status === 'Active')
    };

    const url = `${API_BASE_URL}/api/coupons`;
    const response = await fetch(url, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      throw new Error(`Failed to create coupon (${response.status})`);
    }

    const resData = await response.json();
    return mapCouponFromApi(resData.coupon || resData.data || resData) || apiPayload;
  },

  /** PUT (Update) — PUT /api/coupons/{id} */
  async update(id, updates) {
    let current = {};
    try {
      current = await this.getById(id);
    } catch (e) {
      console.warn('Could not pre-fetch coupon details for update:', e.message);
    }

    const merged = { ...current, ...updates };
    const apiPayload = {
      id: isNaN(Number(id)) ? id : Number(id),
      code: merged.code ? merged.code.trim().toUpperCase() : '',
      description: merged.description || '',
      discountType: merged.type === 'Flat Amount' ? 'FixedAmount' : (merged.type || 'Percentage'),
      discountValue: Number(merged.discount ?? merged.discountValue ?? 0),
      maxDiscountAmount: merged.maxDiscount ? Number(merged.maxDiscount) : null,
      minCartValue: Number(merged.minSpend ?? merged.minCartValue ?? 0),
      usageLimit: Number(merged.usageLimit || 0),
      usedCount: Number(merged.usedCount || 0),
      startDate: merged.startDate ? `${merged.startDate}T00:00:00Z` : null,
      endDate: merged.endDate ? `${merged.endDate}T23:59:59Z` : null,
      isActive: merged.isActive !== undefined ? Boolean(merged.isActive) : (merged.status === 'Active')
    };

    const url = `${API_BASE_URL}/api/coupons/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to update coupon ${id} (${response.status})`);
    }

    return apiPayload;
  },

  /** DELETE — DELETE /api/coupons/{id} */
  async delete(id) {
    const url = `${API_BASE_URL}/api/coupons/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete coupon ${id} (${response.status})`);
    }

    return true;
  }
};
