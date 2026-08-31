import { getApiDomain } from '../utils/apiConfig';

const BASE_URL = `${getApiDomain()}/api/OrderSuccess`;

const getHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  return {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/** POST /api/OrderSuccess/place-order — Place a new customer order */
export const placeOrderSuccess = async (payload) => {
  const response = await fetch(`${BASE_URL}/place-order`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Failed to place order (${response.status})`);
  return await response.json();
};

/** GET /api/OrderSuccess/track — Track all orders */
export const trackAllOrderSuccess = async () => {
  const response = await fetch(`${BASE_URL}/track`, { headers: getHeaders() });
  if (!response.ok) throw new Error(`Failed to track orders (${response.status})`);
  return await response.json();
};

/** GET /api/OrderSuccess/track/{orderId} — Track single order */
export const trackOrderSuccess = async (orderId) => {
  const response = await fetch(`${BASE_URL}/track/${orderId}`, { headers: getHeaders() });
  if (!response.ok) throw new Error(`Failed to track order ${orderId} (${response.status})`);
  return await response.json();
};

/** GET /api/OrderSuccess/{orderId} — Fetch order details */
export const getOrderSuccess = async (orderId) => {
  const response = await fetch(`${BASE_URL}/${orderId}`, { headers: getHeaders() });
  if (!response.ok) throw new Error(`Failed to fetch order details ${orderId} (${response.status})`);
  return await response.json();
};
