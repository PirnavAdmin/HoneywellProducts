import { orderService } from '../../services/orderService';
import { getApiDomain } from '../../utils/apiConfig';

const BASE_URL = `${getApiDomain()}/api/orders`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

/** GET /api/orders — fetch all orders */
export const getOrders = async () => {
  return await orderService.getAll();
};

/** GET /api/orders/{id} — fetch single order details */
export const getOrder = async (id) => {
  return await orderService.getById(id);
};

/** GET /api/orders/{id}/invoice — fetch tax invoice details */
export const getOrderInvoice = async (id) => {
  return await orderService.getInvoice(id);
};

/** POST /api/orders — create new order */
export const createOrder = async (payload) => {
  return await orderService.create(payload);
};

/** PUT /api/orders/{id}/status — update order status */
export const updateOrderStatus = async (id, status) => {
  return await orderService.updateStatus(id, status);
};

/** DELETE /api/orders/{id} — cancel/delete order */
export const deleteOrder = async (id) => {
  return await orderService.delete(id);
};

/** Custom: Update Payment Status */
export const updateOrderPaymentStatus = async (id, paymentStatus, paidAmount) => {
  const response = await fetch(`${BASE_URL}/${id}/payment-status`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ paymentStatus, paidAmount }),
  });
  if (!response.ok && response.status !== 204) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Failed to update order payment status (${response.status}): ${errorText}`);
  }
  return { success: true, id, paymentStatus, paidAmount };
};

/** Tracking endpoints */
export const getOrdersTracking = async () => {
  let backendTracking = [];
  try {
    const response = await fetch(`${BASE_URL}/tracking`, { headers: DEFAULT_HEADERS });
    if (response.ok) {
      backendTracking = await response.json();
    }
  } catch {}

  let allOrders = [];
  try {
    allOrders = await orderService.getAll();
  } catch {}

  const merged = [];
  const seen = new Set();

  for (const o of allOrders) {
    const key = String(o.orderNumber || o.id || '').toUpperCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push({
        id: o.id,
        orderId: o.id,
        orderNumber: o.orderNumber || `ORD-${o.id}`,
        customerName: o.customerName || o.customer || 'Customer',
        customerPhone: o.mobile || o.phone || '',
        finalAmount: Number(o.totalAmount || o.total || 0),
        status: o.status || 'Processing',
        currentStatus: o.status || 'Processing',
        items: o.items || []
      });
    }
  }

  for (const t of (Array.isArray(backendTracking) ? backendTracking : [])) {
    const key = String(t.orderNumber || t.orderId || t.id || '').toUpperCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(t);
    }
  }

  return merged;
};

export const getOrderTracking = async (id) => {
  let backendData = null;
  try {
    const response = await fetch(`${BASE_URL}/tracking/${id}`, { headers: DEFAULT_HEADERS });
    if (response.ok) {
      backendData = await response.json();
    }
  } catch {}

  const fullOrder = await orderService.getById(id);

  if (backendData && (backendData.orderId || backendData.id)) {
    return {
      ...backendData,
      currentStatus: fullOrder?.status || backendData.currentStatus || backendData.status || 'Processing',
      customerName: fullOrder?.customerName || backendData.customerName,
      customerPhone: fullOrder?.mobile || backendData.customerPhone,
      customerEmail: fullOrder?.email || backendData.customerEmail,
      shippingAddress: fullOrder?.address || backendData.shippingAddress,
      items: fullOrder?.items?.length ? fullOrder.items : backendData.items
    };
  }

  if (fullOrder) {
    const currentStatus = fullOrder.status || 'Processing';
    return {
      id: fullOrder.id,
      orderId: fullOrder.id,
      orderNumber: fullOrder.orderNumber,
      customerName: fullOrder.customerName,
      customerPhone: fullOrder.mobile,
      customerEmail: fullOrder.email,
      shippingAddress: fullOrder.address,
      finalAmount: fullOrder.totalAmount,
      totalAmount: fullOrder.totalAmount,
      currentStatus: currentStatus,
      status: currentStatus,
      carrierName: fullOrder.logistics || 'Delhivery Express',
      trackingNumber: fullOrder.trackingNo || `AWB-${fullOrder.id || Date.now()}`,
      items: fullOrder.items || [],
      timelineLogs: fullOrder.timeline || [
        { status: 'Confirmed', date: new Date(fullOrder.createdAt || Date.now()).toLocaleDateString(), time: new Date(fullOrder.createdAt || Date.now()).toLocaleTimeString(), description: 'Order confirmed and verified.' },
        { status: currentStatus, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), description: `Order status is currently ${currentStatus}.` }
      ]
    };
  }

  return backendData;
};

export const postOrderTracking = async (id, trackingData) => {
  if (trackingData?.status) {
    await orderService.updateStatus(id, trackingData.status).catch(() => {});
  }

  try {
    const response = await fetch(`${BASE_URL}/tracking/${id}`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(trackingData),
    });
    if (response.ok) {
      return await response.json().catch(() => ({ success: true }));
    }
  } catch (err) {
    console.warn(`Note: Backend postOrderTracking for ${id}:`, err.message);
  }

  return { success: true, id, ...trackingData };
};

/** Shipping endpoints */
export const getOrdersShipping = async () => {
  let backendShipping = [];
  try {
    const response = await fetch(`${BASE_URL}/shipping`, { headers: DEFAULT_HEADERS });
    if (response.ok) {
      backendShipping = await response.json();
    }
  } catch {}

  let allOrders = [];
  try {
    allOrders = await orderService.getAll();
  } catch {}

  const merged = [];
  const seen = new Set();

  for (const o of allOrders) {
    const key = String(o.orderNumber || o.id || '').toUpperCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push({
        id: o.id,
        orderId: o.id,
        orderNumber: o.orderNumber || `ORD-${o.id}`,
        customerName: o.customerName || o.customer || 'Customer',
        customerPhone: o.mobile || o.phone || '',
        finalAmount: Number(o.totalAmount || o.total || 0),
        status: o.status || 'Processing',
        currentStatus: o.status || 'Processing',
        items: o.items || []
      });
    }
  }

  for (const s of (Array.isArray(backendShipping) ? backendShipping : [])) {
    const key = String(s.orderNumber || s.orderId || s.id || '').toUpperCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(s);
    }
  }

  return merged;
};

export const getOrderShipping = async (id) => {
  let backendData = null;
  try {
    const response = await fetch(`${BASE_URL}/shipping/${id}`, { headers: DEFAULT_HEADERS });
    if (response.ok) {
      backendData = await response.json();
    }
  } catch {}

  const fullOrder = await orderService.getById(id);

  if (backendData && (backendData.orderId || backendData.id)) {
    return {
      ...backendData,
      currentStatus: fullOrder?.status || backendData.currentStatus || backendData.status || 'Processing',
      customerName: fullOrder?.customerName || backendData.customerName,
      customerPhone: fullOrder?.mobile || backendData.customerPhone,
      customerEmail: fullOrder?.email || backendData.customerEmail,
      shippingAddress: fullOrder?.address || backendData.shippingAddress,
      items: fullOrder?.items?.length ? fullOrder.items : backendData.items
    };
  }

  if (fullOrder) {
    return {
      id: fullOrder.id,
      orderId: fullOrder.id,
      orderNumber: fullOrder.orderNumber,
      customerName: fullOrder.customerName,
      customerPhone: fullOrder.mobile,
      customerEmail: fullOrder.email,
      shippingAddress: fullOrder.address,
      finalAmount: fullOrder.totalAmount,
      totalAmount: fullOrder.totalAmount,
      currentStatus: fullOrder.status || 'Processing',
      status: fullOrder.status || 'Processing',
      items: fullOrder.items || []
    };
  }

  return backendData;
};

export const packOrder = async (id, data = {}) => {
  await orderService.updateStatus(id, 'Packed').catch(() => {});
  try {
    const response = await fetch(`${BASE_URL}/shipping/${id}/pack`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });
    if (response.ok) return await response.json().catch(() => ({ success: true }));
  } catch {}
  return { success: true };
};

export const dispatchOrder = async (id, data = {}) => {
  await orderService.updateStatus(id, 'Dispatched').catch(() => {});
  try {
    const response = await fetch(`${BASE_URL}/shipping/${id}/dispatch`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });
    if (response.ok) return await response.json().catch(() => ({ success: true }));
  } catch {}
  return { success: true };
};

export const getMyOrders = async () => {
  try {
    const response = await fetch(`${BASE_URL}/my-orders`, { headers: DEFAULT_HEADERS });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
};

export const cleanupTestOrders = async () => {
  try {
    const response = await fetch(`${BASE_URL}/cleanup-test-orders`, {
      method: 'POST',
      headers: DEFAULT_HEADERS
    });
    return await response.json();
  } catch {
    return { success: true };
  }
};
