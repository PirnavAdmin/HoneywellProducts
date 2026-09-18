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
    return rawList.map(mapPurchaseIndentFromApi);
  } catch (err) {
    console.warn('API GET /api/PurchaseIndent error:', err.message);
    return [];
  }
};

// GET /api/PurchaseIndent/{id}
export const fetchPurchaseIndentById = async (id) => {
  try {
    const response = await api.get(`/api/PurchaseIndent/${id}`);
    const data = response?.data?.data || response?.data || {};
    return mapPurchaseIndentFromApi(data);
  } catch (err) {
    console.warn(`API GET /api/PurchaseIndent/${id} error:`, err.message);
    return null;
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

  const response = await api.post('/api/PurchaseIndent', payload);
  const createdData = response?.data?.data || response?.data;
  if (createdData && typeof createdData === 'object') {
    return mapPurchaseIndentFromApi(createdData);
  }
  throw new Error('Failed to create purchase indent via API');
};

// PUT /api/PurchaseIndent/{id}/status
export const updatePurchaseIndentStatus = async (id, status) => {
  await api.put(`/api/PurchaseIndent/${id}/status`, { status }, {
    params: { status }
  });
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
    return rawList.map(mapPurchaseOrderFromApi);
  } catch (err) {
    console.warn('API GET /api/PurchaseOrder error:', err.message);
    return [];
  }
};

// GET /api/PurchaseOrder/{id}
export const fetchPurchaseOrderById = async (id) => {
  try {
    const response = await api.get(`/api/PurchaseOrder/${id}`);
    const data = response?.data?.data || response?.data || {};
    return mapPurchaseOrderFromApi(data);
  } catch (err) {
    console.warn(`API GET /api/PurchaseOrder/${id} error:`, err.message);
    return null;
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

  const response = await api.post('/api/PurchaseOrder', payload);
  const createdData = response?.data?.data || response?.data;
  if (createdData && typeof createdData === 'object') {
    const mapped = mapPurchaseOrderFromApi(createdData);
    if (poData.indentId) {
      try {
        await updatePurchaseIndentStatus(poData.indentId, 'PO Created');
      } catch (e) {}
    }
    return mapped;
  }
  throw new Error('Failed to create purchase order via API');
};

// PUT /api/PurchaseOrder/{id}/status
export const updatePurchaseOrderStatus = async (id, status) => {
  await api.put(`/api/PurchaseOrder/${id}/status`, { status }, {
    params: { status }
  });
  return true;
};
