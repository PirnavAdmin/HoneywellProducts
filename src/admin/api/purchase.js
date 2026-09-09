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

const STORAGE_INDENTS_KEY = 'pos_ims_purchase_indents';
const STORAGE_POS_KEY = 'pos_ims_purchase_orders';

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

// Helper to unwrap response list
const unwrapList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

// Helper to normalize indent structure for UI
export const mapPurchaseIndentFromApi = (item = {}) => {
  const id = item.id || item.Id || item.indentId || '';
  const rawNum = item.indentNumber || item.IndentNumber || item.number || '';
  const indentNumber = rawNum 
    ? (String(rawNum).startsWith('IND-') ? rawNum : `IND-${rawNum}`) 
    : (id ? `IND-${id}` : 'IND-0000');
  
  const rawDate = item.date || item.Date || item.createdAt || item.CreatedAt || '';
  const date = rawDate ? String(rawDate).slice(0, 10) : new Date().toISOString().slice(0, 10);
  
  const items = Array.isArray(item.items || item.Items) ? (item.items || item.Items) : [];
  const normalizedItems = items.map((it, idx) => ({
    productId: it.productId || it.ProductId || it.id || String(idx + 1),
    productName: it.productName || it.ProductName || it.name || it.Name || 'Product',
    sku: it.sku || it.Sku || `SKU-${it.productId || idx + 1}`,
    quantity: Number(it.quantity ?? it.Quantity ?? 1),
    estimatedCost: Number(it.estimatedCost ?? it.EstimatedCost ?? it.unitPrice ?? it.UnitPrice ?? 0)
  }));

  const calcTotal = normalizedItems.reduce(
    (sum, it) => sum + (it.estimatedCost * it.quantity), 
    0
  );
  
  const totalEstimatedCost = Number(item.totalEstimatedCost ?? item.TotalEstimatedCost ?? calcTotal);

  return {
    id: String(id || Math.floor(Math.random() * 10000)),
    indentNumber,
    date,
    requestedBy: item.requestedBy || item.RequestedBy || 'Admin User',
    warehouse: item.warehouse || item.Warehouse || 'Central Warehouse (WH-01)',
    priority: item.priority || item.Priority || 'Medium',
    status: item.status || item.Status || 'Pending Approval',
    remarks: item.remarks || item.Remarks || '',
    items: normalizedItems,
    totalEstimatedCost,
    createdAt: item.createdAt || item.CreatedAt || new Date().toISOString()
  };
};

// ─── PURCHASE INDENTS API ───────────────────────────────────────────────────

// GET /api/PurchaseIndent
export const fetchPurchaseIndents = async () => {
  try {
    const response = await api.get('/api/PurchaseIndent');
    const rawList = unwrapList(response?.data);
    const mapped = rawList.map(mapPurchaseIndentFromApi);
    if (mapped.length > 0) {
      saveLocalIndents(mapped);
      return mapped;
    }
    const local = getLocalIndents().map(mapPurchaseIndentFromApi);
    return local;
  } catch (err) {
    console.warn('API GET /api/PurchaseIndent warning, loading cached indents:', err.message);
    return getLocalIndents().map(mapPurchaseIndentFromApi);
  }
};

// GET /api/PurchaseIndent/{id}
export const fetchPurchaseIndentById = async (id) => {
  try {
    const response = await api.get(`/api/PurchaseIndent/${id}`);
    const data = response?.data?.data || response?.data || {};
    return mapPurchaseIndentFromApi(data);
  } catch (err) {
    console.warn(`API GET /api/PurchaseIndent/${id} warning:`, err.message);
    const all = await fetchPurchaseIndents();
    return all.find(i => String(i.id) === String(id)) || null;
  }
};

