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
  try {
    const response = await fetch(`${BASE_URL}/tracking`, { headers: DEFAULT_HEADERS });
    if (response.ok) {
      const backendTracking = await response.json();
      return Array.isArray(backendTracking) ? backendTracking : [];
    }
  } catch (err) {
    console.warn('getOrdersTracking error (Server offline):', err.message);
  }
  return [];
};

export const getOrderTracking = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/tracking/${id}`, { headers: DEFAULT_HEADERS });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`getOrderTracking(${id}) error (Server offline):`, err.message);
  }
  return null;
};

export const postOrderTracking = async (id, trackingData) => {
  const response = await fetch(`${BASE_URL}/tracking/${id}`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(trackingData),
  });
  if (!response.ok) {
    throw new Error(`Failed to update tracking (${response.status})`);
  }
  return await response.json().catch(() => ({ success: true }));
};

/** Shipping endpoints */
export const getOrdersShipping = async () => {
  try {
    const response = await fetch(`${BASE_URL}/shipping`, { headers: DEFAULT_HEADERS });
    if (response.ok) {
      const backendShipping = await response.json();
      return Array.isArray(backendShipping) ? backendShipping : [];
    }
  } catch (err) {
    console.warn('getOrdersShipping error (Server offline):', err.message);
  }
  return [];
};

export const getOrderShipping = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/shipping/${id}`, { headers: DEFAULT_HEADERS });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`getOrderShipping(${id}) error (Server offline):`, err.message);
  }
  return null;
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
