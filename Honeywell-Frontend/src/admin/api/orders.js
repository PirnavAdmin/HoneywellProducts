import { getAdminToken } from '../../utils/rbac';
import { orderService } from '../../services/orderService';
import { getApiDomain } from '../../utils/apiConfig';

const BASE_URL = `${getApiDomain()}/api/orders`;

const getAdminHeaders = () => {
  const token = getAdminToken();
  return {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
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
    headers: getAdminHeaders(),
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
    const response = await fetch(`${BASE_URL}/tracking`, { headers: getAdminHeaders() });
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
    const response = await fetch(`${BASE_URL}/tracking/${id}`, { headers: getAdminHeaders() });
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
    headers: getAdminHeaders(),
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
    const response = await fetch(`${BASE_URL}/shipping`, { headers: getAdminHeaders() });
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
    const response = await fetch(`${BASE_URL}/shipping/${id}`, { headers: getAdminHeaders() });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`getOrderShipping(${id}) error (Server offline):`, err.message);
  }
  return null;
};

export const packOrder = async (id, data = {}) => {
  const response = await fetch(`${BASE_URL}/shipping/${id}/pack`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Failed to pack order (${response.status}): ${errText}`);
  }
  return await response.json();
};

export const dispatchOrder = async (id, data = {}) => {
  const response = await fetch(`${BASE_URL}/shipping/${id}/dispatch`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Failed to dispatch order (${response.status}): ${errText}`);
  }
  return await response.json();
};

export const getMyOrders = async () => {
  try {
    const response = await fetch(`${BASE_URL}/my-orders`, { headers: getAdminHeaders() });
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
      headers: getAdminHeaders()
    });
    return await response.json();
  } catch {
    return { success: true };
  }
};
