import { apiRequest } from './api';

export const mapCartItemFromApi = (raw = {}) => {
  const sellingPrice = Number(raw.sellingPrice ?? raw.price ?? raw.mrp ?? 0);
  const qty = Number(raw.quantity ?? 1);
  return {
    cartItemId: raw.cartItemId || raw.cartId || raw.id,
    id: String(raw.productId || raw.id || ''),
    productId: Number(raw.productId || raw.id || 0),
    name: raw.productName || raw.name || '',
    sku: raw.sku || '',
    image: raw.imageUrl || raw.image || '',
    mrp: Number(raw.mrp || sellingPrice),
    price: sellingPrice,
    priceLabel: `₹${sellingPrice.toLocaleString('en-IN')}`,
    quantity: qty,
    stock: Number(raw.stock || 0),
    availability: raw.stockStatus || (Number(raw.stock || 0) > 0 ? 'In Stock' : 'Out of Stock'),
    itemTotal: Number(raw.itemTotal || (qty * sellingPrice))
  };
};

export const cartService = {
  /** GET /api/Cart — Fetch cart items for current user */
  async getCart() {
    try {
      const data = await apiRequest('/api/Cart');
      const items = Array.isArray(data) ? data : (data.items || data.data || []);
      return items.map(mapCartItemFromApi);
    } catch (err) {
      console.warn('GET /api/Cart error:', err.message);
      return [];
    }
  },

  /** POST /api/Cart — Add item to cart */
  async addItem(productId, quantity = 1) {
    const data = await apiRequest('/api/Cart', {
      method: 'POST',
      body: JSON.stringify({ productId: Number(productId), quantity: Number(quantity) })
    });
    return data;
  },

  /** PUT /api/Cart/{id} — Update item quantity */
  async updateQuantity(cartItemIdOrProductId, quantity, cartItems = []) {
    const found = cartItems.find(i => String(i.id) === String(cartItemIdOrProductId) || String(i.cartItemId) === String(cartItemIdOrProductId));
    const targetId = found?.cartItemId || cartItemIdOrProductId;
    const data = await apiRequest(`/api/Cart/${targetId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: Number(quantity) })
    });
    return data;
  },

  /** DELETE /api/Cart/{id} — Remove single cart item */
  async removeItem(cartItemIdOrProductId, cartItems = []) {
    const found = cartItems.find(i => String(i.id) === String(cartItemIdOrProductId) || String(i.cartItemId) === String(cartItemIdOrProductId));
    const targetId = found?.cartItemId || cartItemIdOrProductId;
    const data = await apiRequest(`/api/Cart/${targetId}`, {
      method: 'DELETE'
    });
    return data;
  },

  /** DELETE /api/Cart/clear — Clear entire cart */
  async clearCart() {
    try {
      const data = await apiRequest('/api/Cart/clear', {
        method: 'DELETE'
      });
      return data;
    } catch (err) {
      console.warn('DELETE /api/Cart/clear error:', err.message);
      return { success: true };
    }
  }
};

export default cartService;
