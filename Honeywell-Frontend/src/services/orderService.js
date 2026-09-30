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
  /** GET (All) — GET /api/orders */
  async getAll() {
    let apiList = [];
    try {
      const data = await apiRequest('/api/orders');
      const list = Array.isArray(data) ? data : (data.orders || data.items || data.data || []);
      apiList = list.map(mapOrderFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Orders API getAll() error:', err.message);
    }

    // Always merge with client stored orders (deduplicated by orderNumber or id)
    let localList = [];
    try {
      const r1 = JSON.parse(localStorage.getItem('my_recent_orders') || '[]');
      const r2 = JSON.parse(localStorage.getItem('honeywell_orders') || '[]');
      localList = [...r1, ...r2].map(mapOrderFromApi).filter(Boolean);
    } catch (e) {}

    const seen = new Set();
    const merged = [];
    for (const o of [...localList, ...apiList]) {
      const key = String(o.orderNumber || o.id || '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(o);
      }
    }
    return merged;
  },

  /** GET (ById) — GET /api/orders/{id} */
  async getById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/orders/${id}`);
      const mapped = mapOrderFromApi(data.order || data.data || data);
      if (mapped) return mapped;
    } catch (err) {}

    try {
      const r1 = JSON.parse(localStorage.getItem('my_recent_orders') || '[]');
      const r2 = JSON.parse(localStorage.getItem('honeywell_orders') || '[]');
      const found = [...r1, ...r2].find(o => 
        String(o.id) === String(id) || 
        String(o.orderNumber).toLowerCase() === String(id).toLowerCase()
      );
      if (found) return mapOrderFromApi(found);
    } catch (e) {}

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

  /** POST (Create) — POST /api/orders */
  async create(payload) {
    const activeCustomerId = payload.customerId || Number(localStorage.getItem('customerId') || 0);
    const orderNumber = payload.orderNumber || `ORD-${Date.now()}`;
    const cleanAddress = [payload.address || payload.shippingAddress, payload.city, payload.state, payload.pinCode].filter(Boolean).join(', ') || payload.address || '';

    const createdOrder = {
      id: String(Date.now()),
      orderNumber,
      orderNo: orderNumber,
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
      total: Number(payload.totalAmount || payload.total || 0),
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
      })) : [],
      createdAt: new Date().toISOString(),
      orderDate: new Date().toISOString()
    };

    // Cache order locally immediately so it instantly reflects in user account & orders ledger
    try {
      const existingRecent = JSON.parse(localStorage.getItem('my_recent_orders') || '[]');
      const updatedRecent = [createdOrder, ...existingRecent.filter(o => o.orderNumber !== createdOrder.orderNumber && o.id !== createdOrder.id)];
      localStorage.setItem('my_recent_orders', JSON.stringify(updatedRecent));

      const existingOrders = JSON.parse(localStorage.getItem('honeywell_orders') || '[]');
      const updatedOrders = [createdOrder, ...existingOrders.filter(o => o.orderNumber !== createdOrder.orderNumber && o.id !== createdOrder.id)];
      localStorage.setItem('honeywell_orders', JSON.stringify(updatedOrders));
    } catch (e) {}

    // Synchronize to backend server
    const apiPayload = {
      orderNumber: createdOrder.orderNumber,
      customerId: createdOrder.customerId,
      customerName: createdOrder.customerName,
      email: createdOrder.email,
      mobile: createdOrder.mobile,
      phone: createdOrder.mobile,
      address: createdOrder.address,
      shippingAddress: createdOrder.shippingAddress,
      city: createdOrder.city,
      state: createdOrder.state,
      district: createdOrder.district,
      pinCode: createdOrder.pinCode,
      totalAmount: createdOrder.totalAmount,
      finalAmount: createdOrder.finalAmount,
      paymentMethod: createdOrder.paymentMethod,
      paymentStatus: createdOrder.paymentStatus,
      status: createdOrder.status,
      items: createdOrder.items
    };

    try {
      const url = `${API_BASE_URL}/api/orders`;
      const response = await fetch(url, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(apiPayload)
      });

      if (response.ok) {
        const resData = await response.json().catch(() => null);
        const mapped = mapOrderFromApi(resData?.order || resData?.data || resData);
        if (mapped) {
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Backend /api/orders sync note:', err.message);
    }

    return createdOrder;
  },

  /** PUT (Status) — PUT /api/orders/{id}/status */
  async updateStatus(id, status) {
    // 1. Update local storage caches immediately
    try {
      const updateList = (key) => {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = list.map(o => {
          if (String(o.id) === String(id) || String(o.orderNumber) === String(id)) {
            return { ...o, status, orderStatus: status };
          }
          return o;
        });
        localStorage.setItem(key, JSON.stringify(updated));
      };
      updateList('my_recent_orders');
      updateList('honeywell_orders');
    } catch (e) {}

    // 2. Dispatch to backend
    const url = `${API_BASE_URL}/api/orders/${id}/status`;
    try {
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
    } catch (err) {
      console.warn(`Note: Backend updateStatus for ID ${id}:`, err.message);
    }

    return { success: true, id, status };
  },

  /** DELETE — DELETE /api/orders/{id} */
  async delete(id) {
    // 1. Remove from local storage caches immediately
    try {
      const filterList = (key) => {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = list.filter(o => String(o.id) !== String(id) && String(o.orderNumber) !== String(id));
        localStorage.setItem(key, JSON.stringify(updated));
      };
      filterList('my_recent_orders');
      filterList('honeywell_orders');
    } catch (e) {}

    // 2. Dispatch to backend
    const url = `${API_BASE_URL}/api/orders/${id}`;
    try {
      await fetch(url, {
        method: 'DELETE',
        headers: DEFAULT_HEADERS
      });
    } catch (err) {
      console.warn(`Note: Backend delete for ID ${id}:`, err.message);
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