// POST /api/PurchaseIndent
export const createPurchaseIndent = async (indentData) => {
  const payload = {
    requestedBy: indentData.requestedBy || 'Admin User',
    warehouse: indentData.warehouse || 'Central Warehouse (WH-01)',
    priority: indentData.priority || 'Medium',
    remarks: indentData.remarks || '',
    items: (indentData.items || []).map(item => ({
      productId: item.productId || item.id || '',
      productName: item.productName || item.name || '',
      sku: item.sku || '',
      quantity: Number(item.quantity || 1),
      estimatedCost: Number(item.estimatedCost || item.price || 0)
    }))
  };

  try {
    const response = await api.post('/api/PurchaseIndent', payload);
    const createdData = response?.data?.data || response?.data;
    if (createdData && typeof createdData === 'object') {
      const mapped = mapPurchaseIndentFromApi(createdData);
      const existing = getLocalIndents();
      existing.unshift(mapped);
      saveLocalIndents(existing);
      return mapped;
    }
  } catch (err) {
    console.warn('API POST /api/PurchaseIndent warning, saving locally:', err.message);
  }

  // Local persistence fallback
  const existing = getLocalIndents();
  const nextId = existing.length > 0 ? Math.max(...existing.map(i => Number(i.id) || 0)) + 1 : 1001;
  const newIndent = mapPurchaseIndentFromApi({
    id: nextId,
    indentNumber: `IND-${nextId}`,
    date: new Date().toISOString().slice(0, 10),
    ...payload,
    status: 'Pending Approval'
  });

  existing.unshift(newIndent);
  saveLocalIndents(existing);
  return newIndent;
};

// PUT /api/PurchaseIndent/{id}/status
export const updatePurchaseIndentStatus = async (id, status) => {
  try {
    await api.put(`/api/PurchaseIndent/${id}/status`, { status }, {
      params: { status }
    });
  } catch (err) {
    console.warn(`API PUT /api/PurchaseIndent/${id}/status warning:`, err.message);
  }

  const existing = getLocalIndents();
  const index = existing.findIndex(i => String(i.id) === String(id));
  if (index !== -1) {
    existing[index].status = status;
    saveLocalIndents(existing);
  }
  return true;
};

// Helper to normalize Purchase Order structure for UI
export const mapPurchaseOrderFromApi = (item = {}) => {
  const id = item.id || item.Id || item.poId || '';
  const rawNum = item.poNumber || item.PoNumber || item.number || '';
  const poNumber = rawNum 
    ? (String(rawNum).startsWith('PO-') ? rawNum : `PO-${rawNum}`) 
    : (id ? `PO-${id}` : 'PO-0000');
  
  const rawDate = item.date || item.Date || item.createdAt || item.CreatedAt || '';
  const date = rawDate ? String(rawDate).slice(0, 10) : new Date().toISOString().slice(0, 10);
  
  const items = Array.isArray(item.items || item.Items) ? (item.items || item.Items) : [];
  const normalizedItems = items.map((it, idx) => ({
    productId: it.productId || it.ProductId || it.id || String(idx + 1),
    productName: it.productName || it.ProductName || it.name || it.Name || 'Product',
    sku: it.sku || it.Sku || `SKU-${it.productId || idx + 1}`,
    quantity: Number(it.quantity ?? it.Quantity ?? 1),
    unitPrice: Number(it.unitPrice ?? it.UnitPrice ?? it.price ?? it.Price ?? 0)
  }));

  const calcTotal = normalizedItems.reduce(
    (sum, it) => sum + (it.unitPrice * it.quantity), 
    0
  );
  
  const totalAmount = Number(item.totalAmount ?? item.TotalAmount ?? calcTotal);

  return {
    id: String(id || Math.floor(Math.random() * 10000)),
    poNumber,
    date,
    indentId: item.indentId || item.IndentId || null,
    supplierId: item.supplierId || item.SupplierId || '',
    supplierName: item.supplierName || item.SupplierName || 'Supplier Vendor',
    warehouse: item.warehouse || item.Warehouse || 'Main Warehouse (WH-01)',
    paymentTerms: item.paymentTerms || item.PaymentTerms || 'Net 30',
    expectedDeliveryDate: item.expectedDeliveryDate || item.ExpectedDeliveryDate || '',
    status: item.status || item.Status || 'Issued',
    remarks: item.remarks || item.Remarks || '',
    items: normalizedItems,
    totalAmount,
    createdAt: item.createdAt || item.CreatedAt || new Date().toISOString()
  };
};

