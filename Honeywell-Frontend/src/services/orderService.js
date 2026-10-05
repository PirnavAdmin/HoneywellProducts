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

  const dateVal = item.dateBooked || item.bookedDate || item.bookingDate || item.orderDate || item.createdAt || item.createdDate || item.dateCreated || item.date || new Date().toISOString();

  return {
    id: String(rawId),
    orderNumber: orderNo,
    orderNo: orderNo,
    customerName: item.customerName || item.customer || item.name || item.billingName || 'Customer',
    email: item.email || item.customerEmail || '',
    mobile: item.mobile || item.phone || item.customerPhone || '',
    phone: item.mobile || item.phone || item.customerPhone || '',
    address: item.shippingAddress || item.address || item.deliveryAddress || '',
    shippingAddress: item.shippingAddress || item.address || item.deliveryAddress || '',
    city: item.city || '',
    state: item.state || '',
    pinCode: item.pinCode || item.pincode || item.zipCode || '',
    totalAmount: Number(item.totalAmount ?? item.total ?? item.amount ?? 0),
    total: Number(item.totalAmount ?? item.total ?? item.amount ?? 0),
    status: item.status || item.orderStatus || 'Pending',
    paymentStatus: item.paymentStatus || item.payStatus || 'Pending',
    paymentMethod: item.paymentMethod || item.paymentMode || 'UPI',
    items,
    createdAt: dateVal,
    orderDate: dateVal,
    dateBooked: dateVal,
    bookedDate: dateVal,
    date: typeof dateVal === 'string' && dateVal.includes('T') ? dateVal.split('T')[0] : dateVal
  };
};

export const orderService = {
  /** GET (All) — GET /api/orders (Live Only) */
  async getAll() {
    try {
      const data = await apiRequest('/api/orders');
      const list = Array.isArray(data) ? data : (data.orders || data.items || data.data || []);
      return list.map(mapOrderFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Orders API getAll() error (Server offline or error):', err.message);
      return [];
    }
  },

  /** GET (ById) — GET /api/orders/{id} (Live Only) */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/orders/${id}`);
      const mapped = mapOrderFromApi(data.order || data.data || data);
      if (mapped) return mapped;
    } catch (err) {
      console.warn(`Orders API getById(${id}) error:`, err.message);
    }
    return null;
  },

  /** GET (Invoice) — GET /api/orders/{id}/invoice */
  async getInvoice(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/orders/${id}/invoice`);
      return data.invoice || data.data || data;
    } catch (err) {
      // Fallback: build invoice from single order call
      const order = await this.getById(id);
      if (!order) return null;
      return {
        invoiceNumber: `INV-${order.id || order.orderNumber}`,
        invoiceDate: new Date(order.createdAt || Date.now()).toLocaleDateString(),
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

  /** POST (Create) — POST /api/orders (Live Server Only) */
  async create(payload) {
    const activeCustomerId = payload.customerId || Number(localStorage.getItem('customerId') || 0);
    const orderNumber = payload.orderNumber || `ORD-${Date.now()}`;
    const cleanAddress = [payload.address || payload.shippingAddress, payload.city, payload.state, payload.pinCode].filter(Boolean).join(', ') || payload.address || '';

    const apiPayload = {
      orderNumber,
      customerId: activeCustomerId ? Number(activeCustomerId) : undefined,
      customerName: payload.customerName || payload.name || 'Customer',
      email: payload.email || '',
      mobile: payload.mobile || payload.phone || '',
      phone: payload.mobile || payload.phone || '',
      address: cleanAddress,
      shippingAddress: cleanAddress,
      city: payload.city || '',
      state: payload.state || '',
      district: payload.city || payload.state || 'Local',
      pinCode: payload.pinCode || payload.pincode || '',
      totalAmount: Number(payload.totalAmount || payload.total || 0),
      finalAmount: Number(payload.totalAmount || payload.total || 0),
      paymentMethod: payload.paymentMethod || 'Cash on Delivery',
      paymentStatus: payload.paymentStatus || 'Pending',
      status: payload.status || 'Processing',
      items: Array.isArray(payload.items) ? payload.items.map(item => ({
        id: String(item.id || item.productId || ''),
        productId: isNaN(Number(item.id || item.productId)) ? 1 : Number(item.id || item.productId),
        name: item.name || item.productName || 'Honeywell Product',
        productName: item.name || item.productName || 'Honeywell Product',
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        subtotal: Number(item.price || 0) * Number(item.quantity || 1),
        image: item.image || item.imageUrl || ''
      })) : []
    };

    const url = `${API_BASE_URL}/api/orders`;
    const response = await fetch(url, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Server returned error (${response.status}): ${errText || 'Failed to create order on backend.'}`);
    }

    const resData = await response.json().catch(() => null);
    const mapped = mapOrderFromApi(resData?.order || resData?.data || resData);
    return mapped || resData;
  },

  /** PUT (Status) — PUT /api/orders/{id}/status */
  async updateStatus(id, status) {
    const url = `${API_BASE_URL}/api/orders/${id}/status`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ status: String(status) })
    });

    if (!response.ok && response.status !== 204) {
      await fetch(url, {
        method: 'PUT',
        headers: {
          ...DEFAULT_HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `status=${encodeURIComponent(status)}`
      });
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
      const errText = await response.text().catch(() => '');
      throw new Error(`Failed to delete order on server: ${errText}`);
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
      console.warn('Customer my-orders error (Server offline or error):', err.message);
      return [];
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
      console.warn(`trackOrder(${orderNumber}) error (Server offline):`, err.message);
      return null;
    }
  }
};
