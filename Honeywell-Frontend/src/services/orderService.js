import { apiRequest, API_BASE_URL } from './api';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const mapOrderFromApi = (item) => {
  if (!item) return null;
  const rawId = item.id ?? item.orderId ?? item._id ?? '';
  const orderNo = item.orderNumber || item.orderNo || item.reference || (rawId ? `ORD-${rawId}` : `ORD-${Date.now()}`);

  const rawItems = item.items || item.orderItems || item.products || [];
  const items = Array.isArray(rawItems) ? rawItems.map(i => ({
    id: String(i.id || i.productId || ''),
    productId: i.productId ? String(i.productId) : '',
    name: i.name || i.productName || i.title || 'Honeywell Product',
    quantity: Number(i.quantity || i.qty || 1),
    price: Number(i.price || i.unitPrice || 0),
    image: i.image || i.imageUrl || ''
  })) : [];

  return {
    id: String(rawId),
    orderNumber: orderNo,
    customerName: item.customerName || item.customer || item.name || item.billingName || 'Customer',
    email: item.email || item.customerEmail || '',
    mobile: item.mobile || item.phone || item.customerPhone || '',
    address: item.shippingAddress || item.address || item.deliveryAddress || '',
    city: item.city || '',
    state: item.state || '',
    pinCode: item.pinCode || item.pincode || item.zipCode || '',
    totalAmount: Number(item.totalAmount ?? item.total ?? item.amount ?? 0),
    status: item.status || item.orderStatus || 'Pending',
    paymentStatus: item.paymentStatus || item.payStatus || 'Pending',
    paymentMethod: item.paymentMethod || item.paymentMode || 'UPI',
    items,
    createdAt: item.createdAt || item.orderDate || item.dateCreated || new Date().toISOString()
  };
};

export const orderService = {
  /** GET (All) — GET /api/orders */
  async getAll() {
    try {
      const data = await apiRequest('/api/orders');
      const list = Array.isArray(data) ? data : (data.orders || data.items || data.data || []);
      return list.map(mapOrderFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Orders API getAll() error:', err.message);
      return [];
    }
  },

  /** GET (ById) — GET /api/orders/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/orders/${id}`);
      return mapOrderFromApi(data.order || data.data || data);
    } catch (err) {
      console.warn(`Orders API getById(${id}) error:`, err.message);
      throw err;
    }
  },

  /** GET (Invoice) — GET /api/orders/{id}/invoice */
  async getInvoice(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/orders/${id}/invoice`);
      return data.invoice || data.data || data;
    } catch (err) {
      console.warn(`Orders API getInvoice(${id}) error:`, err.message);
      // Fallback: build invoice from single order call
      const order = await this.getById(id);
      if (!order) return null;
      return {
        invoiceNumber: `INV-${order.id}`,
        invoiceDate: new Date(order.createdAt).toLocaleDateString(),
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        email: order.email,
        mobile: order.mobile,
        address: order.address,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: order.items
      };
    }
  },

  /** POST (Create) — POST /api/orders */
  async create(payload) {
    const activeCustomerId = payload.customerId || Number(localStorage.getItem('customerId') || 0);
    const apiPayload = {
      orderNumber: payload.orderNumber || `ORD-${Date.now()}`,
      customerId: activeCustomerId ? Number(activeCustomerId) : undefined,
      customerName: payload.customerName || payload.name || 'Customer',
      email: payload.email || '',
      mobile: payload.mobile || payload.phone || '',
      shippingAddress: [payload.address || payload.shippingAddress, payload.city, payload.state, payload.pinCode].filter(Boolean).join(', ') || payload.address || '',
      city: payload.city || '',
      state: payload.state || '',
      pinCode: payload.pinCode || payload.pincode || '',
      totalAmount: Number(payload.totalAmount || payload.total || 0),
      finalAmount: Number(payload.totalAmount || payload.total || 0),
      paymentMethod: payload.paymentMethod || 'Cash on Delivery',
      paymentStatus: payload.paymentStatus || 'Pending',
      status: payload.status || 'Processing',
      items: Array.isArray(payload.items) ? payload.items.map(item => ({
        productId: isNaN(Number(item.id || item.productId)) ? 1 : Number(item.id || item.productId),
        productName: item.name || item.productName || 'Honeywell Product',
        name: item.name || item.productName || 'Honeywell Product',
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        subtotal: Number(item.price || 0) * Number(item.quantity || 1)
      })) : []
    };

    const url = `${API_BASE_URL}/api/orders`;
    let response = await fetch(url, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      // Fallback: try Checkout/place-order endpoint
      try {
        const checkoutUrl = `${API_BASE_URL}/api/Checkout/place-order`;
        const checkoutRes = await fetch(checkoutUrl, {
          method: 'POST',
          headers: DEFAULT_HEADERS,
          body: JSON.stringify({
            paymentMethod: apiPayload.paymentMethod,
            paymentStatus: apiPayload.paymentStatus,
            transactionId: apiPayload.orderNumber
          })
        });
        if (checkoutRes.ok) {
          const cData = await checkoutRes.json();
          return mapOrderFromApi(cData) || apiPayload;
        }
      } catch (e) {}

      throw new Error(`Failed to create order (${response.status})`);
    }

    let resData = null;
    try {
      resData = await response.json();
    } catch (e) {
      resData = null;
    }

    const createdOrder = mapOrderFromApi(resData?.order || resData?.data || resData) || apiPayload;

    // Cache order locally so it instantly reflects in My Orders
    try {
      const existing = JSON.parse(localStorage.getItem('my_recent_orders') || '[]');
      const updated = [createdOrder, ...existing.filter(o => o.orderNumber !== createdOrder.orderNumber)];
      localStorage.setItem('my_recent_orders', JSON.stringify(updated));
    } catch (e) {}

    return createdOrder;
  },

  /** PUT (Status) — PUT /api/orders/{id}/status */
  async updateStatus(id, status) {
    const url = `${API_BASE_URL}/api/orders/${id}/status`;
    // Supports query string status or urlencoded or json payload
    const response = await fetch(url, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ status: String(status) })
    });

    if (!response.ok && response.status !== 204) {
      // Retry with urlencoded if json rejected
      const response2 = await fetch(url, {
        method: 'PUT',
        headers: {
          ...DEFAULT_HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `status=${encodeURIComponent(status)}`
      });

      if (!response2.ok && response2.status !== 204) {
        throw new Error(`Failed to update order status for ID ${id} (${response2.status})`);
      }
    }

    return { success: true, id, status };
  },

  /** DELETE — DELETE /api/orders/{id} */
  async delete(id) {
    const url = `${API_BASE_URL}/api/orders/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete order ID ${id} (${response.status})`);
    }

    return { success: true, id };
  },

  /** GET (Customer My Orders) — GET /api/Customer/my-orders */
  async getMyOrders() {
    try {
      const data = await apiRequest('/api/Customer/my-orders');
      const list = Array.isArray(data) ? data : (data.orders || data.items || data.data || []);
      return list.map(mapOrderFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Customer my-orders error:', err.message);
      return this.getAll();
    }
  },

  /** GET (Track Order) — GET /api/Customer/track-order?orderNumber={number} */
  async trackOrder(orderNumber) {
    if (!orderNumber) return null;
    try {
      const data = await apiRequest(`/api/Customer/track-order?orderNumber=${encodeURIComponent(orderNumber)}`);
      const item = data?.data || data?.order || data;
      return mapOrderFromApi(item);
    } catch (err) {
      console.warn(`trackOrder(${orderNumber}) error:`, err.message);
      return this.getById(orderNumber);
    }
  }
};
