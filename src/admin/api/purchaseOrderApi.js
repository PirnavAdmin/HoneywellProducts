import { getApiDomain } from '../../utils/apiConfig';

const BASE_URL = `${getApiDomain()}/api/PurchaseOrders`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const fetchPurchaseOrders = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}${query ? '?' + query : ''}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : (data.items || data.data || []);
  } catch (error) {
    console.warn('PurchaseOrders API fetch error:', error.message);
    return [];
  }
};

export const fetchPurchaseOrderById = async (id) => {
  if (!id) return null;
  try {
    const response = await fetch(`${BASE_URL}/${id}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`PurchaseOrder API fetchById(${id}) error:`, error.message);
    return null;
  }
};

export const createPurchaseOrder = async (poData) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(poData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('PurchaseOrder API create error:', error.message);
    throw error;
  }
};

export const createPOFromIndent = async (indentId, supplierId, poData = {}) => {
  try {
    const response = await fetch(`${BASE_URL}/from-indent/${indentId}`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ supplierId, ...poData })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`PurchaseOrder API createFromIndent(${indentId}) error:`, error.message);
    throw error;
  }
};

export const updatePOStatus = async (id, status) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}/status`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`PurchaseOrder API updateStatus(${id}) error:`, error.message);
    throw error;
  }
};