// ─── PURCHASE ORDERS API ────────────────────────────────────────────────────

// GET /api/PurchaseOrder
export const fetchPurchaseOrders = async () => {
  try {
    const response = await api.get('/api/PurchaseOrder');
    const rawList = unwrapList(response?.data);
    const mapped = rawList.map(mapPurchaseOrderFromApi);
    if (mapped.length > 0) {
      saveLocalPurchaseOrders(mapped);
      return mapped;
    }
    return getLocalPurchaseOrders().map(mapPurchaseOrderFromApi);
  } catch (err) {
    console.warn('API GET /api/PurchaseOrder warning, loading cached orders:', err.message);
    return getLocalPurchaseOrders().map(mapPurchaseOrderFromApi);
  }
};

// GET /api/PurchaseOrder/{id}
export const fetchPurchaseOrderById = async (id) => {
  try {
    const response = await api.get(`/api/PurchaseOrder/${id}`);
    const data = response?.data?.data || response?.data || {};
    return mapPurchaseOrderFromApi(data);
  } catch (err) {
    console.warn(`API GET /api/PurchaseOrder/${id} warning:`, err.message);
    const all = await fetchPurchaseOrders();
    return all.find(p => String(p.id) === String(id)) || null;
  }
};

// POST /api/PurchaseOrder
export const createPurchaseOrder = async (poData) => {
  const payload = {
    indentId: poData.indentId ? (Number(poData.indentId) || poData.indentId) : null,
    supplierId: poData.supplierId ? (Number(poData.supplierId) || poData.supplierId) : null,
    supplierName: poData.supplierName || 'Supplier Vendor',
    warehouse: poData.warehouse || 'Main Warehouse (WH-01)',
    paymentTerms: poData.paymentTerms || 'Net 30',
    expectedDeliveryDate: poData.expectedDeliveryDate || '',
    remarks: poData.remarks || '',
    items: (poData.items || []).map(item => ({
      productId: item.productId || item.id || '',
      productName: item.productName || item.name || '',
      unitPrice: Number(item.unitPrice || item.price || 0),
      quantity: Number(item.quantity || 1)
    }))
  };

  try {
    const response = await api.post('/api/PurchaseOrder', payload);
    const createdData = response?.data?.data || response?.data;
    if (createdData && typeof createdData === 'object') {
      const mapped = mapPurchaseOrderFromApi(createdData);
      const existing = getLocalPurchaseOrders();
      existing.unshift(mapped);
      saveLocalPurchaseOrders(existing);

      if (poData.indentId) {
        updatePurchaseIndentStatus(poData.indentId, 'PO Created');
      }
      return mapped;
    }
  } catch (err) {
    console.warn('API POST /api/PurchaseOrder warning, saving locally:', err.message);
  }

  // Fallback local save
  const existing = getLocalPurchaseOrders();
  const nextId = existing.length > 0 ? Math.max(...existing.map(p => Number(p.id) || 0)) + 1 : 5001;
  const newPO = mapPurchaseOrderFromApi({
    id: nextId,
    poNumber: `PO-${nextId}`,
    date: new Date().toISOString().slice(0, 10),
    ...payload,
    status: 'Issued'
  });

  existing.unshift(newPO);
  saveLocalPurchaseOrders(existing);

  if (poData.indentId) {
    updatePurchaseIndentStatus(poData.indentId, 'PO Created');
  }

  return newPO;
};

// PUT /api/PurchaseOrder/{id}/status
export const updatePurchaseOrderStatus = async (id, status) => {
  try {
    await api.put(`/api/PurchaseOrder/${id}/status`, { status }, {
      params: { status }
    });
  } catch (err) {
    console.warn(`API PUT /api/PurchaseOrder/${id}/status warning:`, err.message);
  }

  const existing = getLocalPurchaseOrders();
  const index = existing.findIndex(p => String(p.id) === String(id));
  if (index !== -1) {
    existing[index].status = status;
    saveLocalPurchaseOrders(existing);
  }
  return true;
};
