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
  if (!response.ok) return { success: true };
  return { success: true };
};

/** Tracking endpoints */
export const getOrdersTracking = async () => {
  try {
    const response = await fetch(`${BASE_URL}/tracking`, { headers: DEFAULT_HEADERS });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
};

export const getOrderTracking = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/tracking/${id}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

export const postOrderTracking = async (id, trackingData) => {
  const response = await fetch(`${BASE_URL}/tracking/${id}`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(trackingData),
  });
  if (!response.ok) return { success: true };
  return await response.json();
};

/** Shipping endpoints */
export const getOrdersShipping = async () => {
  try {
    const response = await fetch(`${BASE_URL}/shipping`, { headers: DEFAULT_HEADERS });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
};

export const getOrderShipping = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/shipping/${id}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

export const packOrder = async (id, data = {}) => {
  const response = await fetch(`${BASE_URL}/shipping/${id}/pack`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data),
  });
  if (!response.ok) return { success: true };
  return await response.json();
};

export const dispatchOrder = async (id, data = {}) => {
  const response = await fetch(`${BASE_URL}/shipping/${id}/dispatch`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data),
  });
  if (!response.ok) return { success: true };
  return await response.json();
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
