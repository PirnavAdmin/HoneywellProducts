import { getApiDomain } from '../../utils/apiConfig';

const BASE_URL = `${getApiDomain()}/api/PurchaseIndents`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const fetchPurchaseIndents = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}${query ? '?' + query : ''}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : (data.items || data.data || []);
  } catch (error) {
    console.warn('PurchaseIndents API fetch error:', error.message);
    return [];
  }
};

export const fetchPurchaseIndentById = async (id) => {
  if (!id) return null;
  try {
    const response = await fetch(`${BASE_URL}/${id}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`PurchaseIndent API fetchById(${id}) error:`, error.message);
    return null;
  }
};

export const createPurchaseIndent = async (indentData) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(indentData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('PurchaseIndent API create error:', error.message);
    throw error;
  }
};

export const updatePurchaseIndentStatus = async (id, status, notes = '') => {
  try {
    const response = await fetch(`${BASE_URL}/${id}/status`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ status, notes })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`PurchaseIndent API updateStatus(${id}) error:`, error.message);
    throw error;
  }
};
