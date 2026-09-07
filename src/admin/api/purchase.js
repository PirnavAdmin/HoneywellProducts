import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';

const BASE_URL = getApiDomain();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Storage keys for offline / fallback data persistence
const STORAGE_INDENTS_KEY = 'pos_ims_purchase_indents';
const STORAGE_POS_KEY = 'pos_ims_purchase_orders';
const STORAGE_RETURNS_KEY = 'pos_ims_purchase_returns';

// Helper to get local indents
export const getLocalIndents = () => {
  try {
    const raw = localStorage.getItem(STORAGE_INDENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const saveLocalIndents = (data) => {
  localStorage.setItem(STORAGE_INDENTS_KEY, JSON.stringify(data));
};

// Helper to get local purchase orders
export const getLocalPurchaseOrders = () => {
  try {
    const raw = localStorage.getItem(STORAGE_POS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const saveLocalPurchaseOrders = (data) => {
  localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(data));
};

// Helper to get local purchase returns
export const getLocalPurchaseReturns = () => {
  try {
    const raw = localStorage.getItem(STORAGE_RETURNS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const saveLocalPurchaseReturns = (data) => {
  localStorage.setItem(STORAGE_RETURNS_KEY, JSON.stringify(data));
};

// ─── PURCHASE INDENTS API ───────────────────────────────────────────────────

export const fetchPurchaseIndents = async () => {
  try {
    const response = await api.get('/api/PurchaseIndent');
    const data = response?.data;
    const list = Array.isArray(data) ? data : data?.items || data?.data || [];
    if (list.length > 0) return list;
    return getLocalIndents();
  } catch (err) {
    console.warn('Backend /api/PurchaseIndent unavailable, loading local storage indents:', err.message);
    return getLocalIndents();
  }
};

export const createPurchaseIndent = async (indentData) => {
  try {
    const response = await api.post('/api/PurchaseIndent', indentData);
    if (response?.data) return response.data;
  } catch (err) {
    console.warn('Backend /api/PurchaseIndent POST failed, persisting locally:', err.message);
  }

  const existing = getLocalIndents();
  const nextId = existing.length > 0 ? Math.max(...existing.map(i => Number(i.id) || 0)) + 1 : 1001;
  const newIndent = {
    id: nextId,
    indentNumber: `IND-${nextId}`,
    date: new Date().toISOString().slice(0, 10),
    requestedBy: indentData.requestedBy || 'Admin User',
    warehouse: indentData.warehouse || 'Central Warehouse (WH-01)',
    priority: indentData.priority || 'Medium',
    status: 'Pending Approval',
    remarks: indentData.remarks || '',
    items: indentData.items || [],
    totalEstimatedCost: indentData.items?.reduce((sum, item) => sum + (Number(item.estimatedCost || item.price || 0) * Number(item.quantity || 1)), 0) || 0,
    createdAt: new Date().toISOString()
  };

  existing.unshift(newIndent);
  saveLocalIndents(existing);
  return newIndent;
};

export const updatePurchaseIndentStatus = async (id, status) => {
  try {
    await api.put(`/api/PurchaseIndent/${id}/status`, { status });
  } catch (err) {
    console.warn(`Backend /api/PurchaseIndent/${id}/status failed, updating locally:`, err.message);
  }

  const existing = getLocalIndents();
  const index = existing.findIndex(i => String(i.id) === String(id));
  if (index !== -1) {
    existing[index].status = status;
    saveLocalIndents(existing);
  }
  return true;
};

// ─── PURCHASE ORDERS API ────────────────────────────────────────────────────

export const fetchPurchaseOrders = async () => {
  try {
    const response = await api.get('/api/PurchaseOrder');
    const data = response?.data;
    const list = Array.isArray(data) ? data : data?.items || data?.data || [];
    if (list.length > 0) return list;
    return getLocalPurchaseOrders();
  } catch (err) {
    console.warn('Backend /api/PurchaseOrder unavailable, loading local storage orders:', err.message);
    return getLocalPurchaseOrders();
  }
};

export const createPurchaseOrder = async (poData) => {
  try {
    const response = await api.post('/api/PurchaseOrder', poData);
    if (response?.data) return response.data;
  } catch (err) {
    console.warn('Backend /api/PurchaseOrder POST failed, persisting locally:', err.message);
  }

  const existing = getLocalPurchaseOrders();
  const nextId = existing.length > 0 ? Math.max(...existing.map(p => Number(p.id) || 0)) + 1 : 5001;
  const newPO = {
    id: nextId,
    poNumber: `PO-${nextId}`,
    date: new Date().toISOString().slice(0, 10),
    indentId: poData.indentId || null,
    supplierId: poData.supplierId || '',
    supplierName: poData.supplierName || 'Unknown Supplier',
    warehouse: poData.warehouse || 'Main Warehouse',
    paymentTerms: poData.paymentTerms || 'Net 30',
    expectedDeliveryDate: poData.expectedDeliveryDate || '',
    status: 'Issued',
    remarks: poData.remarks || '',
    items: poData.items || [],
    totalAmount: poData.items?.reduce((sum, item) => sum + (Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1)), 0) || 0,
    createdAt: new Date().toISOString()
  };

  existing.unshift(newPO);
  saveLocalPurchaseOrders(existing);

  if (poData.indentId) {
    updatePurchaseIndentStatus(poData.indentId, 'PO Created');
  }

  return newPO;
};

export const updatePurchaseOrderStatus = async (id, status) => {
  try {
    await api.put(`/api/PurchaseOrder/${id}/status`, { status });
  } catch (err) {
    console.warn(`Backend /api/PurchaseOrder/${id}/status failed, updating locally:`, err.message);
  }

  const existing = getLocalPurchaseOrders();
  const index = existing.findIndex(p => String(p.id) === String(id));
  if (index !== -1) {
    existing[index].status = status;
    saveLocalPurchaseOrders(existing);
  }
  return true;
};

// ─── PURCHASE RETURNS (SUPPLIER/VENDOR RETURNS) API ───────────────────────

export const fetchPurchaseReturns = async () => {
  try {
    const response = await api.get('/api/PurchaseReturn');
    const data = response?.data;
    const list = Array.isArray(data) ? data : data?.items || data?.data || [];
    if (list.length > 0) return list;
    return getLocalPurchaseReturns();
  } catch (err) {
    console.warn('Backend /api/PurchaseReturn unavailable, loading local storage returns:', err.message);
    return getLocalPurchaseReturns();
  }
};

export const createPurchaseReturn = async (returnData) => {
  try {
    const response = await api.post('/api/PurchaseReturn', returnData);
    if (response?.data) return response.data;
  } catch (err) {
    console.warn('Backend /api/PurchaseReturn POST failed, persisting locally:', err.message);
  }

  const existing = getLocalPurchaseReturns();
  const nextId = existing.length > 0 ? Math.max(...existing.map(r => Number(r.id) || 0)) + 1 : 7001;
  const newReturn = {
    id: nextId,
    returnNumber: `PR-${nextId}`,
    date: new Date().toISOString().slice(0, 10),
    supplierId: returnData.supplierId || '',
    supplierName: returnData.supplierName || 'Supplier Vendor',
    poId: returnData.poId || null,
    reason: returnData.reason || 'Damaged / Defective Stock',
    warehouse: returnData.warehouse || 'Main Warehouse',
    status: 'Pending Vendor Approval',
    remarks: returnData.remarks || '',
    items: returnData.items || [],
    totalReturnAmount: returnData.items?.reduce((sum, item) => sum + (Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1)), 0) || 0,
    createdAt: new Date().toISOString()
  };

  existing.unshift(newReturn);
  saveLocalPurchaseReturns(existing);
  return newReturn;
};

export const updatePurchaseReturnStatus = async (id, status) => {
  try {
    await api.put(`/api/PurchaseReturn/${id}/status`, { status });
  } catch (err) {
    console.warn(`Backend /api/PurchaseReturn/${id}/status failed, updating locally:`, err.message);
  }

  const existing = getLocalPurchaseReturns();
  const index = existing.findIndex(r => String(r.id) === String(id));
  if (index !== -1) {
    existing[index].status = status;
    saveLocalPurchaseReturns(existing);
  }
  return true;
};
